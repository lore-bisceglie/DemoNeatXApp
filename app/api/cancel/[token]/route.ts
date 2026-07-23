import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTenantSms } from "@/lib/sms";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token: tokenFromParams } = await context.params;
    const { searchParams } = new URL(request.url);
    const token = tokenFromParams || searchParams.get("token");
    if (!token) return NextResponse.json({ appointment: null });

    const appointment = await prisma.appointment.findUnique({
      where: { cancelToken: token },
      select: {
        id: true, date: true, time: true, customerName: true,
        tenantId: true, cancelToken: true,
        service: { select: { name: true } },
      },
    });

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Errore recupero appuntamento da token:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token: tokenFromParams } = await context.params;
    const body = await request.json().catch(() => ({}));
    const token = body.token || tokenFromParams;

    if (!token) {
      return NextResponse.json({ error: "Token mancante" }, { status: 400 });
    }

    // Transazione atomica: delete appuntamento + waitlist FIFO
    const result = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { cancelToken: token },
        select: { id: true, tenantId: true, customerPhone: true, customerName: true, date: true, time: true, locationId: true },
      });
      if (!appointment) return null;

      await tx.appointment.delete({ where: { id: appointment.id } });

      // Waitlist FIFO atomica (read + delete dentro la stessa transazione)
      let waitlistEntry: { name: string; phone: string } | null = null;
      if (appointment.tenantId && appointment.date) {
        const entry = await tx.waitlist.findFirst({
          where: { tenantId: appointment.tenantId, date: appointment.date },
          orderBy: { createdAt: "asc" },
        });
        if (entry) {
          await tx.waitlist.delete({ where: { id: entry.id } });
          waitlistEntry = { name: entry.name, phone: entry.phone };
        }
      }

      return { ...appointment, waitlistEntry };
    }, { isolationLevel: "Serializable" });

    if (!result) {
      return NextResponse.json({ success: true, alreadyCancelled: true });
    }

    // Side effects FUORI dalla transazione (SMS, notifiche)
    // Side effects FUORI dalla transazione (SMS, notifiche)
    const tid = result.tenantId!;
    if (result.customerPhone && result.customerPhone !== "0000000000") {
      const tenant = await prisma.tenant.findUnique({ where: { id: tid } });
      if (tenant) {
        const smsBody = `❌ ${tenant.name} - Cancellazione Confermata\nCiao ${result.customerName.trim()}, abbiamo cancellato il tuo appuntamento del ${result.date.split('-').reverse().join('/')} alle ${result.time}. Alla prossima!`;
        await sendTenantSms(tid, result.customerPhone, smsBody, undefined, result.locationId ?? undefined);
      }
    }

    if (result.locationId) {
      const loc = await prisma.location.findUnique({
        where: { id: result.locationId },
        select: { phone: true, name: true },
      });
      if (loc?.phone) {
        const notifBody = `❌ ${result.customerName} ha cancellato\n${result.date.split('-').reverse().join('/')} alle ${result.time}\nSede: ${loc.name}`;
        await sendTenantSms(tid, loc.phone, notifBody, undefined, result.locationId);
      }
    }

    if (result.waitlistEntry) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tid },
        select: { name: true, slug: true },
      });
      if (tenant?.slug) {
        const bookingUrl = `https://${tenant.slug}.neatx.store`;
        const smsBody = `🎉 ${tenant.name} - Posto Liberato!\nCiao ${result.waitlistEntry.name}, si è liberato un posto per il ${result.date.split('-').reverse().join('/')}. Prenotalo subito: ${bookingUrl}`;
        await sendTenantSms(tid, result.waitlistEntry.phone, smsBody, undefined, result.locationId ?? undefined);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore cancellazione appuntamento:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
