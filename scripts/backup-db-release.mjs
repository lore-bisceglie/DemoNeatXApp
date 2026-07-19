import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { writeFile, readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const output = process.argv[2];
if (!output) throw new Error("Percorso backup mancante");
const secret = process.env.DATABASE_BACKUP_KEY || process.env.CRON_SECRET || process.env.SESSION_SECRET;
if (!secret) throw new Error("DATABASE_BACKUP_KEY, CRON_SECRET o SESSION_SECRET non configurato");

const prisma = new PrismaClient();
const tableNames = [
  "Tenant", "Location", "LocationSettings", "ServiceLocation", "Service",
  "Appointment", "BlockedSlot", "StoreSettings", "NoShow", "Waitlist",
  "CustomerNote", "Lead", "ActivityLog", "Staff", "StaffLocation",
];

try {
  const tables = {};
  for (const name of tableNames) {
    // I nomi provengono esclusivamente dalla whitelist statica qui sopra.
    tables[name] = await prisma.$queryRawUnsafe(`SELECT * FROM "${name}"`);
  }
  const payload = Buffer.from(JSON.stringify({
    format: "neatx-prisma-backup-v1",
    createdAt: new Date().toISOString(),
    tables,
  }));
  const compressed = gzipSync(payload, { level: 9 });
  const key = createHash("sha256").update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const tag = cipher.getAuthTag();
  const file = Buffer.concat([Buffer.from("NEATXDB1"), iv, tag, encrypted]);
  await writeFile(output, file, { mode: 0o600 });

  const stored = await readFile(output);
  const storedIv = stored.subarray(8, 20);
  const storedTag = stored.subarray(20, 36);
  const decipher = createDecipheriv("aes-256-gcm", key, storedIv);
  decipher.setAuthTag(storedTag);
  const restored = JSON.parse(gunzipSync(Buffer.concat([
    decipher.update(stored.subarray(36)), decipher.final(),
  ])).toString("utf8"));
  if (restored.format !== "neatx-prisma-backup-v1") throw new Error("Verifica formato backup fallita");

  console.log(JSON.stringify({
    verified: true,
    sha256: createHash("sha256").update(stored).digest("hex"),
    byteLength: stored.length,
    rowCounts: Object.fromEntries(tableNames.map((name) => [name, restored.tables[name].length])),
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
