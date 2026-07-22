import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTenantSms } from "@/lib/sms";
import { appointmentManagementSelect, canManageAppointment } from "@/lib/appointment-management";

// Recupera i dati dell'appuntamento dal token segreto
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) return NextResponse.json({ appointment: null });

    const appointment = await prisma.appointment.findUnique({
      where: { cancelToken: token },
      select: appointmentManagementSelect,
    });

    let tenantPhone: string | null = null;
    if (appointment?.tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: appointment.tenantId },
        select: { phone: true },
      });
      tenantPhone = tenant?.phone ?? null;
    }

    return NextResponse.json({
      appointment,
      tenantPhone,
      canManage: appointment ? canManageAppointment(appointment) : false,
    });
  } catch (error) {
    console.error("Errore recupero appuntamento:", error);
    return NextResponse.json({ appointment: null });
  }
}

// Elimina l'appuntamento dal database (transazione atomica)
export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ success: false, error: "Token mancante" }, { status: 400 });
    }

    // Transazione atomica: delete appuntamento + waitlist FIFO
    const result = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { cancelToken: token },
        select: {
          id: true,
          tenantId: true,
          customerPhone: true,
          customerName: true,
          date: true,
          time: true,
          endTime: true,
          locationId: true,
          service: { select: { duration: true } },
        },
      });
      if (!appointment) return null;
      if (!canManageAppointment(appointment)) return { expired: true as const };

      await tx.appointment.delete({ where: { id: appointment.id } });

      if (appointment.tenantId) {
        await tx.activityLog.create({
          data: {
            action: "CANCEL_APPOINTMENT",
            actor: "client",
            message: `${appointment.customerName} ha disdetto l'appuntamento dal sito`,
            appointmentId: appointment.id,
            customerName: appointment.customerName,
            customerPhone: appointment.customerPhone,
            date: appointment.date,
            time: appointment.time,
            tenantId: appointment.tenantId,
          },
        });
      }

      // Waitlist FIFO atomica
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

      let tenantPhone: string | null = null;
      const tenant = await tx.tenant.findUnique({
        where: { id: appointment.tenantId ?? "" },
        select: { phone: true },
      });
      tenantPhone = tenant?.phone ?? null;

      return { ...appointment, tenantPhone, waitlistEntry };
    }, { isolationLevel: "Serializable" });

    if (!result) {
      return NextResponse.json({ success: true, alreadyCancelled: true });
    }
    if ("expired" in result) {
      return NextResponse.json(
        { success: false, error: "L'appuntamento è già concluso e non può più essere annullato" },
        { status: 410 },
      );
    }

    // Side effects FUORI transazione (SMS)
    const tid = result.tenantId as string;
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
      const t = await prisma.tenant.findUnique({
        where: { id: tid },
        select: { name: true, slug: true },
      });
      if (t?.slug) {
        const bookingUrl = `https://${t.slug}.neatx.store`;
        const msg = `🎉 ${t.name} - Posto Liberato!\nCiao ${result.waitlistEntry.name}, si è liberato un posto per il ${result.date.split('-').reverse().join('/')}. Prenotalo subito: ${bookingUrl}`;
        await sendTenantSms(tid, result.waitlistEntry.phone, msg);
      }
    }

    return NextResponse.json({ success: true, tenantPhone: result.tenantPhone });
  } catch (error) {
    console.error("Errore eliminazione appuntamento:", error);
    return NextResponse.json({ success: false });
  }
}
