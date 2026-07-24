import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { requireTenantAdminOrDemo } from "@/lib/demo-access";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Parametri mancanti" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        customerPhone: true,
        customerName: true,
        date: true,
        time: true,
      },
    });

    if (!appointment || !appointment.tenantId) {
      return NextResponse.json(
        { error: "Appuntamento non trovato" },
        { status: 404 }
      );
    }

    const tenantId = appointment.tenantId;
    const authError = await requireTenantAdminOrDemo(request, tenantId, "no-show", 30);
    if (authError) return authError;

    await prisma.$transaction([
      prisma.noShow.create({
        data: {
          customerPhone: appointment.customerPhone,
          customerName: appointment.customerName,
          date: appointment.date,
          tenantId,
        },
      }),
      prisma.appointment.delete({ where: { id } }),
    ]);

    await logActivity({
      action: "NO_SHOW",
      actor: "admin",
      message: `${appointment.customerName} segnato come assente (No-Show)`,
      appointmentId: id,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      date: appointment.date,
      time: appointment.time,
      tenantId,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Errore registrazione No-Show:", error);

    return NextResponse.json(
      { error: "Errore interno" },
      { status: 500 }
    );
  }
}

// DELETE: Forgive no-shows (by single ID or by phone+tenantId to clear all for a customer)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const noShowId = searchParams.get("id");
    const phone = searchParams.get("phone");
    const tenantIdParam = searchParams.get("tenantId");

    if (!noShowId && (!phone || !tenantIdParam)) {
      return NextResponse.json({ error: "Parametri mancanti (id oppure phone+tenantId)" }, { status: 400 });
    }

    // Mode 1: Delete all no-shows for a phone number in a tenant
    if (phone && tenantIdParam) {
      const authError = await requireTenantAdminOrDemo(request, tenantIdParam, "forgive-noshow", 30);
      if (authError) return authError;

      const deleted = await prisma.noShow.deleteMany({
        where: { customerPhone: phone, tenantId: tenantIdParam },
      });

      await logActivity({
        action: "NOSHOW_FORGIVEN",
        actor: "admin",
        message: `Tutti i No-Show (${deleted.count}) perdonati per ${phone}`,
        customerPhone: phone,
        tenantId: tenantIdParam,
      });

      return NextResponse.json({ success: true, deleted: deleted.count });
    }

    // Mode 2: Delete a single no-show by ID
    const noShow = await prisma.noShow.findUnique({
      where: { id: noShowId! },
      select: { id: true, tenantId: true, customerPhone: true, customerName: true, date: true },
    });

    if (!noShow || !noShow.tenantId) {
      return NextResponse.json({ error: "No-Show non trovato" }, { status: 404 });
    }

    const authError = await requireTenantAdminOrDemo(request, noShow.tenantId, "forgive-noshow", 30);
    if (authError) return authError;

    await prisma.noShow.delete({ where: { id: noShowId! } });

    await logActivity({
      action: "NOSHOW_FORGIVEN",
      actor: "admin",
      message: `No-Show perdonato per ${noShow.customerName || noShow.customerPhone} (${noShow.date})`,
      customerName: noShow.customerName,
      customerPhone: noShow.customerPhone,
      date: noShow.date,
      tenantId: noShow.tenantId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore rimozione No-Show:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

