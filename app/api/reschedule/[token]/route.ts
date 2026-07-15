import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const timeToMins = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const minsToTime = (mins: number) => {
  const hours = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (mins % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await request.json();
    const date = String(body.date || "");
    const time = String(body.time || "");

    if (!token || !date || !time) {
      return NextResponse.json(
        { error: "Dati spostamento mancanti" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { cancelToken: token },
      include: { service: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appuntamento non trovato" },
        { status: 404 }
      );
    }

    const duration = appointment.service?.duration || 15;
    const startMins = timeToMins(time);
    const endMins = startMins + duration;
    const endTime = minsToTime(endMins);

    const appointments = await prisma.appointment.findMany({
      where: {
        date,
        tenantId: appointment.tenantId,
        id: {
          not: appointment.id,
        },
      },
      select: {
        time: true,
        endTime: true,
        staffId: true,
      },
    });

    const hasOverlap = appointments.some((app) => {
      if (app.time === "ALL_DAY") return true;
      const appStart = timeToMins(app.time);
      const appEnd = app.endTime ? timeToMins(app.endTime) : appStart + 15;
      // Se entrambi hanno staffId diverso, non sono in conflitto
      if (appointment.staffId && app.staffId && appointment.staffId !== app.staffId) return false;
      return Math.max(startMins, appStart) < Math.min(endMins, appEnd);
    });

    if (hasOverlap) {
      return NextResponse.json(
        { error: "Questo orario non è più disponibile." },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: appointment.tenantId ?? "" },
      select: { phone: true },
    });
    const tenantPhone = tenant?.phone ?? null;

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        date,
        time,
        endTime,
      },
      include: { service: true },
    });

    return NextResponse.json({ appointment: updatedAppointment, tenantPhone });
  } catch (error) {
    console.error("Errore spostamento appuntamento:", error);
    return NextResponse.json(
      { error: "Errore durante lo spostamento" },
      { status: 500 }
    );
  }
}
