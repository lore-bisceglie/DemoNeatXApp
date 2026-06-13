import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const formData = await req.formData();
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const datesToCheck: string[] = [];
    const checkLoop = new Date(start);
    while (checkLoop <= end) {
      datesToCheck.push(checkLoop.toISOString().split("T")[0]);
      checkLoop.setDate(checkLoop.getDate() + 1);
    }

    const existingRealAppointments = await prisma.appointment.findFirst({
      where: {
        date: { in: datesToCheck },
        NOT: {
          OR: [
            { customerName: { contains: "PAUSA" } },
            { customerName: { contains: "FERIE" } }
          ]
        }
      }
    });

    if (existingRealAppointments) {
      // 🚨 LA NOSTRA SPIA SEGRETA 🚨
      return NextResponse.redirect(new URL("/dashboard?error=SCUDO_FERIE_ATTIVO", req.url));
    }

    const loop = new Date(start);
    while (loop <= end) {
      const d = loop.toISOString().split("T")[0];
      await prisma.appointment.deleteMany({
        where: { date: d, OR: [{ customerName: { contains: "PAUSA" } }, { customerName: { contains: "FERIE" } }] }
      });
      await prisma.appointment.create({
        data: { customerName: "🌴 FERIE", customerPhone: "0000000000", date: d, time: "ALL_DAY" }
      });
      loop.setDate(loop.getDate() + 1);
    }
  }
  return NextResponse.redirect(new URL("/dashboard", req.url));
}