import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/auth";
import {
  DAY_NAMES,
  getDayScheduleForDate,
  parseBaseSchedule,
  timeToMins,
  type ShiftException,
  type WeeklySchedule,
} from "@/lib/schedule";
import { parseDaySchedule } from "@/lib/opening-hours";

type OpeningHoursSource = {
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  closedDays: string | null;
};

const openingHoursSelect = {
  openTime: true,
  closeTime: true,
  breakStart: true,
  breakEnd: true,
  closedDays: true,
} as const;

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
    const breakStart = day.breakStart ? timeToMins(day.breakStart) : null;
    const breakEnd = day.breakEnd ? timeToMins(day.breakEnd) : null;
    const blocks = !day.isClosed && close > open
      ? breakStart !== null && breakEnd !== null && breakStart > open && breakEnd < close
        ? [{ start: day.open, end: day.breakStart! }, { start: day.breakEnd!, end: day.close }]
        : [{ start: day.open, end: day.close }]
      : [];
    schedule[DAY_NAMES[dayIndex]] = { active: blocks.length > 0, blocks };
  }
  return schedule;
}

function scheduleFitsShopHours(schedule: WeeklySchedule, shopSchedule: WeeklySchedule): boolean {
  for (const day of DAY_NAMES) {
    const configured = schedule[day];
    if (!configured?.active) continue;
    const shopDay = shopSchedule[day];
    if (!shopDay?.active) return false;
    const shopOpen = Math.min(...shopDay.blocks.map((block) => timeToMins(block.start)));
    const shopClose = Math.max(...shopDay.blocks.map((block) => timeToMins(block.end)));
    if (configured.blocks.some((block) => timeToMins(block.start) < shopOpen || timeToMins(block.end) > shopClose)) return false;
  }
  return true;
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  try { return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}

function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isQuarterTime(value: unknown): value is string {
  return isValidTime(value) && Number(value.slice(3)) % 15 === 0;
}

function normalizeExceptions(value: unknown): ShiftException[] | null {
  if (!Array.isArray(value)) return null;
  const normalized: Array<ShiftException | null> = value.map((item) => {
    if (!item || typeof item !== "object") return null;
    const candidate = item as Record<string, unknown>;
    const type = candidate.type;
    const date = candidate.date;
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !["ferie", "permesso", "pausa"].includes(String(type))) return null;
    if (type === "ferie") return { date, type: "ferie" as const, start: null, end: null };
    if (!isQuarterTime(candidate.start) || !isQuarterTime(candidate.end) || candidate.start >= candidate.end) return null;
    return { date, type: type as "permesso" | "pausa", start: candidate.start, end: candidate.end };
  });
  return normalized.every((item): item is ShiftException => item !== null) ? normalized : null;
}

function exceptionsFitSchedule(exceptions: ShiftException[], baseScheduleValue: string | null): boolean {
  const baseSchedule = parseBaseSchedule(baseScheduleValue);
  const hasBaseSchedule = Object.keys(baseSchedule).length > 0;
  const byDate = new Map<string, ShiftException[]>();

  for (const exception of exceptions) {
    const current = byDate.get(exception.date) || [];
    current.push(exception);
    byDate.set(exception.date, current);
  }

  for (const [date, dayExceptions] of byDate) {
    const hasFerie = dayExceptions.some((exception) => exception.type === "ferie");
    if (hasFerie && dayExceptions.length > 1) return false;

    const intervals = dayExceptions
      .filter((exception) => exception.type !== "ferie" && exception.start && exception.end)
      .map((exception) => ({ start: timeToMins(exception.start!), end: timeToMins(exception.end!) }))
      .sort((a, b) => a.start - b.start);

    if (intervals.some((interval, index) => index > 0 && interval.start < intervals[index - 1].end)) return false;

    if (hasBaseSchedule && intervals.length > 0) {
      const workingDay = getDayScheduleForDate(baseSchedule, [], date);
      if (!workingDay.active) return false;
      const isInsideWorkingBlock = (interval: { start: number; end: number }) =>
        workingDay.blocks.some((block) => interval.start >= timeToMins(block.start) && interval.end <= timeToMins(block.end));
      if (intervals.some((interval) => !isInsideWorkingBlock(interval))) return false;
    }
  }

  return true;
}

function normalizeBaseSchedule(value: unknown): WeeklySchedule | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const normalized: WeeklySchedule = {};
  for (const day of DAY_NAMES) {
    const raw = source[day];
    if (raw === undefined) continue;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const candidate = raw as Record<string, unknown>;
    if (typeof candidate.active !== "boolean" || !Array.isArray(candidate.blocks) || candidate.blocks.length > 6) return null;
    const blocks = candidate.blocks.map((block) => {
      if (!block || typeof block !== "object") return null;
      const item = block as Record<string, unknown>;
      if (!isQuarterTime(item.start) || !isQuarterTime(item.end) || item.start >= item.end) return null;
      return { start: item.start, end: item.end };
    });
    if (blocks.some((block) => block === null)) return null;
    const orderedBlocks = (blocks as { start: string; end: string }[])
      .sort((a, b) => a.start.localeCompare(b.start));
    if (orderedBlocks.some((block, index) => index > 0 && block.start < orderedBlocks[index - 1].end)) return null;
    if (candidate.active !== (orderedBlocks.length > 0)) return null;
    normalized[day] = { active: candidate.active, blocks: orderedBlocks };
  }
  return normalized;
}

async function getStaffScheduleContext(staffId: string) {
  return prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      name: true,
      tenantId: true,
      baseSchedule: true,
      shiftExceptions: true,
      location: { select: openingHoursSelect },
      locations: { select: { location: { select: openingHoursSelect } } },
      tenant: { select: openingHoursSelect },
    },
  });
}

function getShopSchedule(context: NonNullable<Awaited<ReturnType<typeof getStaffScheduleContext>>>) {
  const location = context.location || context.locations[0]?.location;
  const source: OpeningHoursSource = location
    ? {
        openTime: location.openTime ?? context.tenant.openTime,
        closeTime: location.closeTime ?? context.tenant.closeTime,
        breakStart: location.breakStart ?? context.tenant.breakStart,
        breakEnd: location.breakEnd ?? context.tenant.breakEnd,
        closedDays: location.closedDays ?? context.tenant.closedDays,
      }
    : context.tenant;
  return buildShopSchedule(source);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const staffId = searchParams.get("staffId");

  if (!staffId) {
    return NextResponse.json({ error: "Manca staffId" }, { status: 400 });
  }

  const staff = await getStaffScheduleContext(staffId);

  if (!staff) {
    return NextResponse.json({ error: "Staff non trovato" }, { status: 404 });
  }

  const authError = await requireTenantAdmin(staff.tenantId);
  if (authError) return authError;

  return NextResponse.json({
    baseSchedule: parseJson(staff.baseSchedule, {}),
    shiftExceptions: parseJson(staff.shiftExceptions, []),
    shopSchedule: getShopSchedule(staff),
    name: staff.name,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { staffId, baseSchedule } = body;

  if (!staffId || baseSchedule === undefined) {
    return NextResponse.json({ error: "Mancano staffId o baseSchedule" }, { status: 400 });
  }
  const normalizedSchedule = normalizeBaseSchedule(baseSchedule);
  if (!normalizedSchedule) return NextResponse.json({ error: "Orari non validi: usa intervalli da 15 minuti" }, { status: 400 });

  const existingStaff = await getStaffScheduleContext(staffId);
  if (!existingStaff) return NextResponse.json({ error: "Staff non trovato" }, { status: 404 });
  const authError = await requireTenantAdmin(existingStaff.tenantId);
  if (authError) return authError;
  if (!scheduleFitsShopHours(normalizedSchedule, getShopSchedule(existingStaff))) {
    return NextResponse.json({ error: "I turni devono rientrare negli orari di apertura del negozio" }, { status: 400 });
  }

  const staff = await prisma.staff.update({
    where: { id: staffId },
    data: { baseSchedule: JSON.stringify(normalizedSchedule) },
    select: { baseSchedule: true },
  });

  return NextResponse.json({ success: true, baseSchedule: parseJson(staff.baseSchedule, {}) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { staffId, exceptions } = body;

  if (!staffId || !Array.isArray(exceptions)) {
    return NextResponse.json({ error: "Mancano staffId o exceptions array" }, { status: 400 });
  }
  const normalizedExceptions = normalizeExceptions(exceptions);
  if (!normalizedExceptions) {
    return NextResponse.json({ error: "Eccezioni non valide: controlla date e orari" }, { status: 400 });
  }

  const existingStaff = await getStaffScheduleContext(staffId);
  if (!existingStaff) return NextResponse.json({ error: "Staff non trovato" }, { status: 404 });
  const authError = await requireTenantAdmin(existingStaff.tenantId);
  if (authError) return authError;
  const baseForValidation = Object.keys(parseBaseSchedule(existingStaff.baseSchedule)).length > 0
    ? existingStaff.baseSchedule
    : JSON.stringify(getShopSchedule(existingStaff));
  if (!exceptionsFitSchedule(normalizedExceptions, baseForValidation)) {
    return NextResponse.json({ error: "I permessi devono rientrare in un turno attivo e non possono sovrapporsi" }, { status: 400 });
  }

  const staff = await prisma.staff.update({
    where: { id: staffId },
    data: { shiftExceptions: JSON.stringify(normalizedExceptions) },
    select: { shiftExceptions: true },
  });

  return NextResponse.json({ success: true, shiftExceptions: parseJson(staff.shiftExceptions, []) });
}
