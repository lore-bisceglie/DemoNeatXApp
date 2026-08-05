import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isTenantAdminCookieValid } from "@/lib/auth";
import { requireTenantAdminOrDemo } from "@/lib/demo-access";
import { DEMO_TENANT_ID } from "@/lib/demoService";
import { getRomeDayOfWeek, getRomeDate } from "@/lib/rome-time";
import { parseDaySchedule } from "@/lib/opening-hours";
import { getDayScheduleForDate, parseBaseSchedule, parseShiftExceptions, timeToMins } from "@/lib/schedule";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const pad = (value: number) => String(value).padStart(2, "0");
const currentRomeMonth = () => getRomeDate(new Date()).slice(0, 7);
const csvCell = (value: string | number | null | undefined) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const csvNumber = (value: number) => value.toFixed(2).replace(".", ",");
const isLegacyAbsence = (name: string) => /FERIE|PAUSA|PERMESSO/i.test(name);

type Interval = { start: number; end: number };

function clippedAbsenceMinutes(blocks: Interval[], start: number, end: number): number {
  return blocks.reduce((total, block) => total + Math.max(0, Math.min(block.end, end) - Math.max(block.start, start)), 0);
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  return intervals.filter((item) => item.end > item.start).sort((a, b) => a.start - b.start).reduce<Interval[]>((merged, item) => {
    const last = merged[merged.length - 1];
    if (last && item.start <= last.end) last.end = Math.max(last.end, item.end);
    else merged.push({ ...item });
    return merged;
  }, []);
}

function toDateRange(monthParam: string) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthParam);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    year,
    month,
    first: `${year}-${pad(month)}-01`,
    last: `${year}-${pad(month)}-${pad(lastDay)}`,
    lastDay,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const range = toDateRange(searchParams.get("month") || currentRomeMonth());
  if (!tenantId) return new NextResponse("Manca tenantId", { status: 400 });
  if (!range) return new NextResponse("Mese non valido. Usa il formato YYYY-MM.", { status: 400 });

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        slug: true, sessionVersion: true, name: true, plan: true, trialEndsAt: true, trialStatus: true,
        openTime: true, closeTime: true, breakStart: true, breakEnd: true, closedDays: true,
        staff: { select: { id: true, name: true, baseSchedule: true, shiftExceptions: true } },
      },
    });
    if (!tenant) return new NextResponse("Tenant non trovato", { status: 404 });

    const isDemoTenant = tenantId === DEMO_TENANT_ID;
    if (isDemoTenant) {
      const authError = await requireTenantAdminOrDemo(request, tenantId, "export-timesheets", 20);
      if (authError) return authError;
    } else {
      const cookieStore = await cookies();
      const cookie = cookieStore.get(`admin_auth_${tenant.slug}`)?.value;
      if (!isTenantAdminCookieValid(cookie, tenant.slug, tenant.sessionVersion)) return new NextResponse("Non autorizzato", { status: 401 });
    }

    const hasPaidPlan = tenant.plan === "pro" || tenant.plan === "elite";
    const hasTrial = Boolean(tenant.trialEndsAt && new Date() <= tenant.trialEndsAt);
    if (!isDemoTenant && !hasPaidPlan && !hasTrial && tenant.trialStatus !== "converted") return new NextResponse("Esportazione disponibile solo con piano attivo o trial.", { status: 403 });

    const appointments = await prisma.appointment.findMany({
      where: { tenantId, date: { gte: range.first, lte: range.last } },
      select: { date: true, time: true, endTime: true, customerName: true, staffId: true, source: true, isPaid: true, paymentStatus: true, service: { select: { name: true } }, staff: { select: { name: true } } },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    const rows: string[][] = [];
    const totals = new Map<string, { expected: number; ferie: number; pausa: number; permesso: number; worked: number }>();
    const dayNames = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

    for (const staff of tenant.staff) {
      const weekly = parseBaseSchedule(staff.baseSchedule);
      const exceptions = parseShiftExceptions(staff.shiftExceptions);
      let total = { expected: 0, ferie: 0, pausa: 0, permesso: 0, worked: 0 };

      for (let day = 1; day <= range.lastDay; day += 1) {
        const date = `${range.year}-${pad(range.month)}-${pad(day)}`;
        const dow = getRomeDayOfWeek(new Date(`${date}T12:00:00Z`));
        const fallback = parseDaySchedule(tenant.closedDays, dow, tenant.openTime, tenant.closeTime, tenant.breakStart, tenant.breakEnd);
        const baseBlocks: Interval[] = Object.keys(weekly).length > 0
          ? getDayScheduleForDate(weekly, [], date).blocks.map((block) => ({ start: timeToMins(block.start), end: timeToMins(block.end) }))
          : fallback.isClosed ? [] : [{ start: timeToMins(fallback.open), end: timeToMins(fallback.close) }];
        const breakInterval = fallback.breakStart && fallback.breakEnd ? [{ start: timeToMins(fallback.breakStart), end: timeToMins(fallback.breakEnd) }] : [];
        const baseMinutes = Math.max(0, baseBlocks.reduce((sum, block) => sum + block.end - block.start, 0) - clippedAbsenceMinutes(baseBlocks, breakInterval[0]?.start ?? -1, breakInterval[0]?.end ?? -1));
        const dayExceptions = exceptions.filter((exception) => exception.date === date);
        const ferie = dayExceptions.some((exception) => exception.type === "ferie");
        const excluded: Interval[] = dayExceptions.filter((exception) => exception.type !== "ferie" && exception.start && exception.end).map((exception) => ({ start: timeToMins(exception.start!), end: timeToMins(exception.end!) }));
        const excludedMinutes = ferie ? baseMinutes : mergeIntervals(excluded).reduce((sum, interval) => sum + clippedAbsenceMinutes(baseBlocks, interval.start, interval.end), 0);
        const effectiveMinutes = ferie ? 0 : Math.max(0, baseMinutes - excludedMinutes);
        const ferieMinutes = ferie ? baseMinutes : 0;
        const pausaMinutes = ferie ? 0 : dayExceptions.filter((exception) => exception.type === "pausa" && exception.start && exception.end).reduce((sum, exception) => sum + clippedAbsenceMinutes(baseBlocks, timeToMins(exception.start!), timeToMins(exception.end!)), 0);
        const permessoMinutes = ferie ? 0 : dayExceptions.filter((exception) => exception.type === "permesso" && exception.start && exception.end).reduce((sum, exception) => sum + clippedAbsenceMinutes(baseBlocks, timeToMins(exception.start!), timeToMins(exception.end!)), 0);
        const note = dayExceptions.map((exception) => exception.type === "ferie" ? "Ferie" : `${exception.type} ${exception.start || ""}-${exception.end || ""}`).join(", ");

        total.expected += baseMinutes / 60; total.ferie += ferieMinutes / 60; total.pausa += pausaMinutes / 60; total.permesso += permessoMinutes / 60; total.worked += effectiveMinutes / 60;
        rows.push(["PRESENZA", `${pad(day)}/${pad(range.month)}/${range.year}`, dayNames[dow], staff.name, ferie ? "FERIE" : effectiveMinutes > 0 ? "PRESENTE" : "ASSENTE", "", "", "", "", csvNumber(baseMinutes / 60), csvNumber(ferieMinutes / 60), csvNumber(pausaMinutes / 60), csvNumber(permessoMinutes / 60), csvNumber(effectiveMinutes / 60), note]);
      }
      totals.set(staff.id, total);
    }

    for (const appointment of appointments) {
      if (appointment.time === "ALL_DAY" || isLegacyAbsence(appointment.customerName)) continue;
      const date = dateFromDb(appointment.date);
      const dow = getRomeDayOfWeek(new Date(`${appointment.date}T12:00:00Z`));
      rows.push(["APPUNTAMENTO", date, dayNames[dow], appointment.staff?.name || "Non assegnato", appointment.paymentStatus === "PAID" || appointment.isPaid ? "PAGATO" : "APPUNTAMENTO", appointment.customerName, appointment.service?.name || "", appointment.time, appointment.endTime || "", "", "", "", "", "", `${appointment.source}${appointment.isPaid ? " · pagato" : ""}`]);
    }

    const header = ["Tipo riga", "Data", "Giorno", "Dipendente", "Stato", "Cliente", "Servizio", "Inizio", "Fine", "Ore previste", "Ore ferie", "Ore pausa", "Ore permesso", "Ore lavorabili", "Note"];
    let csv = "\uFEFF" + header.map(csvCell).join(";") + "\r\n";
    csv += rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
    csv += "\r\n\r\n";
    for (const staff of tenant.staff) {
      const total = totals.get(staff.id);
      if (!total) continue;
      csv += ["TOTALE", "", "", staff.name, "", "", "", "", "", csvNumber(total.expected), csvNumber(total.ferie), csvNumber(total.pausa), csvNumber(total.permesso), csvNumber(total.worked), ""].map(csvCell).join(";") + "\r\n";
    }
    csv += ["Fuso orario", "Europe/Rome", "", "", "", "", "", "", "", "", "", "", "", "", "Report generato da NeatX"].map(csvCell).join(";") + "\r\n";

    const safeName = tenant.name.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "").toLowerCase() || "salone";
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="presenze_${safeName}_${range.year}-${pad(range.month)}.csv"` } });
  } catch (error) {
    console.error("Export timesheet error", error);
    return new NextResponse("Errore durante la generazione del report", { status: 500 });
  }
}

function dateFromDb(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
