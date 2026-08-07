/**
 * Genera i link di accesso dipendente per tutti i collaboratori del negozio demo.
 *
 * Da eseguire UNA volta (o per rigenerare i link):
 *   set -a && source .env.local && set +a && npx tsx prisma/seed-demo-staff-links.ts
 *
 * Ogni collaboratore ottiene un token univoco salvato come hash nel DB.
 * Il link stampato permette di aprire il portale dipendente (agenda, ferie, permessi).
 */
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

// lib/staff-access.ts ha "import 'server-only'" e non può essere usato da uno
// script tsx. Reimplementiamo qui le due funzioni token (stesso formato, così
// findStaffByAccessToken in lib/staff-access.ts le riconosce).
function createStaffAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashStaffAccessToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: "demo-neatx" } });
  if (!tenant) {
    console.error('Tenant "demo-neatx" non trovato. Esegui prima prisma/seed.ts');
    process.exit(1);
  }

  const staffList = await prisma.staff.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, name: true },
  });

  if (staffList.length === 0) {
    console.error("Nessun collaboratore trovato per la demo. Esegui prisma/seed-demo-shop.ts");
    process.exit(1);
  }

  console.log(`Genero i link di accesso per ${staffList.length} collaboratori...\n`);

  for (const member of staffList) {
    const token = createStaffAccessToken();
    await prisma.staff.update({
      where: { id: member.id },
      data: {
        staffAccessTokenHash: hashStaffAccessToken(token),
        staffAccessTokenCreatedAt: new Date(),
        staffAccessTokenRevokedAt: null,
        staffAccessLastUsedAt: null,
      },
    });
    console.log(`• ${member.name}\n  ${process.env.NEXT_PUBLIC_APP_URL || "https://neatx.store"}/staff/${token}\n`);
  }

  console.log("=== DONE ===\nLink staff generati e attivi per la demo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
