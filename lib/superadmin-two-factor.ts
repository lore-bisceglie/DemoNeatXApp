import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getSessionSigningSecret } from "@/lib/auth";

const TOTP_STEP_SECONDS = 30;
const SETUP_TOKEN_MAX_AGE_SECONDS = 10 * 60;
const PENDING_TOKEN_MAX_AGE_SECONDS = 5 * 60;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function getSecretKey() {
  const password = process.env.SUPERADMIN_PASSWORD;
  if (password) return createHash("sha256").update(`neatx-superadmin-totp-v2\0${password}`).digest("hex");
  return getSessionSigningSecret();
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function toBase32(bytes: Buffer) {
  let bits = 0;
  let value = 0;
  let result = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return bits > 0 ? result + BASE32_ALPHABET[(value << (5 - bits)) & 31] : result;
}

function fromBase32(value: string) {
  let bits = 0;
  let current = 0;
  const bytes: number[] = [];
  for (const char of value.toUpperCase().replace(/[^A-Z2-7]/g, "")) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) continue;
    current = (current << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((current >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function createSignedToken(kind: string, value: string, maxAgeSeconds: number) {
  const expires = Date.now() + maxAgeSeconds * 1000;
  const payload = `${kind}.${value}.${expires}`;
  const signature = createHmac("sha256", getSecretKey()).update(payload).digest("base64url");
  return `v1.${payload}.${signature}`;
}

function readSignedToken(token: string | null | undefined, kind: string) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 5 || parts[0] !== "v1" || parts[1] !== kind) return null;
  const [, , value, expiresValue, signature] = parts;
  const expires = Number(expiresValue);
  if (!Number.isFinite(expires) || expires <= Date.now()) return null;
  const payload = `${kind}.${value}.${expiresValue}`;
  const expected = createHmac("sha256", getSecretKey()).update(payload).digest("base64url");
  return safeEqual(signature, expected) ? value : null;
}

export function createTotpSecret() {
  return toBase32(randomBytes(20));
}

export function createTotpUri(secret: string) {
  const issuer = "NeatX";
  return `otpauth://totp/${encodeURIComponent(`${issuer}:Super Admin`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=${TOTP_STEP_SECONDS}`;
}

function generateTotp(secret: string, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / 1000 / TOTP_STEP_SECONDS);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", fromBase32(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(binary % 1_000_000).padStart(6, "0");
}

export function verifyTotpCode(secret: string, code: string) {
  const normalized = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  return [-1, 0, 1].some((window) => safeEqual(normalized, generateTotp(secret, Date.now() + window * TOTP_STEP_SECONDS * 1000)));
}

export function encryptTotpSecret(secret: string) {
  const key = createHash("sha256").update(`${getSecretKey()}\0neatx-superadmin-totp-v1`).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${encrypted.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}`;
}

export function decryptTotpSecret(value: string) {
  const [version, ivValue, encryptedValue, tagValue] = value.split(".");
  if (version !== "v1" || !ivValue || !encryptedValue || !tagValue) throw new Error("Segreto 2FA non valido");
  const key = createHash("sha256").update(`${getSecretKey()}\0neatx-superadmin-totp-v1`).digest();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
}

export function createRecoveryCodes() {
  return Array.from({ length: 8 }, () => `${randomBytes(3).toString("hex").toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`);
}

export function hashRecoveryCode(code: string) {
  return createHash("sha256").update(`${getSecretKey()}\0recovery\0${code.trim().toUpperCase()}`).digest("hex");
}

export function createTwoFactorSetupToken(secret: string) {
  return createSignedToken("setup", secret, SETUP_TOKEN_MAX_AGE_SECONDS);
}

export function readTwoFactorSetupToken(token: string | null | undefined) {
  return readSignedToken(token, "setup");
}

export function createPendingTwoFactorToken() {
  return createSignedToken("pending", "superadmin", PENDING_TOKEN_MAX_AGE_SECONDS);
}

export function hasPendingTwoFactorToken(token: string | null | undefined) {
  return readSignedToken(token, "pending") === "superadmin";
}
