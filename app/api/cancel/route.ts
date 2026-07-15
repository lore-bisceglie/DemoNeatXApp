import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { sendTenantSms } from "@/lib/sms";

// Recupera i dati dell'appuntamento dal token segreto
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) return NextResponse.json({ appointment: null });

    const appointment = await prisma.appointment.findUnique({
      where: { cancelToken: token },
      include: { service: true },
    });

    let tenantPhone: string | null = null;
    if (appointment?.tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: appointment.tenantId },
        select: { phone: true },
      });
      tenantPhone = tenant?.phone ?? null;
    }

    return NextResponse.json({ appointment, tenantPhone });
  } catch (error) {
    console.error("Errore recupero appuntamento:", error);
    return NextResponse.json({ appointment: null });
  }
}

// Elimina fisicamente l'appuntamento dal database
export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    
    const appointment = await prisma.appointment.findUnique({
      where: { cancelToken: token },
    });

    let tenantPhone: string | null = null;

    if (appointment) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: appointment.tenantId ?? "" },
        select: { phone: true },
      });
      tenantPhone = tenant?.phone ?? null;

      await prisma.appointment.delete({
        where: { id: appointment.id }
      });
      
      if (appointment.tenantId) {
        await logActivity({
          action: "CANCEL_APPOINTMENT",
          actor: "client",
          message: `${appointment.customerName} ha disdetto l'appuntamento dal sito`,
          appointmentId: appointment.id,
          customerName: appointment.customerName,
          customerPhone: appointment.customerPhone,
          date: appointment.date,
          time: appointment.time,
          tenantId: appointment.tenantId,
        });
      }

      // Notifica alla sede
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

      // Avviso automatico lista d'attesa (FIFO)
      if (appointment.tenantId && appointment.date) {
        const waitlistEntry = await prisma.waitlist.findFirst({
          where: {
            tenantId: appointment.tenantId,
            date: appointment.date,
            OR: [
              { preferredTime: appointment.time },
              { preferredTime: null },
            ]
          },
          orderBy: { createdAt: "asc" },
        });

        if (waitlistEntry) {
          const t = await prisma.tenant.findUnique({
            where: { id: appointment.tenantId },
            select: { name: true, slug: true },
          });

          if (t && t.slug) {
            const bookingUrl = `https://${t.slug}.neatx.store`;
            const msg = `🎉 ${t.name} - Posto Liberato!\nCiao ${waitlistEntry.name}, si è liberato un posto per il ${appointment.date.split('-').reverse().join('/')}. Prenotalo subito: ${bookingUrl}`;
            await sendTenantSms(appointment.tenantId, waitlistEntry.phone, msg);
          }

          await prisma.waitlist.delete({ where: { id: waitlistEntry.id } });
        }
      }
    }

    return NextResponse.json({ success: true, tenantPhone });
  } catch (error) {
    console.error("Errore eliminazione appuntamento:", error);
    return NextResponse.json({ success: false });
  }
}
