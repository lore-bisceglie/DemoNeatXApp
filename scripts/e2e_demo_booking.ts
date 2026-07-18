import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_TENANT_ID = "cmqtds1840000yyqbd23x1jdj";
const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:3102";

type DemoService = { id: string; name: string };
type BookingResponse = {
  success?: boolean;
  cancelToken?: string;
  appointment?: { id: string; source: string; tenantId: string | null };
  error?: string;
};

const isoDate = (date: Date) => date.toISOString().split("T")[0];

async function main() {
  const serviceResponse = await fetch(`${BASE_URL}/api/demo/services`);
  if (!serviceResponse.ok) throw new Error(`Servizi demo non disponibili (${serviceResponse.status})`);

  const servicePayload = (await serviceResponse.json()) as { services?: DemoService[] };
  const service = servicePayload.services?.[0];
  if (!service) throw new Error("Nessun servizio demo disponibile");

  let chosenDate = "";
  let chosenSlot = "";
  let rescheduleSlot = "";

  for (let offset = 2; offset <= 16; offset += 1) {
    const candidate = new Date();
    candidate.setDate(candidate.getDate() + offset);
    const date = isoDate(candidate);
    const waitlistCount = await prisma.waitlist.count({
      where: { tenantId: DEMO_TENANT_ID, date },
    });
    if (waitlistCount > 0) continue;

    const availabilityResponse = await fetch(
      `${BASE_URL}/api/availability?tenantId=${DEMO_TENANT_ID}&date=${date}&serviceId=${service.id}`,
    );
    if (!availabilityResponse.ok) continue;
    const availability = (await availabilityResponse.json()) as { slots?: string[] };
    if (availability.slots?.length) {
      chosenDate = date;
      chosenSlot = availability.slots[availability.slots.length - 1]!;
      rescheduleSlot = availability.slots[0]!;
      break;
    }
  }

  if (!chosenDate || !chosenSlot) throw new Error("Nessuno slot demo sicuro disponibile per il test");

  const marker = `QA E2E ${Date.now()}`;
  let appointmentId: string | undefined;

  try {
    const bookingResponse = await fetch(`${BASE_URL}/api/book`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerName: marker,
        customerPhone: "0000000000",
        date: chosenDate,
        time: chosenSlot,
        tenantId: DEMO_TENANT_ID,
        serviceId: service.id,
        paymentMethod: "salon",
        source: "E2E_QA",
        privacyAccepted: true,
        honey: "",
      }),
    });
    const booking = (await bookingResponse.json()) as BookingResponse;
    if (!bookingResponse.ok || !booking.success || !booking.appointment?.id || !booking.cancelToken) {
      throw new Error(booking.error || `Prenotazione fallita (${bookingResponse.status})`);
    }

    appointmentId = booking.appointment.id;
    if (booking.appointment.tenantId !== DEMO_TENANT_ID || booking.appointment.source !== "E2E_QA") {
      throw new Error("La prenotazione creata non corrisponde al test isolato");
    }

    const stored = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!stored || stored.customerName !== marker) throw new Error("Prenotazione non salvata correttamente");

    const rescheduleResponse = await fetch(
      `${BASE_URL}/api/reschedule/${booking.cancelToken}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date: chosenDate, time: rescheduleSlot }),
      },
    );
    const reschedulePayload = (await rescheduleResponse.json()) as {
      appointment?: { id: string; time: string };
      error?: string;
    };
    if (
      !rescheduleResponse.ok ||
      reschedulePayload.appointment?.id !== appointmentId ||
      reschedulePayload.appointment.time !== rescheduleSlot
    ) {
      throw new Error(
        reschedulePayload.error || `Spostamento fallito (${rescheduleResponse.status})`,
      );
    }

    const afterReschedule = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (afterReschedule?.time !== rescheduleSlot) {
      throw new Error("Spostamento non persistito correttamente");
    }

    const cancelResponse = await fetch(`${BASE_URL}/api/cancel`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: booking.cancelToken }),
    });
    const cancellation = (await cancelResponse.json()) as { success?: boolean };
    if (!cancelResponse.ok || !cancellation.success) throw new Error("Annullamento del test fallito");

    const afterCancellation = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (afterCancellation) throw new Error("La prenotazione risulta ancora presente dopo l'annullamento");

    console.log(
      JSON.stringify({
        success: true,
        service: service.name,
        date: chosenDate,
        slot: chosenSlot,
        bookingPersisted: true,
        reschedulePersisted: true,
        cancellationPersisted: true,
        cleanupCompleted: true,
      }),
    );
  } finally {
    if (appointmentId) {
      await prisma.appointment.deleteMany({
        where: { id: appointmentId, tenantId: DEMO_TENANT_ID, source: "E2E_QA" },
      });
      await prisma.activityLog.deleteMany({
        where: { appointmentId, tenantId: DEMO_TENANT_ID },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error("Test E2E demo non riuscito:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
