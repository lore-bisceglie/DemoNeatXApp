import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache"; // 🌟 Importazione fondamentale per svuotare la cache

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  if (id) {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    
    if (appointment) {
      await prisma.appointment.delete({ where: { id } });
      
      if (appointment.tenantId) {
        await logActivity({
          action: "DELETE_APPOINTMENT",
          actor: "admin",
          message: `${appointment.customerName} è stato rimosso dall'agenda`,
          appointmentId: appointment.id,
          customerName: appointment.customerName,
          customerPhone: appointment.customerPhone,
          date: appointment.date,
          time: appointment.time,
          tenantId: appointment.tenantId,
        });
      }
    }

    revalidatePath("/dashboard"); // 🚀 Forza il server a rigenerare l'agenda senza dati vecchi!
  }
  
  return NextResponse.json({ success: true });
}