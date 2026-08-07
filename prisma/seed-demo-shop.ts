/**
 * Riempie il negozio demo "demo-neatx" con lo scheletro completo di un'attività
 * reale: sedi, staff, orari, descrizione, social e impostazioni.
 *
 * Da eseguire UNA volta (o quando serve ripristinare lo "scheletro"):
 *   set -a && source .env.local && set +a && npx tsx prisma/seed-demo-shop.ts
 *
 * NOTA: il DB locale (via .env.local) punta alla produzione Neon, quindi questo
 * script modifica il tenant demo in produzione. I dati sono demo e protetti.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_SLUG = "demo-neatx";

const demoStaff = [
  {
    name: "Marco Barbiere",
    serviceKeywords: ["Barbiere", "Fisioterapia"],
    commissionRate: 20,
  },
  {
    name: "Giulia Estetista",
    serviceKeywords: ["Beauty", "Massaggi"],
    commissionRate: 20,
  },
  {
    name: "Sofia Nails",
    serviceKeywords: ["Nails"],
    commissionRate: 20,
  },
  {
    name: "Luca Tattoo",
    serviceKeywords: ["Tattoo", "Studio privato"],
    commissionRate: 25,
  },
  {
    name: "Elena Parrucchiera",
    serviceKeywords: ["Parrucchiere", "Piega"],
    commissionRate: 20,
  },
];

const demoLocations = [
  {
    slug: "sede-centrale",
    name: "Sede Centrale",
    address: "Via Roma 12, Milano",
    city: "Milano",
    phone: "023456789",
    mapsLink: "https://maps.google.com/?q=Via+Roma+12+Milano",
    isMain: true,
    openTime: "09:00",
    closeTime: "19:00",
    breakStart: "13:00",
    breakEnd: "14:00",
    closedDays: JSON.stringify([0, 1]), // domenica + lunedì
  },
  {
    slug: "sede-duomo",
    name: "Sede Milano Duomo",
    address: "Piazza del Duomo 5, Milano",
    city: "Milano",
    phone: "029876543",
    mapsLink: "https://maps.google.com/?q=Piazza+del+Duomo+5+Milano",
    isMain: false,
    openTime: "10:00",
    closeTime: "20:00",
    breakStart: "14:00",
    breakEnd: "15:00",
    closedDays: JSON.stringify([0]), // solo domenica
  },
];

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: DEMO_SLUG } });
  if (!tenant) {
    console.error(`Tenant "${DEMO_SLUG}" non trovato. Esegui prima prisma/seed.ts`);
    process.exit(1);
  }
  const tenantId = tenant.id;
  console.log(`Tenant demo trovato: ${tenant.name} (${tenantId})`);

  // 1. Aggiorna il Tenant con i campi dello "scheletro"
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: "Demo NeatX Multi-Attività",
      category: "Multi-Attività",
      city: "Milano",
      description:
        "Un salone demo con tutto dentro: barbiere, estetica, nails, tatuaggi e studio privato. Prenota liberamente con nomi e numeri finti per vedere come funziona NeatX.",
      address: "Via Roma 12, Milano",
      phone: "023456789",
      instagramUrl: "https://www.instagram.com/demoneatx",
      mapsLink: "https://maps.google.com/?q=Via+Roma+12+Milano",
      themeColor: "cyan",
      openTime: "09:00",
      closeTime: "19:00",
      breakStart: "13:00",
      breakEnd: "14:00",
      closedDays: JSON.stringify([0, 1]), // domenica + lunedì
      trialStatus: "demo", // attiva la modalità playground
      trialEndsAt,
      isDemoData: true,
    },
  });
  console.log("1. Tenant aggiornato (trialStatus=demo, orari, indirizzo, Instagram)");

  // 2. Servizi (li mantiene e aggiorna, dal seed principale)
  const demoServices = [
    { name: "Barbiere - Taglio uomo", duration: 30, price: 15 },
    { name: "Parrucchiere - Piega", duration: 45, price: 28 },
    { name: "Beauty - Pulizia viso", duration: 45, price: 40 },
    { name: "Nails - Semipermanente", duration: 60, price: 35 },
    { name: "Massaggi - Relax total body", duration: 60, price: 55 },
    { name: "Tattoo - Consulenza progetto", duration: 30, price: 20 },
    { name: "Fisioterapia - Valutazione", duration: 45, price: 50 },
    { name: "Studio privato - Consulenza", duration: 30, price: 35 },
  ];
  const serviceMap = new Map<string, { id: string }>();
  for (const service of demoServices) {
    const existing = await prisma.service.findFirst({
      where: { tenantId, name: service.name },
    });
    if (existing) {
      await prisma.service.update({ where: { id: existing.id }, data: service });
      serviceMap.set(service.name, existing);
    } else {
      const created = await prisma.service.create({ data: { ...service, tenantId } });
      serviceMap.set(service.name, created);
    }
  }
  console.log(`2. Servizi pronti (${serviceMap.size})`);

  // 3. Sedi
  await prisma.location.deleteMany({ where: { tenantId } });
  const locationIds: string[] = [];
  for (const loc of demoLocations) {
    const created = await prisma.location.create({
      data: {
        ...loc,
        tenantId,
        settings: { create: { smsCredits: 50, paymentStrategy: "OFF" } },
      },
    });
    locationIds.push(created.id);
  }
  console.log(`3. Sedi create (${locationIds.length})`);

  // 4. Staff
  await prisma.staff.deleteMany({ where: { tenantId } });
  const allServices = await prisma.service.findMany({ where: { tenantId } });
  for (const member of demoStaff) {
    const realServiceIds = allServices
      .filter((s) => member.serviceKeywords.some((kw) => s.name.toLowerCase().includes(kw.toLowerCase())))
      .map((s) => s.id);

    await prisma.staff.create({
      data: {
        name: member.name,
        tenantId,
        commissionRate: member.commissionRate,
        locationId: locationIds[0],
        services: { connect: realServiceIds.map((id) => ({ id })) },
        locations: { create: locationIds.map((locId) => ({ locationId: locId })) },
      },
    });
  }
  console.log(`4. Staff creato (${demoStaff.length})`);
  console.log("\n=== DONE ===");
  console.log("Demo negozio riempito. Verifica: /t/demo-neatx");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
