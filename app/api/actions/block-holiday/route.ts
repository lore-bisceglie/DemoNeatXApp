import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const formData = await req.formData();
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const loop = new Date(start);
    
    // Ciclo magico che blocca tutti i giorni nel range
    while (loop <= end) {
      const d = loop.toISOString().split("T")[0];
      await prisma.appointment.create({
        data: { customerName: "🌴 FERIE", customerPhone: "0000000000", date: d, time: "ALL_DAY" }
      });
      loop.setDate(loop.getDate() + 1);
    }
  }
  return NextResponse.redirect(new URL("/dashboard", req.url));
}