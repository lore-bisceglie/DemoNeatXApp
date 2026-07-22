import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  appointmentConflictsWithSlot,
  bookingTimeToMinutes,
} from "@/lib/booking-conflict";
import {
  getDayScheduleForDate,
  parseBaseSchedule,
  parseShiftExceptions,
} from "@/lib/schedule";
import { parseClosedDays } from "@/lib/opening-hours";
import { getRomeDayOfWeek } from "@/lib/rome-time";
import { canManageAppointment } from "@/lib/appointment-management";

const minutesToTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
  const remainingMinutes = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${remainingMinutes}`;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const body = await request.json().catch(() => ({}));
    const date = typeof body.date === "string" ? body.date : "";
    const time = typeof body.time === "string" ? body.time : "";

    if (
      !token ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)
    ) {
      return NextResponse.json({ error: "Data o orario non validi" }, { status: 400 });
    }

    const requestedDate = new Date(`${date}T12:00:00`);
    if (Number.isNaN(requestedDate.getTime())) {
      return NextResponse.json({ error: "Data non valida" }, { status: 400 });
    }

    const todayInRome = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Rome",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    if (date < todayInRome) {
      return NextResponse.json({ error: "Non puoi scegliere una data passata" }, { status: 400 });
    }

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);
    if (requestedDate > maxDate) {
      return NextResponse.json(
        { error: "Puoi spostare l'appuntamento con massimo 60 giorni di anticipo" },
        { status: 400 },
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { cancelToken: token },
      include: {
        service: { select: { duration: true } },
        tenant: {
          select: {
            phone: true,
            openTime: true,
            closeTime: true,
            breakStart: true,
            breakEnd: true,
            closedDays: true,
          },
        },
        location: {
          select: {
            isActive: true,
            openTime: true,
            closeTime: true,
            breakStart: true,
            breakEnd: true,
            closedDays: true,
          },
        },
        staff: {
          select: { baseSchedule: true, shiftExceptions: true },
        },
      },
    });

    if (!appointment || !appointment.tenantId || !appointment.service) {
      return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 });
    }
    if (!canManageAppointment(appointment)) {
      return NextResponse.json(
        { error: "L'appuntamento è già concluso e non può più essere spostato" },
        { status: 410 },
      );
    }
    if (appointment.location && !appointment.location.isActive) {
      return NextResponse.json({ error: "La sede non è più attiva" }, { status: 409 });
    }

    const startMinutes = bookingTimeToMinutes(time);
    const endMinutes = startMinutes + appointment.service.duration;
    const endTime = minutesToTime(endMinutes);
    const scheduleOwner = appointment.location || appointment.tenant;
    const openMinutes = scheduleOwner?.openTime
      ? bookingTimeToMinutes(scheduleOwner.openTime)
      : 9 * 60;
    const closeMinutes = scheduleOwner?.closeTime
      ? bookingTimeToMinutes(scheduleOwner.closeTime)
      : 19 * 60;

    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      return NextResponse.json({ error: "Orario fuori dall'apertura della sede" }, { status: 400 });
    }
    if (scheduleOwner?.breakStart && scheduleOwner.breakEnd) {
      const breakStart = bookingTimeToMinutes(scheduleOwner.breakStart);
      const breakEnd = bookingTimeToMinutes(scheduleOwner.breakEnd);
      if (Math.max(startMinutes, breakStart) < Math.min(endMinutes, breakEnd)) {
        return NextResponse.json({ error: "Orario durante la pausa della sede" }, { status: 400 });
      }
    }
    if (parseClosedDays(scheduleOwner?.closedDays).includes(getRomeDayOfWeek(requestedDate))) {
      return NextResponse.json({ error: "La sede è chiusa in questo giorno" }, { status: 400 });
    }

    if (appointment.staff) {
      const baseSchedule = parseBaseSchedule(appointment.staff.baseSchedule);
      if (Object.keys(baseSchedule).length > 0) {
        const daySchedule = getDayScheduleForDate(
          baseSchedule,
          parseShiftExceptions(appointment.staff.shiftExceptions),
          date,
        );
        const fitsShift =
          daySchedule.active &&
          daySchedule.blocks.some(
            (block) =>
              startMinutes >= bookingTimeToMinutes(block.start) &&
              endMinutes <= bookingTimeToMinutes(block.end),
          );
        if (!fitsShift) {
          return NextResponse.json(
            { error: "L'operatore non è disponibile in questo orario" },
            { status: 409 },
          );
        }
      }
    }

    const updatedAppointment = await prisma
      .$transaction(
        async (tx) => {
          const busyAppointments = await tx.appointment.findMany({
            where: {
              tenantId: appointment.tenantId,
              date,
              id: { not: appointment.id },
            },
            select: {
              time: true,
              endTime: true,
              customerName: true,
              staffId: true,
              locationId: true,
            },
          });

          const hasConflict = busyAppointments.some((busyAppointment) =>
            appointmentConflictsWithSlot(
              busyAppointment,
              startMinutes,
              endMinutes,
              appointment.staffId,
              appointment.locationId,
            ),
          );
          if (hasConflict) throw new Error("SLOT_TAKEN");

          return tx.appointment.update({
            where: { id: appointment.id },
            data: { date, time, endTime },
            include: { service: true },
          });
        },
        { isolationLevel: "Serializable" },
      )
      .catch((error) => {
        if (
          (error instanceof Error && error.message === "SLOT_TAKEN") ||
          (typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2034")
        ) {
          return null;
        }
        throw error;
      });

    if (!updatedAppointment) {
      return NextResponse.json({ error: "Questo orario non è più disponibile" }, { status: 409 });
    }

    return NextResponse.json({
      appointment: updatedAppointment,
      tenantPhone: appointment.tenant?.phone ?? null,
    });
  } catch (error) {
    console.error("Errore spostamento appuntamento:", error);
    return NextResponse.json({ error: "Errore durante lo spostamento" }, { status: 500 });
  }
}
