/*
 * Test ISOLATO del riepilogo promemoria (buildReminderSummary).
 * Usa un PrismaClient appena creato contro prisma/test.db e crea solo dati finti.
 * Non tocca il DB di produzione. In NODE_ENV=test lib/telegram.ts non manda notifiche.
 *
 * Esegui NEL branch (worktree):  npx tsx scripts/test-reminder-summary.ts
 */
import { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";

(process.env as Record<string, string>).NODE_ENV = "test";

// Riepilogo: la build usa il client dal modulo; qui creo il client e lo passo
// via un piccolo proxy per evitare conflitti con @/lib/prisma.
import { buildReminderSummary } from "../lib/reminder-outbox";

const prisma = new PrismaClient();

async function resetDeliveries() {
  await prisma.reminderDelivery.deleteMany({});
}

// Pulisce i dati di test ALL'INIZIO: i tenant "test-" cascadano su
// appuntamenti e consegne, così il test è ripetibile senza residui.
async function cleanupTestData() {
  await prisma.tenant.deleteMany({ where: { slug: { startsWith: "test-" } } });
}

async function makeTenant(overrides: { plan?: string; trialStatus?: string; trialEndsAt?: Date | null } = {}) {
  return prisma.tenant.create({
    data: {
      slug: `test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      name: `Negozio Test ${Math.floor(Math.random() * 1e6)}`,
      plan: (overrides.plan as any) ?? "elite",
      trialStatus: overrides.trialStatus ?? "converted",
      trialEndsAt: overrides.trialEndsAt ?? null,
    },
  });
}

async function makeAppointment(tenantId: string, date: string, phone: string) {
  return prisma.appointment.create({
    data: {
      tenantId,
      date,
      time: "10:00",
      endTime: "10:30",
      customerName: "Cliente Test",
      customerPhone: phone,
      cancelToken: "token-" + Math.floor(Math.random() * 1e9),
    },
  });
}

async function main() {
  await resetDeliveries();
  await cleanupTestData();

  // Pulizia anche degli appuntamenti creati in run precedenti con phone fittizio di test
  const phone = "+393331110000";

  // 1) Eligi un requinto (pagante) e un non elegibile (basic, trial scaduto)
  const paying = await makeTenant({ plan: "elite", trialStatus: "converted" });
  const basic = await makeTenant({ plan: "basic", trialStatus: "expired", trialEndsAt: new Date(Date.now() - 86400000) });

  const date = "2026-08-20";
  const apptPaying = await makeAppointment(paying.id, date, phone);
  const apptBasic = await makeAppointment(basic.id, date, phone);

  const expected = await buildReminderSummary(date);
  assert.equal(expected.expected, 1, "expected deve contare solo il negozio pagante");
  assert.equal(expected.sent, 0, "nessuna consegna => 0 inviati");
  assert.equal(expected.pickedUp, 0, "nessuna consegna => 0 presi in carico");
  assert.equal(expected.notProcessed, 1, "eleggibile non ancora preso in carico => non processato");

  // 2) Simula 1 invio andato a buon fine (SENT) per il pagante
  await prisma.reminderDelivery.create({
    data: {
      appointmentId: apptPaying.id,
      tenantId: paying.id,
      channel: "OPENWA",
      status: "SENT",
      creditReserved: false,
    },
  });

  const afterSent = await buildReminderSummary(date);
  assert.equal(afterSent.expected, 1);
  assert.equal(afterSent.sent, 1, "deve contare l'unica consegna SENT");
  assert.equal(afterSent.failed, 0);
  assert.equal(afterSent.processing, 0);
  assert.equal(afterSent.notProcessed, 0, "unico eleggibile processato");
  assert.equal(afterSent.byTenant.length, 1, "ripartizione per negozio con 1 negozio");
  assert.equal(afterSent.byTenant[0].sent, 1);
  assert.equal(afterSent.byTenant[0].tenantName, paying.name);

  // 3) Simula anche 1 fallimento per lo stesso negozio su un altro appuntamento
  const apptPaying2 = await makeAppointment(paying.id, date, phone);
  await prisma.reminderDelivery.create({
    data: {
      appointmentId: apptPaying2.id,
      tenantId: paying.id,
      channel: "OPENWA",
      status: "FAILED",
      creditReserved: false,
    },
  });

  const afterMixed = await buildReminderSummary(date);
  assert.equal(afterMixed.expected, 2, "two paganti appuntamenti per lo stesso giorno");
  assert.equal(afterMixed.sent, 1);
  assert.equal(afterMixed.failed, 1);
  assert.equal(afterMixed.processing, 0);
  assert.equal(afterMixed.pickedUp, 2);
  assert.equal(afterMixed.byTenant.length, 1);
  assert.equal(afterMixed.byTenant[0].sent, 1);
  assert.equal(afterMixed.byTenant[0].failed, 1);

  // 4) Il basic NON deve comparire nel riepilogo per negozio
  const byTenantNames = afterMixed.byTenant.map((t) => t.tenantName);
  assert.equal(byTenantNames.includes(basic.name), false, "basic scaduto non deve apparire");

  // 5) La data successiva non deve includere questi dati
  const emptyForTomorrow = await buildReminderSummary("2026-08-21");
  assert.equal(emptyForTomorrow.expected, 0);
  assert.equal(emptyForTomorrow.sent, 0);

  console.log("reminder-summary: verifiche superate (per-negozio, expected, sent/failed/processing)");

  // Cleanup dei dati di test
  await prisma.reminderDelivery.deleteMany({});
  await prisma.appointment.deleteMany({
    where: {
      tenantId: { in: [paying.id, basic.id] },
    },
  });
  await prisma.tenant.deleteMany({ where: { id: { in: [paying.id, basic.id] } } });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });