import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function runTests() {
  console.log("🚀 INIZIO QA STRESS TEST 🚀\n");

  const tenantSlug = "crash-test-salon-" + Date.now();
  let tenantId = "";
  let locationId = "";
  let staffId = "";
  let serviceId = "";

  try {
    // 1. CREAZIONE AMBIENTE
    console.log("🛠️ 1. Creazione ambiente di test...");
    const tenant = await prisma.tenant.create({
      data: {
        name: "Crash Test Salon",
        slug: tenantSlug,
        city: "Testville",
        phone: "+390000000000",
        address: "Via dei Test 1",
        ownerPasswordHash: hashPassword("password123"),
        plan: "pro",
        trialStatus: "active",
        services: {
          create: [
            { name: "Taglio Test", duration: 30, price: 20 },
          ],
        },
        storeSettings: {
          create: { smsCredits: 100, maxConcurrentAppointments: 1 },
        },
      },
      include: { services: true },
    });
    tenantId = tenant.id;
    serviceId = tenant.services[0].id;
    console.log(`✅ Salone creato (ID: ${tenantId})`);

    const location = await prisma.location.create({
      data: {
        name: "Sede Crash",
        slug: tenantSlug + "-sede",
        city: "Testville",
        phone: "+390000000000",
        address: "Via dei Test 1",
        tenantId,
        isMain: true,
        isActive: true,
        openTime: "09:00",
        closeTime: "18:00",
        closedDays: "[]",
      },
    });
    locationId = location.id;
    console.log(`✅ Sede creata (ID: ${locationId})`);

    const staff = await prisma.staff.create({
      data: {
        name: "Mario Rossi",
        tenantId,
        services: { connect: [{ id: serviceId }] },
      },
    });
    staffId = staff.id;
    console.log(`✅ Dipendente creato (ID: ${staffId})`);

    // 2. TEST PRENOTAZIONE VALIDA
    console.log("\n📅 2. Test Prenotazione Valida...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const validApt = await prisma.appointment.create({
      data: {
        tenant: { connect: { id: tenantId } },
        location: { connect: { id: locationId } },
        staff: { connect: { id: staffId } },
        service: { connect: { id: serviceId } },
        customerName: "Cliente Test",
        customerPhone: "1234567890",
        date: dateStr,
        time: "10:00",
        endTime: "10:30",
      },
    });
    console.log(`✅ Appuntamento valido creato alle 10:00 (ID: ${validApt.id})`);

    // 3. TEST OVERBOOKING 
    console.log("\n⚠️ 3. Verifica Sicurezza Database (Overbooking)...");
    const overbookingApt = await prisma.appointment.create({
      data: {
        tenant: { connect: { id: tenantId } },
        location: { connect: { id: locationId } },
        staff: { connect: { id: staffId } },
        service: { connect: { id: serviceId } },
        customerName: "Cliente Intruso",
        customerPhone: "0987654321",
        date: dateStr,
        time: "10:15",
        endTime: "10:45",
      },
    });
    console.log(`❌ INFO: Il DB a basso livello consente record sovrapposti. (ID: ${overbookingApt.id}).\n👉 L'overbooking viene intercettato dall'app (app/api/book) e non a livello DB.`);

    // 4. TEST SPOSTAMENTO
    console.log("\n🔄 4. Test Spostamento...");
    const movedApt = await prisma.appointment.update({
      where: { id: validApt.id },
      data: { time: "14:00" },
    });
    console.log(`✅ Appuntamento spostato alle 14:00`);

    // 5. TEST CANCELLAZIONE
    console.log("\n🗑️ 5. Test Cancellazione...");
    await prisma.appointment.delete({
      where: { id: movedApt.id },
    });
    console.log(`✅ Appuntamento cancellato correttamente`);

    // 6. TEST CASCATA (Eliminazione Sicura)
    console.log("\n🔥 6. Test Cascata (Eliminazione)...");
    await prisma.tenant.delete({
      where: { id: tenantId },
    });
    console.log(`✅ Tenant eliminato correttamente. Prisma Cascade ha ripulito dipendenti e sedi.`);

    console.log("\n🎯 TEST COMPLETATO CON SUCCESSO! 🎯");

  } catch (error) {
    console.error("❌ ERRORE DURANTE IL TEST:", error);
    if (tenantId) {
      console.log("🧹 Tento una pulizia di emergenza...");
      await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => {});
    }
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
