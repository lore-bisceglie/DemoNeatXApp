import { createHash, randomBytes } from "crypto";

const EMAIL_VERIFICATION_PREFIX = "v3-";
const PASSWORD_RESET_PREFIX = "pr1-";
export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

export type AccountToken = {
  rawToken: string;
  storedToken: string;
  expiresAt: Date;
};

export function hashAccountToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createAccountToken(prefix: string, ttlMs: number, now = new Date()): AccountToken {
  const rawToken = `${prefix}${randomBytes(32).toString("hex")}`;
  return {
    rawToken,
    storedToken: hashAccountToken(rawToken),
    expiresAt: new Date(now.getTime() + ttlMs),
  };
}

export function createEmailVerificationToken(now = new Date()) {
  return createAccountToken(EMAIL_VERIFICATION_PREFIX, EMAIL_VERIFICATION_TTL_MS, now);
}

export function storedEmailVerificationToken(rawToken: string) {
  return rawToken.startsWith(EMAIL_VERIFICATION_PREFIX)
    ? hashAccountToken(rawToken)
    : rawToken;
}

export function createPasswordResetToken(now = new Date()) {
  return createAccountToken(PASSWORD_RESET_PREFIX, PASSWORD_RESET_TTL_MS, now);
}

export function shouldSendWelcomeAfterVerification(rawToken: string) {
  return rawToken.startsWith("v2-") || rawToken.startsWith(EMAIL_VERIFICATION_PREFIX);
}
