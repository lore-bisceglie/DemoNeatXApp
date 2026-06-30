import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

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

    return NextResponse.json({ appointment });
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

    if (appointment) {
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
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore eliminazione appuntamento:", error);
    return NextResponse.json({ success: false });
  }
}
