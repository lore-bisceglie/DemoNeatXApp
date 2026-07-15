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

    if (!token) {
      return NextResponse.json({
        appointment: null,
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        cancelToken: token,
      },
      include: {
        service: true,
      },
    });

    return NextResponse.json({
      appointment,
    });
  } catch (error) {
    console.error("Errore recupero appuntamento da token:", error);

    return NextResponse.json(
      { error: "Errore interno" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Token mancante" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        cancelToken: token,
      },
    });

    if (appointment) {
      await prisma.appointment.delete({
        where: {
          id: appointment.id,
        },
      });

      // 🌟 INVIO SMS CANCELLAZIONE
      if (appointment.tenantId && appointment.customerPhone && appointment.customerPhone !== "0000000000") {
        const tenant = await prisma.tenant.findUnique({ where: { id: appointment.tenantId } });
        if (tenant) {
          const smsBody = `❌ ${tenant.name} - Cancellazione Confermata\nCiao ${appointment.customerName.trim()}, abbiamo cancellato il tuo appuntamento del ${appointment.date.split('-').reverse().join('/')} alle ${appointment.time}. Alla prossima!`;
          await sendTenantSms(appointment.tenantId, appointment.customerPhone, smsBody, undefined, appointment.locationId || undefined);
        }
      }

      // 🌟 NOTIFICA ALLA SEDE
      if (appointment.tenantId && appointment.locationId) {
        const loc = await prisma.location.findUnique({
          where: { id: appointment.locationId },
          select: { phone: true, name: true },
        });
        if (loc && loc.phone) {
          const notifBody = `❌ ${appointment.customerName} ha cancellato\n${appointment.date.split('-').reverse().join('/')} alle ${appointment.time}\nSede: ${loc.name}`;
          await sendTenantSms(appointment.tenantId, loc.phone, notifBody, undefined, appointment.locationId);
        }
      }

      // 🌟 AVVISO AUTOMATICO LISTA D'ATTESA (FIFO)
      if (appointment.tenantId && appointment.date) {
        const waitlistEntry = await prisma.waitlist.findFirst({
          where: {
            tenantId: appointment.tenantId,
            date: appointment.date,
            // Se l'utente ha specificato un orario preferito, usa quello; altrimenti qualsiasi per quella data
            OR: [
              { preferredTime: appointment.time },
              { preferredTime: null },
            ]
          },
          orderBy: { createdAt: "asc" },
        });

        if (waitlistEntry) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: appointment.tenantId },
            select: { name: true, slug: true },
          });

          if (tenant && tenant.slug) {
            const bookingUrl = `https://${tenant.slug}.neatx.store`;
            const smsBody = `🎉 ${tenant.name} - Posto Liberato!\nCiao ${waitlistEntry.name}, si è liberato un posto per il ${appointment.date.split('-').reverse().join('/')}. Prenotalo subito: ${bookingUrl}`;
            await sendTenantSms(appointment.tenantId, waitlistEntry.phone, smsBody, undefined, appointment.locationId || undefined);
          }

          await prisma.waitlist.delete({ where: { id: waitlistEntry.id } });
        }
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Errore cancellazione appuntamento:", error);

    return NextResponse.json(
      { error: "Errore interno" },
      { status: 500 }
    );
  }
}