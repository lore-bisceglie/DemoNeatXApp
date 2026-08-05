import { NextResponse } from "next/server";
import { getRomeClock, getRomeDate } from "@/lib/rome-time";
import { DAY_NAMES, getDayScheduleForDate, parseBaseSchedule, parseShiftExceptions, timeToMins, type WeeklySchedule } from "@/lib/schedule";
import { requireTenantAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findStaffByAccessToken } from "@/lib/staff-access";
import { parseDaySchedule } from "@/lib/opening-hours";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const REQUEST_TYPES = new Set(["ferie", "permesso"]);
const REQUEST_STATUSES = new Set(["pending", "approved", "rejected", "cancellation_requested"]);
const STAFF_CALENDAR_DAYS = 365;
const STAFF_CALENDAR_MAX_WEEK_OFFSET = 52;

type OpeningHoursSource = {
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  closedDays: string | null;
};

type StaffWithSchedulingContext = NonNullable<Awaited<ReturnType<typeof findStaffByAccessToken>>>;

function buildShopSchedule(source: OpeningHoursSource): WeeklySchedule {
  const schedule: WeeklySchedule = {};
  for (let dayIndex = 0; dayIndex < DAY_NAMES.length; dayIndex += 1) {
    const day = parseDaySchedule(
      source.closedDays,
      dayIndex,
      source.openTime,
      source.closeTime,
      source.breakStart,
      source.breakEnd,
    );
    const open = timeToMins(day.open);
    const close = timeToMins(day.close);
    const pauseStart = day.breakStart ? timeToMins(day.breakStart) : null;
    const pauseEnd = day.breakEnd ? timeToMins(day.breakEnd) : null;
    const blocks = !day.isClosed && close > open
      ? pauseStart !== null && pauseEnd !== null && pauseStart > open && pauseEnd < close
        ? [{ start: day.open, end: day.breakStart! }, { start: day.breakEnd!, end: day.close }]
        : [{ start: day.open, end: day.close }]
      : [];
    schedule[DAY_NAMES[dayIndex]] = { active: blocks.length > 0, blocks };
  }
  return schedule;
}

function getEffectiveStaffSchedule(staff: StaffWithSchedulingContext): WeeklySchedule {
  const personalSchedule = parseBaseSchedule(staff.baseSchedule);
  if (Object.keys(personalSchedule).length > 0) return personalSchedule;

  const location = staff.location || staff.locations[0]?.location;
  const source: OpeningHoursSource = location
    ? {
        openTime: location.openTime ?? staff.tenant.openTime,
        closeTime: location.closeTime ?? staff.tenant.closeTime,
        breakStart: location.breakStart ?? staff.tenant.breakStart,
        breakEnd: location.breakEnd ?? staff.tenant.breakEnd,
        closedDays: location.closedDays ?? staff.tenant.closedDays,
      }
    : staff.tenant;
  return buildShopSchedule(source);
}

function addDays(date: string, offset: number): string {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + offset);
  return result.toISOString().slice(0, 10);
}

function overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

type AppointmentForConflict = { date: string; time: string; endTime: string | null; customerName: string; service: { name: string; duration: number } | null };
type LeaveForConflict = { date: string; type: string; start: string | null; end: string | null };

function appointmentEndTime(appointment: AppointmentForConflict): string {
  if (appointment.endTime) return appointment.endTime;
  const minutes = timeToMins(appointment.time) + (appointment.service?.duration || 15);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function requestConflictsWithAppointment(request: LeaveForConflict, appointment: AppointmentForConflict): boolean {
  if (request.date !== appointment.date) return false;
  if (request.type === "ferie") return true;
  if (!request.start || !request.end) return false;
  return overlaps(timeToMins(request.start), timeToMins(request.end), timeToMins(appointment.time), timeToMins(appointmentEndTime(appointment)));
}

function timeOptionsForBlocks(blocks: { start: string; end: string }[]) {
  const options: { start: string; end: string; label: string }[] = [];
  for (const block of blocks) {
    const start = timeToMins(block.start);
    const end = timeToMins(block.end);
    if (end - start < 120) continue;
    const candidates = [start, Math.max(start, end - 120)];
    for (const candidate of candidates) {
      const option = { start: `${String(Math.floor(candidate / 60)).padStart(2, "0")}:${String(candidate % 60).padStart(2, "0")}`, end: `${String(Math.floor((candidate + 120) / 60)).padStart(2, "0")}:${String((candidate + 120) % 60).padStart(2, "0")}`, label: `${String(Math.floor(candidate / 60)).padStart(2, "0")}:${String(candidate % 60).padStart(2, "0")}–${String(Math.floor((candidate + 120) / 60)).padStart(2, "0")}:${String((candidate + 120) % 60).padStart(2, "0")}` };
      if (!options.some((item) => item.start === option.start && item.end === option.end)) options.push(option);
    }
  }
  return options.slice(0, 4);
}

async function getStaffFromToken(token: string | null) {
  const staff = await findStaffByAccessToken(token);
  return staff;
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const token = searchParams.get("token");
  const tenantId = searchParams.get("tenantId");
  const status = searchParams.get("status") || "pending";
  const requestedWeekOffset = Number(searchParams.get("weekOffset") || "0");
  const weekOffset = Number.isInteger(requestedWeekOffset)
    ? Math.min(Math.max(requestedWeekOffset, 0), STAFF_CALENDAR_MAX_WEEK_OFFSET)
    : 0;

  if (token) {
    const staff = await getStaffFromToken(token);
    if (!staff) return NextResponse.json({ error: "Link staff non valido o revocato" }, { status: 404 });
    const now = new Date();
    if (!staff.staffAccessLastUsedAt || staff.staffAccessLastUsedAt.getTime() < now.getTime() - 15 * 60_000) {
      await prisma.staff.update({ where: { id: staff.id }, data: { staffAccessLastUsedAt: now } });
    }
    const today = getRomeDate(now);
    const romeClock = getRomeClock(now);
    const nowTime = `${String(Math.floor(romeClock.minutes / 60)).padStart(2, "0")}:${String(romeClock.minutes % 60).padStart(2, "0")}`;
    const dayOfWeek = new Date(`${today}T12:00:00Z`).getUTCDay();
    const currentWeekMonday = addDays(today, -((dayOfWeek + 6) % 7));
    const visibleWeekStart = addDays(currentWeekMonday, weekOffset * 7);
    const visibleWeekEnd = addDays(visibleWeekStart, 6);
    const lastAllowedDate = addDays(today, STAFF_CALENDAR_DAYS);
    const visibleDataEnd = visibleWeekEnd > lastAllowedDate ? lastAllowedDate : visibleWeekEnd;
    const requests = await prisma.staffLeaveRequest.findMany({
      where: {
        staffId: staff.id,
        status: { not: "cancelled" },
        date: { gte: visibleWeekStart, lte: visibleDataEnd },
      },
      orderBy: [{ date: "asc" }, { createdAt: "desc" }],
      select: { id: true, date: true, type: true, start: true, end: true, status: true, createdAt: true, reviewedAt: true },
    });
    const approved = parseShiftExceptions(staff.shiftExceptions)
      .filter((item) => item.date >= visibleWeekStart && item.date <= visibleDataEnd);
    const base = getEffectiveStaffSchedule(staff);
    const requestedDates = new Set(requests.map((item) => item.date));
    const exceptionDates = new Set(approved.map((item) => item.date));
    const workingDates: string[] = [];
    const timeOptionsByDate: Record<string, { start: string; end: string; label: string }[]> = {};
    const workingBlocksByDate: Record<string, { start: string; end: string }[]> = {};
    const baseBlocksByDate: Record<string, { start: string; end: string }[]> = {};
    for (let offset = 0; offset < 7; offset += 1) {
      const date = addDays(visibleWeekStart, offset);
      if (date > lastAllowedDate) continue;
      const baseDay = getDayScheduleForDate(base, [], date);
      const day = getDayScheduleForDate(base, approved, date);
      if (baseDay.active || requestedDates.has(date) || exceptionDates.has(date)) {
        workingDates.push(date);
        timeOptionsByDate[date] = timeOptionsForBlocks(day.blocks);
        workingBlocksByDate[date] = day.blocks;
        baseBlocksByDate[date] = baseDay.blocks;
      }
    }

    const [appointments, recentTodayAppointments, futureAppointment] = await Promise.all([
      prisma.appointment.findMany({
      where: {
        tenantId: staff.tenantId,
        staffId: staff.id,
        date: { gte: visibleWeekStart, lte: visibleDataEnd },
        time: { not: "ALL_DAY" },
      },
      select: {
        date: true,
        time: true,
        endTime: true,
        customerName: true,
        service: { select: { name: true, duration: true } },
      },
      }),
      prisma.appointment.findMany({
        where: { tenantId: staff.tenantId, staffId: staff.id, date: today, time: { not: "ALL_DAY" } },
        orderBy: { time: "desc" },
        take: 6,
        select: { date: true, time: true, endTime: true, customerName: true, service: { select: { name: true, duration: true } } },
      }),
      prisma.appointment.findFirst({
        where: {
          tenantId: staff.tenantId,
          staffId: staff.id,
          time: { not: "ALL_DAY" },
          OR: [
            { date: today, time: { gte: nowTime } },
            { date: { gt: today } },
          ],
        },
        orderBy: [{ date: "asc" }, { time: "asc" }],
        select: { date: true, time: true, endTime: true, customerName: true, service: { select: { name: true, duration: true } } },
      }),
    ]);
    // The staff portal receives only the employee's own appointment essentials.
    // Deliberately omit phone numbers, payment data, notes, and every other staff member.
    const busyIntervalsByDate: Record<string, { start: string; end: string; customerName: string; serviceName: string }[]> = {};
    for (const appointment of appointments) {
      const end = appointment.endTime || `${String(Math.floor((timeToMins(appointment.time) + (appointment.service?.duration || 15)) / 60)).padStart(2, "0")}:${String((timeToMins(appointment.time) + (appointment.service?.duration || 15)) % 60).padStart(2, "0")}`;
      if (!busyIntervalsByDate[appointment.date]) busyIntervalsByDate[appointment.date] = [];
      busyIntervalsByDate[appointment.date].push({
        start: appointment.time,
        end,
        customerName: appointment.customerName,
        serviceName: appointment.service?.name || "Appuntamento",
      });
    }

    const ongoingAppointment = recentTodayAppointments.find((appointment) => timeToMins(appointmentEndTime(appointment)) > romeClock.minutes);
    const nextAppointmentSource = ongoingAppointment || futureAppointment;
    const nextAppointment = nextAppointmentSource
      ? {
          date: nextAppointmentSource.date,
          start: nextAppointmentSource.time,
          end: appointmentEndTime(nextAppointmentSource),
          customerName: nextAppointmentSource.customerName,
          serviceName: nextAppointmentSource.service?.name || "Appuntamento",
        }
      : null;

    const allBaseBlocks = Object.values(baseBlocksByDate).flat();
    const timelineStart = allBaseBlocks.length > 0
      ? allBaseBlocks.reduce((earliest, block) => timeToMins(block.start) < timeToMins(earliest) ? block.start : earliest, allBaseBlocks[0].start)
      : "09:00";
    const timelineEnd = allBaseBlocks.length > 0
      ? allBaseBlocks.reduce((latest, block) => timeToMins(block.end) > timeToMins(latest) ? block.end : latest, allBaseBlocks[0].end)
      : "19:00";

    const response = NextResponse.json({
      staff: { id: staff.id, name: staff.name, tenantName: staff.tenant.name },
      requests,
      approvedExceptions: approved,
      workingDates,
      timeOptionsByDate,
      workingBlocksByDate,
      baseBlocksByDate,
      busyIntervalsByDate,
      nextAppointment,
      today,
      nowMinutes: romeClock.minutes,
      maxWeekOffset: STAFF_CALENDAR_MAX_WEEK_OFFSET,
      maxDate: lastAllowedDate,
      calendarWeekOffset: weekOffset,
      timelineStart,
      timelineEnd,
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  if (!tenantId) return NextResponse.json({ error: "Manca token o tenantId" }, { status: 400 });
  const authError = await requireTenantAdmin(tenantId);
  if (authError) return authError;
  if (!REQUEST_STATUSES.has(status)) return NextResponse.json({ error: "Stato non valido" }, { status: 400 });
  const requests = await prisma.staffLeaveRequest.findMany({ where: { tenantId, status: status === "pending" ? { in: ["pending", "cancellation_requested"] } : status }, orderBy: [{ date: "asc" }, { createdAt: "asc" }], select: { id: true, date: true, type: true, start: true, end: true, status: true, createdAt: true, staff: { select: { id: true, name: true } } } });
  const appointments = requests.length === 0 ? [] : await prisma.appointment.findMany({
    where: { tenantId, staffId: { in: [...new Set(requests.map((item) => item.staff.id))] }, date: { in: [...new Set(requests.map((item) => item.date))] }, time: { not: "ALL_DAY" } },
    select: { staffId: true, date: true, time: true, endTime: true, customerName: true, service: { select: { name: true, duration: true } } },
  });
  const requestsWithConflicts = requests.map((item) => ({
    ...item,
    conflicts: appointments
      .filter((appointment) => item.status === "pending" && appointment.staffId === item.staff.id && requestConflictsWithAppointment(item, appointment))
      .map((appointment) => ({ customerName: appointment.customerName, serviceName: appointment.service?.name || "Appuntamento", start: appointment.time, end: appointmentEndTime(appointment) })),
  }));
  return NextResponse.json({ requests: requestsWithConflicts });
}

export async function POST(request: Request) {
  let body: { token?: string; date?: string; type?: string; start?: string | null; end?: string | null };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Payload non valido" }, { status: 400 }); }
  const staff = await getStaffFromToken(body.token || null);
  if (!staff) return NextResponse.json({ error: "Link staff non valido o revocato" }, { status: 404 });
  const date = body.date || "";
  const type = body.type || "";
  if (!DATE_RE.test(date) || !REQUEST_TYPES.has(type)) return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });

  let start: string | null = null;
  let end: string | null = null;
  if (type === "ferie") {
    start = null; end = null;
  } else {
    if (!TIME_RE.test(body.start || "") || !TIME_RE.test(body.end || "") || timeToMins(body.start || "00:00") >= timeToMins(body.end || "00:00")) return NextResponse.json({ error: "Intervallo orario non valido" }, { status: 400 });
    if (timeToMins(body.end || "00:00") - timeToMins(body.start || "00:00") > 12 * 60) return NextResponse.json({ error: "Il permesso è troppo lungo" }, { status: 400 });
    start = body.start || null; end = body.end || null;
  }

  const today = getRomeDate(new Date());
  if (date < today || date > addDays(today, STAFF_CALENDAR_DAYS)) return NextResponse.json({ error: "Data fuori dal periodo consentito" }, { status: 400 });
  const base = getEffectiveStaffSchedule(staff);
  const approved = parseShiftExceptions(staff.shiftExceptions);
  const workingDay = getDayScheduleForDate(base, approved, date);
  if (!workingDay.active) return NextResponse.json({ error: "Il collaboratore non ha turno in questa data" }, { status: 400 });
  if (type === "permesso" && !workingDay.blocks.some((block) => timeToMins(start!) >= timeToMins(block.start) && timeToMins(end!) <= timeToMins(block.end))) {
    return NextResponse.json({ error: "Il permesso deve rientrare nel turno del collaboratore" }, { status: 400 });
  }
  if (approved.some((item) => item.date === date && item.type === "ferie")) return NextResponse.json({ error: "La data è già coperta da ferie approvate" }, { status: 409 });

  const pending = await prisma.staffLeaveRequest.findFirst({ where: { staffId: staff.id, date, status: "pending" }, select: { id: true } });
  if (pending) return NextResponse.json({ error: "Esiste già una richiesta in attesa per questa data" }, { status: 409 });
  if (type === "ferie" && approved.some((item) => item.date === date)) return NextResponse.json({ error: "Esiste già un'eccezione approvata in questa data" }, { status: 409 });
  if (type === "permesso" && approved.some((item) => item.date === date && item.start && item.end && overlaps(timeToMins(start!), timeToMins(end!), timeToMins(item.start), timeToMins(item.end)))) return NextResponse.json({ error: "Il permesso si sovrappone a un'eccezione approvata" }, { status: 409 });

  const created = await prisma.staffLeaveRequest.create({ data: { tenantId: staff.tenantId, staffId: staff.id, date, type, start, end }, select: { id: true, date: true, type: true, start: true, end: true, status: true, createdAt: true } });
  const response = NextResponse.json({ request: created }, { status: 201 });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function PATCH(request: Request) {
  let body: { requestId?: string; status?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Payload non valido" }, { status: 400 }); }
  if (!body.requestId || !body.status || !["approved", "rejected"].includes(body.status)) return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
  const requestRow = await prisma.staffLeaveRequest.findUnique({ where: { id: body.requestId }, select: { id: true, tenantId: true, staffId: true, date: true, type: true, start: true, end: true, status: true } });
  if (!requestRow) return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });
  const authError = await requireTenantAdmin(requestRow.tenantId);
  if (authError) return authError;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.staffLeaveRequest.findUnique({ where: { id: requestRow.id }, select: { id: true, tenantId: true, staffId: true, date: true, type: true, start: true, end: true, status: true } });
      if (!current || !["pending", "cancellation_requested"].includes(current.status)) throw new Error("REQUEST_ALREADY_REVIEWED");
      if (current.status === "cancellation_requested") {
        const staff = await tx.staff.findUnique({ where: { id: current.staffId }, select: { shiftExceptions: true } });
        if (!staff) throw new Error("STAFF_NOT_FOUND");
        if (body.status === "approved") {
          const exceptions = parseShiftExceptions(staff.shiftExceptions);
          const remainingExceptions = exceptions.filter((item) => !(
            item.date === current.date
            && item.type === current.type
            && item.start === current.start
            && item.end === current.end
          ));
          if (remainingExceptions.length === exceptions.length) throw new Error("REQUEST_CONFLICT");
          await tx.staff.update({ where: { id: current.staffId }, data: { shiftExceptions: JSON.stringify(remainingExceptions) } });
        }
        return tx.staffLeaveRequest.update({
          where: { id: current.id },
          data: { status: body.status === "approved" ? "cancelled" : "approved", reviewedAt: new Date(), reviewedBy: "tenant-admin" },
          select: { id: true, date: true, type: true, start: true, end: true, status: true, reviewedAt: true, staff: { select: { id: true, name: true } } },
        });
      }
      if (body.status === "approved") {
        const appointments = await tx.appointment.findMany({
          where: { tenantId: current.tenantId, staffId: current.staffId, date: current.date, time: { not: "ALL_DAY" } },
          select: { date: true, time: true, endTime: true, customerName: true, service: { select: { name: true, duration: true } } },
        });
        if (appointments.some((appointment) => requestConflictsWithAppointment(current, appointment))) throw new Error("APPOINTMENT_CONFLICT");
        const staff = await tx.staff.findUnique({ where: { id: current.staffId }, select: { shiftExceptions: true } });
        if (!staff) throw new Error("STAFF_NOT_FOUND");
        const exceptions = parseShiftExceptions(staff.shiftExceptions);
        if (current.type === "ferie") {
          if (exceptions.some((item) => item.date === current.date)) throw new Error("REQUEST_CONFLICT");
          exceptions.push({ date: current.date, type: "ferie", start: null, end: null });
        } else {
          if (!current.start || !current.end || exceptions.some((item) => item.date === current.date && item.type === "ferie")) throw new Error("REQUEST_CONFLICT");
          if (exceptions.some((item) => item.date === current.date && item.start && item.end && overlaps(timeToMins(current.start!), timeToMins(current.end!), timeToMins(item.start), timeToMins(item.end)))) throw new Error("REQUEST_CONFLICT");
          exceptions.push({ date: current.date, type: "permesso", start: current.start, end: current.end });
        }
        await tx.staff.update({ where: { id: current.staffId }, data: { shiftExceptions: JSON.stringify(exceptions) } });
      }
      return tx.staffLeaveRequest.update({ where: { id: current.id }, data: { status: body.status, reviewedAt: new Date(), reviewedBy: "tenant-admin" }, select: { id: true, date: true, type: true, start: true, end: true, status: true, reviewedAt: true, staff: { select: { id: true, name: true } } } });
    });
    return NextResponse.json({ request: updated });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "REQUEST_ALREADY_REVIEWED") return NextResponse.json({ error: "Richiesta già gestita" }, { status: 409 });
    if (code === "APPOINTMENT_CONFLICT") return NextResponse.json({ error: "Sposta prima i clienti coinvolti, poi potrai approvare la richiesta" }, { status: 409 });
    if (code === "REQUEST_CONFLICT") return NextResponse.json({ error: "Conflitto con un'altra eccezione approvata" }, { status: 409 });
    return NextResponse.json({ error: "Impossibile aggiornare la richiesta" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let body: { token?: string; requestId?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Payload non valido" }, { status: 400 }); }
  const staff = await getStaffFromToken(body.token || null);
  if (!staff) return NextResponse.json({ error: "Link staff non valido o revocato" }, { status: 404 });
  if (!body.requestId) return NextResponse.json({ error: "Manca la richiesta da gestire" }, { status: 400 });
  const leaveRequest = await prisma.staffLeaveRequest.findFirst({ where: { id: body.requestId, staffId: staff.id }, select: { id: true, status: true } });
  if (!leaveRequest) return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });
  if (leaveRequest.status !== "pending" && leaveRequest.status !== "approved") return NextResponse.json({ error: "Questa richiesta non può essere annullata" }, { status: 409 });
  const isApprovedAbsence = leaveRequest.status === "approved";
  await prisma.staffLeaveRequest.update({
    where: { id: leaveRequest.id },
    data: isApprovedAbsence
      ? { status: "cancellation_requested", reviewedAt: null, reviewedBy: null }
      : { status: "cancelled", reviewedAt: new Date(), reviewedBy: "staff" },
    select: { id: true },
  });
  const response = NextResponse.json({ success: true, cancellationRequested: isApprovedAbsence });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
