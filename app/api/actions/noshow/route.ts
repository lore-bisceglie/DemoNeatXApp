import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

const DEMO_TENANT_ID = "cmqtds1840000yyqbd23x1jdj";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");
    const phone = searchParams.get("phone");
    const name = searchParams.get("name");
    const date = searchParams.get("date");

    if (!id || !phone || !date) {
      return NextResponse.json(
        { error: "Parametri mancanti" },
        { status: 400 }
      );
    }

    await prisma.noShow.create({
      data: {
        customerPhone: phone,
        customerName: name || "Sconosciuto",
        date,
        tenantId: DEMO_TENANT_ID,
      },
    });

    await prisma.appointment.delete({
      where: {
        id,
      },
    });

    await logActivity({
      action: "NO_SHOW",
      actor: "admin",
      message: `${name || "Sconosciuto"} segnato come assente (No-Show)`,
      appointmentId: id,
      customerName: name || "Sconosciuto",
      customerPhone: phone,
      date: date,
      tenantId: DEMO_TENANT_ID,
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
