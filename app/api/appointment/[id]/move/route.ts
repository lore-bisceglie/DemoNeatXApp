import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { requireTenantAdminOrDemo } from "@/lib/demo-access";
import {
  appointmentConflictsWithSlot,
  bookingTimeToMinutes,
} from "@/lib/booking-conflict";
import {
  getDayScheduleForDate,
  parseBaseSchedule,
  parseShiftExceptions,
} from "@/lib/schedule";
import { parseDaySchedule } from "@/lib/opening-hours";
import { getRomeDayOfWeek } from "@/lib/rome-time";

const minutesToTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
  const remainingMinutes = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${remainingMinutes}`;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const date = typeof body.date === "string" ? body.date : "";
    const time = typeof body.time === "string" ? body.time : "";

    if (
      !id ||
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
      where: { id },
      include: {
        service: { select: { duration: true } },
        tenant: {
          select: {
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
        staff: { select: { baseSchedule: true, shiftExceptions: true } },
      },
    });

    if (!appointment || !appointment.tenantId || !appointment.tenant) {
      return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 });
    }

    const tenantId = appointment.tenantId;

    const authError = await requireTenantAdminOrDemo(
      request,
      tenantId,
      "move",
      40,
    );
    if (authError) return authError;

    if (appointment.location && !appointment.location.isActive) {
      return NextResponse.json({ error: "La sede non e piu attiva" }, { status: 409 });
    }

    const duration = appointment.service?.duration || 15;
    const startMinutes = bookingTimeToMinutes(time);
    const endMinutes = startMinutes + duration;
    if (endMinutes > 24 * 60) {
      return NextResponse.json({ error: "Orario non valido" }, { status: 400 });
    }
    const endTime = minutesToTime(endMinutes);
    const scheduleOwner = appointment.location || appointment.tenant;
    const dayOfWeek = getRomeDayOfWeek(requestedDate);
    const daySchedule = parseDaySchedule(
      scheduleOwner.closedDays,
      dayOfWeek,
      scheduleOwner.openTime,
      scheduleOwner.closeTime,
      scheduleOwner.breakStart,
      scheduleOwner.breakEnd,
    );
    if (daySchedule.isClosed) {
      return NextResponse.json({ error: "La sede è chiusa in questo giorno" }, { status: 400 });
    }
    const openMinutes = bookingTimeToMinutes(daySchedule.open);
    const closeMinutes = bookingTimeToMinutes(daySchedule.close);

    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      return NextResponse.json({ error: "Orario fuori dall'apertura della sede" }, { status: 400 });
    }
    if (daySchedule.breakStart && daySchedule.breakEnd) {
      const breakStart = bookingTimeToMinutes(daySchedule.breakStart);
      const breakEnd = bookingTimeToMinutes(daySchedule.breakEnd);
      if (Math.max(startMinutes, breakStart) < Math.min(endMinutes, breakEnd)) {
        return NextResponse.json({ error: "Orario durante la pausa della sede" }, { status: 400 });
      }
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
            { error: "L'operatore non e disponibile in questo orario" },
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
              tenantId,
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
      return NextResponse.json({ error: "Questo orario non e piu disponibile" }, { status: 409 });
    }

    await logActivity({
      action: "MOVE_APPOINTMENT",
      actor: "admin",
      message: `${appointment.customerName} spostato dal ${appointment.date
        .split("-")
        .reverse()
        .join("/")} (${appointment.time}) al ${date
        .split("-")
        .reverse()
        .join("/")} (${time})`,
      appointmentId: appointment.id,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      date,
      time,
      tenantId,
    });

    return NextResponse.json({ appointment: updatedAppointment });
  } catch (error) {
    console.error("Errore spostamento da dashboard:", error);
    return NextResponse.json({ error: "Errore durante lo spostamento" }, { status: 500 });
  }
}
