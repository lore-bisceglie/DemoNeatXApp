import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Date mancanti" },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findFirst();

    if (!tenant) {
      return NextResponse.json(
        { error: "Nessun salone configurato" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return NextResponse.json(
        { error: "Intervallo date non valido" },
        { status: 400 }
      );
    }

    const datesToBlock: string[] = [];
    const loop = new Date(start);

    while (loop <= end) {
      datesToBlock.push(loop.toISOString().split("T")[0]);
      loop.setDate(loop.getDate() + 1);
    }

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        tenantId: tenant.id,
        date: {
          in: datesToBlock,
        },
        customerName: {
          notIn: ["☕ PAUSA", "🌴 FERIE"],
        },
      },
    });

    if (existingAppointments.length > 0) {
      return NextResponse.redirect(
        new URL("/dashboard?error=MULTIPLE_CONFLICTS", req.url)
      );
    }

    for (const date of datesToBlock) {
      const existingHoliday = await prisma.appointment.findFirst({
        where: {
          tenantId: tenant.id,
          date,
          time: "ALL_DAY",
          customerName: "🌴 FERIE",
        },
      });

      if (!existingHoliday) {
        await prisma.appointment.create({
          data: {
            customerName: "🌴 FERIE",
            customerPhone: "0000000000",
            date,
            time: "ALL_DAY",
            tenantId: tenant.id,
            cancelToken: crypto.randomUUID(),
          },
        });
      }
    }

    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    console.error("Errore blocco ferie:", error);

    return NextResponse.json(
      { error: "Errore interno" },
      { status: 500 }
    );
  }
}
