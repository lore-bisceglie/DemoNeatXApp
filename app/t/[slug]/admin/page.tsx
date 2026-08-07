import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isTenantAdminCookieValid } from "@/lib/auth";
import {
  getDayScheduleSlotStatus,
  parseClosedDays,
  parseDaySchedule,
} from "@/lib/opening-hours";
import { parseShiftExceptions } from "@/lib/schedule";

export const dynamic = "force-dynamic";

import { BarChart3, CalendarDays, Users, Receipt, Globe, CreditCard, CheckCircle, Gift } from "lucide-react";
import DeleteButton from "../../../dashboard/DeleteButton";
import WalkInButton from "../../../dashboard/WalkInButton";
import AppointmentBlock from "../../../dashboard/AppointmentBlock";
import StripeSettingsForm from "./StripeSettingsForm";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";

import AutoRefreshMonitor from "../../../dashboard/AutoRefreshMonitor";
import SwipeableAgenda from "../../../dashboard/SwipeableAgenda";
import CustomerDrawer from "../../../dashboard/CustomerDrawer";
import TeamDrawer from "./TeamDrawer";
import MarketingWidget from "./MarketingWidget";
import PortalButton from "./PortalButton";
import WaitlistDashboard from "../../../dashboard/WaitlistDashboard";
import TabbedArea from "./TabbedArea";
import DayNavigator from "../../../dashboard/DayNavigator";
import AnalyticsChart from "../../../dashboard/AnalyticsChart";
import MessageRechargeCard from "./MessageRechargeCard";
import StripeConnectButton from "./StripeConnectButton";
import ReferralCard from "@/components/ReferralCard";
import ReviewNeatxWidget from "./ReviewNeatxWidget";
import AgendaLocationTabbedArea from "@/components/admin/AgendaLocationTabbedArea";
import LocationTabs from "@/components/admin/LocationTabs";

import LoginScreen from "./LoginScreen";
import TrialLaunchPanel from "./TrialLaunchPanel";
import SupportWidget from "./SupportWidget";
import LogoutButton from "./LogoutButton";
import AdminDropdownMenu from "./AdminDropdownMenu";
import TutorialButton from "./TutorialButton";
import ActivityLogPanel from "./ActivityLogPanel";
import InstallAppButton from "./InstallAppButton";

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function subtractTimeIntervals(
  start: number,
  end: number,
  exclusions: { start: number; end: number }[],
) {
  let ranges = [{ start, end }];
  for (const exclusion of exclusions) {
    ranges = ranges.flatMap((range) => {
      if (exclusion.end <= range.start || exclusion.start >= range.end) return [range];
      const remaining: { start: number; end: number }[] = [];
      if (exclusion.start > range.start) remaining.push({ start: range.start, end: Math.min(exclusion.start, range.end) });
      if (exclusion.end < range.end) remaining.push({ start: Math.max(exclusion.end, range.start), end: range.end });
      return remaining;
    });
  }
  return ranges.filter((range) => range.end > range.start);
}

export default async function Dashboard(props: { searchParams: Promise<{ [key: string]: string | undefined }>; params: Promise<{ slug: string }> }) {
  noStore();

  const searchParams = await props.searchParams;
  const activeTab = searchParams?.tab || (searchParams?.stripe ? 'stripe' : 'agenda');
  const filterLocationId = searchParams?.locationId || "";

  
  const { slug } = await props.params;
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('admin_auth_' + slug)?.value;
  const isSuperAdmin = cookieStore.get('superadmin_session')?.value;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { services: true }
  });

  if (!tenant) return <div className="p-10 text-white">Attività non trovata.</div>;

  // La demo è a libero accesso: chiunque può provare la dashboard completa
  // del negozio demo senza login né paywall. Solo per slug === "demo-neatx".
  const isDemoFreeAccess = slug === "demo-neatx";

  if (!isDemoFreeAccess && !isTenantAdminCookieValid(authCookie, slug, tenant.sessionVersion)) {
    return (
      <LoginScreen
        slug={slug}
        tenantName={tenant.name}
        ownerEmail={tenant.ownerEmail}
        showLegacyHint={!tenant.ownerPasswordHash}
        isEmailUnverified={!tenant.emailVerified}
      />
    );
  }

  const tenantId = tenant.id;
  const tenantName = tenant.name;
  const tenantServices = tenant.services;

  // C1 — Primo gruppo di query parallele: tutte dipendono solo da tenantId
  // e sono indipendenti tra loro, quindi partono insieme.
  const [staffList, locationsRaw] = await Promise.all([
    // Select only dashboard fields. It also keeps scheduling usable before the
    // optional Magic Link workflow columns are migrated on a tenant database.
    prisma.staff.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        tenantId: true,
        baseSchedule: true,
        shiftExceptions: true,
        commissionRate: true,
        locationId: true,
        services: true,
        locations: { select: { locationId: true } },
      },
    }),
    prisma.location.findMany({
      where: { tenantId, isActive: true },
      include: { settings: true },
      orderBy: { isMain: 'desc' },
    }),
  ]);

  // Alias per compatibilità con il resto del codice
  const locations = locationsRaw;

  // Gestione storeSettings separata: può richiedere un create in caso di assenza
  let storeSettings = await prisma.storeSettings.findUnique({ where: { tenantId } });
  if (!storeSettings) {
    storeSettings = await prisma.storeSettings.create({
      data: { tenantId, smsCredits: 50 },
    });
  }

  const platformReview = await prisma.platformReview.findUnique({ where: { tenantId } });

  // Logica PAYWALL (viene eseguita dopo aver già caricato staff e locations in parallelo)
  const todayDate = new Date();
  const trialEndsAt = tenant.trialEndsAt;
  const hasActivePaidPlan = tenant.plan === "pro" || tenant.plan === "elite";
  const hasActiveTrial = trialEndsAt && todayDate <= trialEndsAt;
  const hasNoActivePlanNorTrial = !hasActivePaidPlan && !hasActiveTrial && tenant.trialStatus !== "converted";
  if (!isDemoFreeAccess && hasNoActivePlanNorTrial && !searchParams?.payment) {
    redirect(`/paywall/${slug}`);
  }

  
  // Parse chiusura days (supporta sia array [0,6] che WeekSchedule)
  let activeClosedDays: number[] = parseClosedDays(tenant.closedDays);
  if (filterLocationId) {
    const loc = locations.find(l => l.id === filterLocationId);
    if (loc?.closedDays) {
      activeClosedDays = parseClosedDays(loc.closedDays);
    }
  }

  const now = new Date();
  
  const dateFormatter = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dateFormatter.formatToParts(now);
  const todayItaly = `${parts.find((p) => p.type === "year")?.value}-${
    parts.find((p) => p.type === "month")?.value
  }-${parts.find((p) => p.type === "day")?.value}`;

  const timeFormatter = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const currentTimeItaly = timeFormatter.format(now);
  const [currentHours, currentMinutes] = currentTimeItaly
    .split(":")
    .map(Number);
  const currentTotalMinutes = currentHours * 60 + currentMinutes;

  const urlDate = searchParams?.date;
  const targetDate = urlDate || todayItaly;
  const weekOffset = parseInt(searchParams?.weekOffset || "0", 10);

  const minutesToTime = (value: number) => {
    const hours = Math.floor(value / 60).toString().padStart(2, "0");
    const minutes = (value % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const isPremium = (tenant.plan === "pro" || tenant.plan === "elite") || (tenant.trialEndsAt != null && new Date(tenant.trialEndsAt) > new Date());
  const isMultiStaff = Boolean(staffList.length > 1 && isPremium);


  // Apply weekOffset (was a bug: weekOffset was read but never applied)
  const adjustedTargetDate = (() => {
    const d = new Date(targetDate);
    d.setDate(d.getDate() + (isMultiStaff ? weekOffset : weekOffset * 7));
    return d.toISOString().split("T")[0];
  })();

  let weekDays: { date: string, label: string, isClosed: boolean }[] = [];
  const dayNames = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

  if (isMultiStaff) {
    const d = new Date(adjustedTargetDate);
    const dayOfWeek = d.getDay();
    const isClosed = activeClosedDays.includes(dayOfWeek);
    const label = `${dayNames[d.getDay()]} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`;
    weekDays = [{ date: adjustedTargetDate, label, isClosed }];
  } else {
    // Full week (Mon-Sun)
    const refDate = new Date(adjustedTargetDate);
    const dayOfWeek = refDate.getDay();
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() + diffToMon);

    weekDays = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const iso = d.toISOString().split("T")[0];
      const [, m, dayStr] = iso.split("-");
      const dow = d.getDay();
      const isClosed = activeClosedDays.includes(dow);
      const label = `${dayNames[dow].substring(0, 3)} ${dayStr}/${m}`;

      return { date: iso, label, isClosed };
    });
  }

  const past14Days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (i + 1));
    return d.toISOString().split("T")[0];
  });

  const weekDatesArray = Array.from(new Set([...weekDays.map(w => w.date), ...past14Days]));

  let minOpenMins = 9 * 60;
  let maxCloseMins = 19 * 60;
  
  if (tenant.openTime) {
    const [h, m] = tenant.openTime.split(":").map(Number);
    minOpenMins = h * 60 + m;
  }
  if (tenant.closeTime) {
    const [h, m] = tenant.closeTime.split(":").map(Number);
    maxCloseMins = h * 60 + m;
  }

  locations.forEach((loc: any) => {
    if (loc.openTime) {
      const [h, m] = loc.openTime.split(":").map(Number);
      minOpenMins = Math.min(minOpenMins, h * 60 + m);
    }
    if (loc.closeTime) {
      const [h, m] = loc.closeTime.split(":").map(Number);
      maxCloseMins = Math.max(maxCloseMins, h * 60 + m);
    }
  });

  const allSlots: string[] = [];
  for (let m = minOpenMins; m <= maxCloseMins; m += 15) {
    if (m === maxCloseMins && (m % 60) !== 0) continue;
    const hStr = Math.floor(m / 60).toString().padStart(2, "0");
    const mStr = (m % 60).toString().padStart(2, "0");
    allSlots.push(`${hStr}:${mStr}`);
  }

  const isAgendaTab = activeTab === 'agenda';
  const _isServiziTab = activeTab === 'servizi';

  // C1 — Secondo gruppo di query parallele: tutte dipendono da weekDatesArray e currentMonthPrefix
  // che sono ora disponibili. Le lanciamo insieme per dimezzare il tempo di attesa DB.
  const currentMonthPrefix = todayItaly.substring(0, 7);
  const [
    rawAppointments,
    rawShopClosures,
    radarAppointmentsRaw,
    recentActivities,
    waitlistItems,
    monthlyAppointments,
    allAppointments,
  ] = await Promise.all([
    // Appuntamenti futuri per la lista principale
    prisma.appointment.findMany({
      where: {
        date: { gte: todayItaly },
        tenantId,
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      include: { service: true, staff: true },
    }),
    prisma.blockedSlot.findMany({
      where: { tenantId, date: { gte: todayItaly } },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      select: { id: true, date: true, time: true, endTime: true },
    }),
    // Appuntamenti per il radar (griglia settimanale) — solo se tab agenda
    isAgendaTab
      ? prisma.appointment.findMany({
          where: {
            date: { in: weekDatesArray },
            tenantId,
          },
          include: { service: true },
        })
      : Promise.resolve([]),
    // Log attività recenti — solo se tab agenda
    isAgendaTab
      ? prisma.activityLog.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
    // C2 — Lista d'attesa (una sola volta, filtrata per date future)
    prisma.waitlist.findMany({
      where: { tenantId, date: { gte: todayItaly } },
      orderBy: { createdAt: "asc" },
    }),
    // Appuntamenti del mese corrente per il calcolo incassi
    prisma.appointment.findMany({
      where: { date: { startsWith: currentMonthPrefix }, tenantId },
      include: { service: true },
    }),
    // Appuntamenti degli ultimi 14 giorni per analytics
    prisma.appointment.findMany({
      where: { tenantId, date: { in: past14Days } },
      include: { service: true },
    }),
  ]);

  // Alias per compatibilità con il codice che usa waitlistData
  const _waitlistData = waitlistItems;
  const _radarAppointments = radarAppointmentsRaw;

  const findNearestSlotIndex = (timeStr: string, slots: string[]): { index: number; slotTime: string } => {
    if (!slots.length) return { index: -1, slotTime: timeStr };
    const exactIndex = slots.indexOf(timeStr);
    if (exactIndex !== -1) return { index: exactIndex, slotTime: slots[exactIndex] };

    const [h, m] = timeStr.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return { index: -1, slotTime: timeStr };

    const targetMins = h * 60 + m;
    let minDiff = Infinity;
    let bestIndex = 0;

    for (let i = 0; i < slots.length; i++) {
      const [sh, sm] = slots[i].split(":").map(Number);
      const slotMins = sh * 60 + sm;
      const diff = Math.abs(slotMins - targetMins);
      if (diff < minDiff) {
        minDiff = diff;
        bestIndex = i;
      }
    }

    return { index: bestIndex, slotTime: slots[bestIndex] };
  };

  const buildAgendaData = (locId: string | null) => {
    const filteredStaff = !locId ? staffList : staffList.filter(s => 
      s.locationId === locId || (s.locations && s.locations.some((l: any) => l.locationId === locId)) || (!s.locationId && (!s.locations || s.locations.length === 0))
    );
    const cols = filteredStaff.length > 0 ? filteredStaff.map(s => s.id) : ["unassigned"];
    const map: Record<string, Record<string, Record<string, any>>> = {};
    const scheduleSource = (
      locId
        ? locations.find((location) => location.id === locId)
        : locations.length === 1
          ? locations[0]
          : tenant
    ) ?? tenant;
    const daySchedules = Object.fromEntries(
      weekDays.map((dayInfo) => {
        const dayOfWeek = new Date(`${dayInfo.date}T12:00:00Z`).getUTCDay();
        return [
          dayInfo.date,
          parseDaySchedule(
            scheduleSource.closedDays,
            dayOfWeek,
            scheduleSource.openTime,
            scheduleSource.closeTime,
            scheduleSource.breakStart,
            scheduleSource.breakEnd,
          ),
        ];
      }),
    );
    const viewWeekDays = weekDays.map((dayInfo) => ({
      ...dayInfo,
      isClosed: daySchedules[dayInfo.date].isClosed,
    }));

    if (isAgendaTab) {
      weekDatesArray.forEach((d) => {
        map[d] = {};
        for (const colId of cols) {
          map[d][colId] = {};
        }
      });

      const filteredAppointments = !locId 
        ? radarAppointmentsRaw 
        : radarAppointmentsRaw.filter(a => a.locationId === locId || a.customerName.includes("FERIE") || a.customerName.includes("PAUSA"));

      filteredAppointments.forEach((app) => {
        let durationMins = 15;
        if (app.time === "ALL_DAY") {
          durationMins = allSlots.length * 15;
        } else if (app.service?.duration) {
          durationMins = app.service.duration;
        } else if (app.endTime) {
          const start = app.time.split(":").map(Number);
          const end = app.endTime.split(":").map(Number);
          durationMins = end[0] * 60 + end[1] - (start[0] * 60 + start[1]);
        }

        const slotsToCover = Math.max(1, Math.ceil(durationMins / 15));
        
        let startIndex = -1;
        let slotKey = app.time;

        if (app.time === "ALL_DAY") {
          startIndex = 0;
          slotKey = allSlots[0] || "09:00";
        } else {
          const matched = findNearestSlotIndex(app.time, allSlots);
          startIndex = matched.index;
          slotKey = matched.slotTime;
        }

        if (startIndex !== -1 && slotKey) {
          const appWithSpan = { ...app, _rowSpan: slotsToCover };
          const targetCol = app.staffId && cols.includes(app.staffId) ? app.staffId : cols[0];

          if (!map[app.date]) map[app.date] = {};
          if (!map[app.date][targetCol]) map[app.date][targetCol] = {};
          if (!Array.isArray(map[app.date][targetCol][slotKey])) {
            map[app.date][targetCol][slotKey] = [];
          }
          map[app.date][targetCol][slotKey].push(appWithSpan);

          for (let idx = 1; idx < slotsToCover; idx++) {
            const coveredSlot = allSlots[startIndex + idx];
            if (coveredSlot) {
              if (!map[app.date][targetCol][coveredSlot]) {
                map[app.date][targetCol][coveredSlot] = "COVERED";
              }
            }
          }
        }
      });

      // Le assenze native dello staff non sono appuntamenti fittizi: vengono
      // sovrapposte alla griglia per rendere visibile la stessa indisponibilità
      // che il motore usa già per le prenotazioni online.
      rawShopClosures
        .filter((closure) => weekDays.some((dayInfo) => dayInfo.date === closure.date))
        .forEach((closure) => {
          const startSlot = closure.time || allSlots[0];
          if (!startSlot) return;
          const startIndex = allSlots.indexOf(startSlot);
          if (startIndex < 0) return;
          const slotsToCover = closure.time
            ? Math.max(1, Math.ceil((timeToMinutes(closure.endTime || closure.time) - timeToMinutes(startSlot)) / 15))
            : allSlots.length;

          for (const columnId of cols) {
            const column = map[closure.date]?.[columnId];
            if (!column) continue;
            const shopClosure = {
              id: `shop-closure-${closure.id}-${columnId}`,
              date: closure.date,
              time: closure.time || "ALL_DAY",
              endTime: closure.endTime,
              customerName: "CHIUSURA",
              staffId: columnId === "unassigned" ? null : columnId,
              _rowSpan: slotsToCover,
              _shopClosure: true,
            };
            if (!Array.isArray(column[startSlot])) column[startSlot] = [];
            column[startSlot].push(shopClosure);
            for (let index = 1; index < slotsToCover; index += 1) {
              const coveredSlot = allSlots[startIndex + index];
              if (coveredSlot && !column[coveredSlot]) column[coveredSlot] = "COVERED";
            }
          }
        });

      filteredStaff.forEach((staff) => {
        const staffExceptions = parseShiftExceptions(staff.shiftExceptions);

        staffExceptions.forEach((exception, exceptionIndex) => {
          if (!weekDays.some((dayInfo) => dayInfo.date === exception.date)) return;
          if (!map[exception.date]?.[staff.id]) return;

          const isAllDay = exception.type === "ferie";
          const sourceStart = isAllDay ? timeToMinutes(allSlots[0] || "00:00") : timeToMinutes(exception.start || "00:00");
          const sourceEnd = isAllDay
            ? timeToMinutes(allSlots[allSlots.length - 1] || "24:00") + 15
            : timeToMinutes(exception.end || "00:00");
          if (sourceEnd <= sourceStart) return;

          const shopClosureIntervals = rawShopClosures
            .filter((closure) => closure.date === exception.date)
            .map((closure) => ({
              start: closure.time ? timeToMinutes(closure.time) : 0,
              end: closure.time ? timeToMinutes(closure.endTime || closure.time) : 24 * 60,
            }));
          const visibleRanges = subtractTimeIntervals(sourceStart, sourceEnd, shopClosureIntervals);

          for (const [rangeIndex, range] of visibleRanges.entries()) {
            const startSlot = minutesToTime(range.start);
            const endSlot = minutesToTime(range.end);
            const startIndex = allSlots.indexOf(startSlot);
            if (startIndex < 0) continue;
            const slotsToCover = Math.max(1, Math.ceil((range.end - range.start) / 15));
            const isUninterruptedAllDay = isAllDay && visibleRanges.length === 1 && range.start === sourceStart && range.end === sourceEnd;
            const nativeBlock = {
              id: `native-${staff.id}-${exception.date}-${exception.type}-${exception.start || "all"}-${exceptionIndex}-${rangeIndex}`,
              date: exception.date,
              time: isUninterruptedAllDay ? "ALL_DAY" : startSlot,
              endTime: isUninterruptedAllDay ? null : endSlot,
              customerName: exception.type === "ferie" ? "FERIE" : exception.type === "pausa" ? "PAUSA" : "PERMESSO",
              staffId: staff.id,
              _rowSpan: slotsToCover,
              _nativeException: exception.type,
            };

            const column = map[exception.date][staff.id];
            if (!Array.isArray(column[startSlot])) column[startSlot] = [];
            column[startSlot].push(nativeBlock);

            for (let index = 1; index < slotsToCover; index += 1) {
              const coveredSlot = allSlots[startIndex + index];
              if (coveredSlot && !column[coveredSlot]) column[coveredSlot] = "COVERED";
            }
          }
        });
      });
    }

    const gaps = viewWeekDays.flatMap((dayInfo) => {
      const g: { date: string; label: string; start: string; end: string; duration: number }[] = [];
      let gapStart: string | null = null;
      let gapDuration = 0;

      allSlots.forEach((slot) => {
        const isPastToday = dayInfo.date === todayItaly && timeToMinutes(slot) <= currentTotalMinutes;
        let isSlotCompletelyFree = false;
        for (const colId of cols) {
          const slotVal = map[dayInfo.date]?.[colId]?.[slot];
          const hasAppt = slotVal === "COVERED" || (Array.isArray(slotVal) && slotVal.length > 0);
          if (!hasAppt) {
            isSlotCompletelyFree = true;
            break;
          }
        }
        const isOpen = getDayScheduleSlotStatus(daySchedules[dayInfo.date], slot) === "open";
        const isFree = !isPastToday && isOpen && isSlotCompletelyFree;

        if (isFree) {
          if (!gapStart) gapStart = slot;
          gapDuration += 15;
          return;
        }

        if (gapStart && gapDuration >= 30) {
          g.push({
            date: dayInfo.date,
            label: dayInfo.label,
            start: gapStart,
            end: minutesToTime(timeToMinutes(gapStart) + gapDuration),
            duration: gapDuration,
          });
        }
        gapStart = null;
        gapDuration = 0;
      });

      if (gapStart && gapDuration >= 30) {
        g.push({
          date: dayInfo.date,
          label: dayInfo.label,
          start: gapStart,
          end: minutesToTime(timeToMinutes(gapStart) + gapDuration),
          duration: gapDuration,
        });
      }
      return g;
    })
    .sort((a, b) => {
      if (a.date === b.date) return a.start.localeCompare(b.start);
      return a.date.localeCompare(b.date);
    })
    .slice(0, 6);

    return {
      columns: cols,
      radarMap: map,
      freeGapReports: gaps,
      daySchedules,
      weekDays: viewWeekDays,
    };
  };

  const agendaViews = locations.length > 1 ? [{ id: "all", name: "Tutte le sedi", ...buildAgendaData(null) }] : [];
  locations.forEach((loc: any) => {
    agendaViews.push({ id: loc.id, name: loc.name, ...buildAgendaData(loc.id) });
  });

  const appointments = rawAppointments.filter((app) => {
    if (app.date > todayItaly) return true;
    if (app.time === "ALL_DAY") return true;

    const [appHours, appMinutes] = app.time.split(":").map(Number);
    const appTotalMinutes = appHours * 60 + appMinutes;

    return currentTotalMinutes <= appTotalMinutes + 30;
  });

  const isClosure = (app: { customerName: string; time: string }) =>
    app.time === "ALL_DAY" ||
    app.customerName.includes("PAUSA") ||
    app.customerName.includes("FERIE");

  const nextAppointment = appointments.find((app) => !isClosure(app)) || null;
  // Vecchie chiusure restano leggibili e sbloccabili; quelle nuove vivono nel
  // registro dedicato e non vengono mai trattate come appuntamenti cliente.
  const legacyClosures = Array.from(
    new Map(
      appointments
        .filter((app) => isClosure(app))
        .map((app) => [`${app.date}-${app.time}-${app.endTime || ""}-${app.customerName}`, app]),
    ).values(),
  );
  const currentClosures = [
    ...legacyClosures.map((app) => ({ ...app, source: "legacy" as const })),
    ...rawShopClosures.map((closure) => ({
      id: closure.id,
      date: closure.date,
      time: closure.time || "ALL_DAY",
      endTime: closure.endTime,
      customerName: "CHIUSURA",
      source: "shop" as const,
    })),
  ].sort((first, second) => `${first.date}-${first.time}`.localeCompare(`${second.date}-${second.time}`));


  // 🌟 CALCOLO INCASSI DINAMICI PREMIUM (usa monthlyAppointments già caricato nel Promise.all)

  const validMonthly = monthlyAppointments.filter(
    (app) =>
      !app.customerName.includes("PAUSA") &&
      !app.customerName.includes("FERIE")
  );

  const estimatedRevenue = validMonthly.reduce(
    (sum, app) => sum + (app.service?.price || 0),
    0
  );

  const todayAppointmentsList = appointments.filter(
    (a) =>
      a.date === todayItaly &&
      !a.customerName.includes("PAUSA") &&
      !a.customerName.includes("FERIE")
  );

  const todayPaid = todayAppointmentsList.filter((a) => a.isPaid).length;



  const todayTotalRevenue = todayAppointmentsList.reduce(
    (sum, app) => sum + (app.service?.price || 0),
    0
  );




  const analyticsData = past14Days.map(dateStr => {
    const apps = allAppointments.filter(a => a.date === dateStr);
    const rev = apps.reduce((sum, a) => sum + (a.service?.price || 0), 0);
    return { date: dateStr, appointments: apps.length, revenue: rev };
  });


  // ------------------------------------------------------------------
  // SERVER ACTIONS DA ADMIN
  // ------------------------------------------------------------------

  async function blockTimeRange(formData: FormData) {
    "use server";
    
    let redirectUrl = `/t/${slug}/admin`;

    const date = formData.get("date") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const staffIdParam = formData.get("staffId") as string;
    const blockType = formData.get("blockType") as string || "PAUSA";

    if (date && startTime && endTime) {
      const startMins =
        parseInt(startTime.split(":")[0]) * 60 +
        parseInt(startTime.split(":")[1]);
      const endMins =
        parseInt(endTime.split(":")[0]) * 60 + parseInt(endTime.split(":")[1]);

      if (endMins > startMins) {
        try {
          const storeSettings = await prisma.storeSettings.findUnique({ where: { tenantId } });
          const maxConcurrent = storeSettings?.maxConcurrentAppointments || 1;

          // Determina staff + location UNA volta fuori dalla transazione
          const staffWithLocs = await prisma.staff.findMany({
            where: { tenantId, ...(staffIdParam && staffIdParam !== "all" ? { id: staffIdParam } : {}) },
            select: { id: true, locations: { select: { locationId: true } } },
          });
          const activeLocIds = (await prisma.location.findMany({
            where: { tenantId, isActive: true },
            select: { id: true },
          })).map(l => l.id);

          // Per ogni staff risolvi le location; staff senza location -> [null]
          type LocBlock = { staffId: string | null; locationIds: (string | null)[] };
          const staffLocBlocks: LocBlock[] =
            staffWithLocs.length > 0
              ? staffWithLocs.map(s => ({
                  staffId: s.id,
                  locationIds: s.locations.length > 0
                    ? [...new Set(s.locations.map(l => l.locationId))]
                    : [null],
                }))
              : [{ staffId: null, locationIds: activeLocIds.length > 0 ? activeLocIds : [null] }];

          const label = blockType === "PERMESSO" ? "📋 PERMESSO" : "☕ PAUSA";

          // Transazione atomica: READ + WRITE in Serializable
          const created = await prisma.$transaction(async (tx) => {
            const existing = await tx.appointment.findMany({
              where: {
                date,
                tenantId,
                ...(staffIdParam && staffIdParam !== "all" ? { staffId: staffIdParam } : {}),
                NOT: [
                  { customerName: { contains: "PAUSA" } },
                  { customerName: { contains: "FERIE" } },
                  { time: "ALL_DAY" },
                ],
              },
            });

            let overlapCount = 0;
            existing.forEach((app) => {
              const aStart = parseInt(app.time.split(":")[0]) * 60 + parseInt(app.time.split(":")[1]);
              const aEnd = app.endTime
                ? parseInt(app.endTime.split(":")[0]) * 60 + parseInt(app.endTime.split(":")[1])
                : aStart + 15;
              if (Math.max(startMins, aStart) < Math.min(endMins, aEnd)) overlapCount++;
            });

            if (overlapCount >= maxConcurrent) return null;

            // Un blocco per ogni staff x location (i filtri sede trovano sempre il blocco)
            const data = staffLocBlocks.flatMap(b =>
              b.locationIds.map(locId => ({
                customerName: label,
                customerPhone: "0000000000",
                date,
                time: startTime,
                endTime,
                tenantId,
                staffId: b.staffId,
                locationId: locId,
                cancelToken: crypto.randomUUID(),
              }))
            );
            return tx.appointment.createMany({ data });
          }, { isolationLevel: "Serializable" });

          if (!created) {
            redirectUrl = `/t/${slug}/admin?error=MULTIPLE_CONFLICTS`;
          }
        } catch (error) {
          console.error(error);
        }
      }
    }

    revalidatePath(redirectUrl);
    revalidatePath(redirectUrl);
    redirect(redirectUrl);
  }

  async function blockHoliday(formData: FormData) {
    "use server";

    let redirectUrl = `/t/${slug}/admin`;

    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const staffIdParam = formData.get("staffId") as string;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const datesToBlock: string[] = [];
      const checkLoop = new Date(start);

      while (checkLoop <= end) {
        const y = checkLoop.getFullYear();
        const m = String(checkLoop.getMonth() + 1).padStart(2, '0');
        const day = String(checkLoop.getDate()).padStart(2, '0');
        datesToBlock.push(`${y}-${m}-${day}`);
        checkLoop.setDate(checkLoop.getDate() + 1);
      }

      // Determina staff + location UNA volta
      const staffWithLocs = await prisma.staff.findMany({
        where: { tenantId, ...(staffIdParam && staffIdParam !== "all" ? { id: staffIdParam } : {}) },
        select: { id: true, locations: { select: { locationId: true } } },
      });
      const activeLocIds = (await prisma.location.findMany({
        where: { tenantId, isActive: true },
        select: { id: true },
      })).map(l => l.id);

      type LocBlock = { staffId: string | null; locationIds: (string | null)[] };
      const holidayStaffBlocks: LocBlock[] =
        staffWithLocs.length > 0
          ? staffWithLocs.map(s => ({
              staffId: s.id,
              locationIds: s.locations.length > 0
                ? [...new Set(s.locations.map(l => l.locationId))]
                : [null],
            }))
          : [{ staffId: null, locationIds: activeLocIds.length > 0 ? activeLocIds : [null] }];

      try {
        const existingAppointments = await prisma.appointment.findMany({
          where: {
            date: { in: datesToBlock },
            tenantId,
            ...(staffIdParam && staffIdParam !== "all" ? { staffId: staffIdParam } : {}),
            NOT: [
              { customerName: { contains: "PAUSA" } },
              { customerName: { contains: "FERIE" } },
              { time: "ALL_DAY" },
            ],
          },
        });

        if (existingAppointments.length > 0) {
          redirectUrl = `/t/${slug}/admin?error=MULTIPLE_CONFLICTS`;
        } else {
          // Transazione atomica: crea le ferie per ogni staff x location
          await prisma.$transaction(async (tx) => {
            for (const d of datesToBlock) {
              for (const sb of holidayStaffBlocks) {
                for (const locId of sb.locationIds) {
                  const existing = await tx.appointment.findFirst({
                    where: { date: d, time: "ALL_DAY", tenantId, staffId: sb.staffId, locationId: locId },
                  });
                  if (!existing) {
                    await tx.appointment.create({
                      data: {
                        customerName: "🌴 FERIE",
                        customerPhone: "0000000000",
                        date: d,
                        time: "ALL_DAY",
                        tenantId,
                        staffId: sb.staffId,
                        locationId: locId,
                      },
                    });
                  }
                }
              }
            }
          }, { isolationLevel: "Serializable" });
        }
      } catch (error) {
        console.error(error);
      }
    }

    revalidatePath(redirectUrl);
    redirect(redirectUrl);
  }

  async function createShopClosure(formData: FormData) {
    "use server";

    const date = formData.get("date") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    let redirectUrl = `/t/${slug}/admin`;
    const start = timeToMinutes(startTime || "00:00");
    const end = timeToMinutes(endTime || "00:00");

    if (!date || !startTime || !endTime || end <= start) {
      redirect(`/t/${slug}/admin?error=INTERVALLO_NON_VALIDO`);
    }

    const appointmentsOnDate = await prisma.appointment.findMany({
      where: {
        tenantId,
        date,
        NOT: [
          { time: "ALL_DAY" },
          { customerName: { contains: "PAUSA" } },
          { customerName: { contains: "FERIE" } },
          { customerName: { contains: "PERMESSO" } },
        ],
      },
      select: { time: true, endTime: true, service: { select: { duration: true } } },
    });
    const hasConflict = appointmentsOnDate.some((appointment) => {
      const appointmentStart = timeToMinutes(appointment.time);
      const appointmentEnd = appointment.endTime
        ? timeToMinutes(appointment.endTime)
        : appointmentStart + (appointment.service?.duration || 15);
      return Math.max(start, appointmentStart) < Math.min(end, appointmentEnd);
    });

    if (hasConflict) {
      redirectUrl = `/t/${slug}/admin?error=MULTIPLE_CONFLICTS`;
    } else {
      const existing = await prisma.blockedSlot.findFirst({
        where: { tenantId, date, time: startTime, endTime },
        select: { id: true },
      });
      if (!existing) {
        await prisma.blockedSlot.create({ data: { tenantId, date, time: startTime, endTime } });
      }
    }

    revalidatePath(`/t/${slug}/admin`);
    redirect(redirectUrl);
  }

  async function createShopHoliday(formData: FormData) {
    "use server";

    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    let redirectUrl = `/t/${slug}/admin`;
    if (!startDate || !endDate || endDate < startDate) {
      redirect(`/t/${slug}/admin?error=DATE_NON_VALIDE`);
    }

    const dates: string[] = [];
    const cursor = new Date(`${startDate}T12:00:00Z`);
    const last = new Date(`${endDate}T12:00:00Z`);
    while (cursor <= last) {
      dates.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const existingAppointments = await prisma.appointment.count({
      where: {
        tenantId,
        date: { in: dates },
        NOT: [
          { time: "ALL_DAY" },
          { customerName: { contains: "PAUSA" } },
          { customerName: { contains: "FERIE" } },
          { customerName: { contains: "PERMESSO" } },
        ],
      },
    });
    if (existingAppointments > 0) {
      redirectUrl = `/t/${slug}/admin?error=MULTIPLE_CONFLICTS`;
    } else {
      await prisma.$transaction(async (tx) => {
        for (const date of dates) {
          const existing = await tx.blockedSlot.findFirst({
            where: { tenantId, date, time: null, endTime: null },
            select: { id: true },
          });
          if (!existing) await tx.blockedSlot.create({ data: { tenantId, date } });
        }
      });
    }

    revalidatePath(`/t/${slug}/admin`);
    redirect(redirectUrl);
  }

  async function unblockShopClosure(formData: FormData) {
    "use server";

    const closureId = formData.get("closureId") as string;
    if (closureId) {
      await prisma.blockedSlot.deleteMany({ where: { id: closureId, tenantId } });
    }
    revalidatePath(`/t/${slug}/admin`);
    redirect(`/t/${slug}/admin`);
  }

  const tabConfig = [
    { id: "agenda", label: "📅 Agenda" },
    { id: "gestione", label: "⚙️ Gestione" },
    { id: "business", label: "📈 Business" },
  ];

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col p-4 sm:p-8 font-sans text-slate-200 selection:bg-cyan-500/30">
      <AutoRefreshMonitor appointmentCount={rawAppointments.length} />

      <div className="max-w-7xl mx-auto w-full flex-grow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-white">Neat</span>
            <span className="text-[#00b4ff]">X</span>
            <span className="text-slate-500 font-medium text-2xl ml-2">
              | Agenda Privata {tenantName}
            </span>
          </h1>

          <div id="tour-header-actions" className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <TeamDrawer tenantId={tenantId} isPremium={isPremium} plan={tenant.plan} allServices={tenantServices} locations={locations.map(l => ({ id: l.id, name: l.name }))} slug={slug} />
            <CustomerDrawer tenantId={tenantId} />
            <AdminDropdownMenu slug={slug} tenantId={tenantId} hasStripe={!!tenant.stripeCustomerId} />
            <TutorialButton showInstallStep />
            <InstallAppButton />
          </div>
        </div>

        {searchParams?.error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-bold text-sm">
                  {searchParams.error === "MULTIPLE_CONFLICTS"
                    ? "Ci sono già clienti prenotati in questo periodo: spostali prima di chiudere il salone."
                    : searchParams.error === "INTERVALLO_NON_VALIDO"
                      ? "Scegli un orario di fine successivo all'orario di inizio."
                      : searchParams.error === "DATE_NON_VALIDE"
                        ? "Controlla le date della chiusura."
                    : `Errore: ${searchParams.error}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard cards */}
        <div id="tour-dashboard-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <div className="bg-gradient-to-br from-[#0b1221] to-[#0f192b] p-8 rounded-3xl shadow-2xl shadow-cyan-900/20 border border-white/5 flex flex-col justify-center h-full min-h-[320px] transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10 hover:border-cyan-500/30 group">
            <h2 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></span>
              </span>
              Prossimo in arrivo
            </h2>

            {nextAppointment ? (
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 truncate max-w-[180px] drop-shadow-sm">
                    {nextAppointment.customerName}
                  </p>
                  <p className="text-[#00b4ff] font-black text-2xl mt-1 drop-shadow-[0_0_12px_rgba(0,180,255,0.4)]">
                    {nextAppointment.time}
                    <span className="text-sm font-medium text-slate-500 ml-2">
                      ({nextAppointment.date.split("-").reverse().join("/")})
                    </span>
                  </p>
                </div>
                <div className="bg-gradient-to-br from-[#131c31] to-[#0b1221] p-4 rounded-2xl border border-white/5 text-2xl shadow-inner shadow-black/50 group-hover:border-cyan-500/30 transition-all">
                  ⏳
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <span className="text-5xl mb-3 opacity-20 grayscale group-hover:grayscale-0 transition-all duration-500">📅</span>
                <p className="text-slate-500 text-base font-medium">
                  Nessun cliente in attesa.
                </p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-[#0b1221] to-[#0f192b] p-8 rounded-3xl shadow-2xl shadow-emerald-900/20 border border-white/5 flex flex-col justify-center h-full min-h-[320px] relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-500/10 hover:border-emerald-500/30 group">
            <div className="absolute -right-6 -bottom-6 text-9xl opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-500">
              💰
            </div>
            <h2 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2 group-hover:text-emerald-400 transition-colors">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">📈</span>
              Statistiche Mese
            </h2>
            <div className="flex flex-col gap-1 mt-2 z-10 relative">
              <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-br from-emerald-400 to-teal-200 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                €{estimatedRevenue}
              </span>
              <span className="text-slate-500 font-bold text-sm tracking-wide mt-1">
                su <strong className="text-white">{validMonthly.length}</strong> appuntamenti previsti
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-4 font-medium z-10 relative leading-relaxed">
              Calcolo dinamico sul prezzo dei servizi configurati nel sistema.
            </p>
          </div>

          <MessageRechargeCard
            tenantId={tenantId}
            slug={slug}
            currentCredits={storeSettings?.smsCredits || 0}
          />
          <ReferralCard tenantId={tenantId} />
        </div>

        {/* LISTA ATTESA — sempre visibile */}
        <div id="tour-waitlist" className="mb-6">
          <WaitlistDashboard initialData={waitlistItems} tenantId={tenant.id} slug={slug} />
        </div>

        <TabbedArea initialTab={activeTab} tabConfig={tabConfig} slug={slug}>
          <div data-tab="agenda">
          <AgendaLocationTabbedArea locations={locations} slug={slug}>
            {agendaViews.map(view => {
              const columns = view.columns;
              const radarMap = view.radarMap;
              const freeGapReports = view.freeGapReports;
              const daySchedules = view.daySchedules;
              const viewWeekDays = view.weekDays;
              const maxConcurrent = columns.length;
              const lastAgendaSlot = allSlots[allSlots.length - 1];
              const lastSlotHasAppointment = Boolean(lastAgendaSlot) && viewWeekDays.some((day) =>
                columns.some((columnId) => Boolean(radarMap[day.date]?.[columnId]?.[lastAgendaSlot]))
              );
              const lastSlotIsOpen = Boolean(lastAgendaSlot) && viewWeekDays.some((day) =>
                getDayScheduleSlotStatus(daySchedules[day.date], lastAgendaSlot) === "open"
              );
              const agendaDisplaySlots = lastAgendaSlot && !lastSlotHasAppointment && !lastSlotIsOpen
                ? allSlots.slice(0, -1)
                : allSlots;
              return (
                <div key={view.id} data-location={view.id} className="w-full">
                  {/* AGENDA SETTIMANALE TETRIS */}
          {freeGapReports.length > 0 && (

            <div className="bg-[#0b1221] border border-[#1a2642] p-5 rounded-3xl shadow-xl shadow-cyan-900/10 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h2 className="text-lg font-extrabold text-white">
                  Buchi agenda da riempire
                </h2>
                <p className="text-xs text-slate-500 font-bold">
                  Spazi liberi utili nella settimana visibile
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {freeGapReports.map((gap) => (
                  <div
                    key={`${gap.date}-${gap.start}`}
                    className="bg-[#131c31] border border-[#1e2b4a] rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-bold capitalize">
                        {gap.label}
                      </p>
                      <p className="text-[#00b4ff] font-extrabold text-lg">
                        {gap.start} - {gap.end}
                      </p>
                    </div>
                    <div className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-3 py-1.5 rounded-xl text-xs font-bold">
                      {gap.duration} min
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div id="tour-agenda-dynamic" className="bg-gradient-to-b from-[#0d1628] to-[#09101d] p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/20 border border-white/[0.07] mb-6 overflow-hidden flex flex-col">
            <SwipeableAgenda>
              <DayNavigator currentDate={adjustedTargetDate} slug={slug} isMultiStaff={isMultiStaff} locationId={filterLocationId || undefined} />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 border-b border-white/[0.07] pb-4">
                <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2 tracking-tight">
                  📒 Agenda Dinamica ({tenantName})
                </h2>

                <div className="flex items-center gap-1 bg-[#131c31] p-1.5 rounded-2xl border border-[#1e2b4a] w-fit">
                  <Link
                    href={`/t/${slug}/admin?weekOffset=${weekOffset - 1}${filterLocationId ? `&locationId=${filterLocationId}` : ''}`}
                    prefetch={false}
                    scroll={false}
                    className="px-4 py-2 text-sm text-cyan-300 hover:text-white bg-cyan-500/5 hover:bg-cyan-500/15 rounded-xl transition-all duration-150 font-medium border border-cyan-500/10 hover:border-cyan-500/30 active:scale-95"
                  >
                    ← Prec
                  </Link>

                  <Link
                    href={`/t/${slug}/admin${filterLocationId ? `?locationId=${filterLocationId}` : ''}`}
                    prefetch={false}
                    scroll={false}
                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-150 active:scale-95 ${
                      weekOffset === 0
                        ? "bg-[#00b4ff] text-[#050814] shadow-lg shadow-cyan-500/20"
                        : "text-slate-300 hover:bg-[#1e2b4a] hover:scale-[1.05]"
                    }`}
                  >
                    Oggi
                  </Link>

                  <Link
                    href={`/t/${slug}/admin?weekOffset=${weekOffset + 1}${filterLocationId ? `&locationId=${filterLocationId}` : ''}`}
                    prefetch={false}
                    scroll={false}
                    className="px-4 py-2 text-sm text-cyan-300 hover:text-white bg-cyan-500/5 hover:bg-cyan-500/15 rounded-xl transition-all duration-150 font-medium border border-cyan-500/10 hover:border-cyan-500/30 active:scale-95"
                  >
                    Pros →
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3 px-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400/70 shadow-[0_0_8px_rgba(34,211,238,0.35)]" />
                  Disponibile
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400/70" />
                  Pausa
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-400/70" />
                  Permesso
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-400/70" />
                  Ferie
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400/60" />
                  Chiuso
                </span>
                <span className="ml-auto normal-case tracking-normal font-medium text-slate-600">
                  <span className="sm:hidden">Settimana completa</span>
                  <span className="hidden sm:inline">Scorri lateralmente per vedere tutta la settimana</span>
                </span>
              </div>

            <div className="overflow-x-auto pb-3 custom-scrollbar rounded-2xl border border-white/[0.06] bg-[#070d18]/70">
              <div
                className="min-w-full md:min-w-[900px] grid gap-x-px sm:gap-x-1 gap-y-0 p-1 pr-6 sm:p-3 sm:pr-8"
                style={{
                  gridTemplateColumns: `minmax(52px, 70px) repeat(${viewWeekDays.length}, repeat(${maxConcurrent}, minmax(0, 1fr)))`
                }}
              >
                  <div style={{ gridColumn: 1 }} className="text-slate-500 text-xs font-bold uppercase tracking-widest text-center flex items-center justify-center sticky left-0 top-0 bg-[#09101d]/95 backdrop-blur-md z-40 pb-2 shadow-[4px_0_12px_rgba(0,0,0,0.5)] md:shadow-none border-b border-white/[0.04] border-r">
                    Ora
                  </div>

                  {viewWeekDays.map((d, _dIndex) => {
                    const isToday = d.date === todayItaly;
                    
                    return (
                      <div key={d.date} style={{ gridColumn: `span ${maxConcurrent}` }} className="flex flex-col gap-1.5 mb-2 sticky top-0 z-30 bg-[#09101d]/95 backdrop-blur-md pb-1">
                        <div className={`text-center py-1.5 sm:py-2 rounded-lg border capitalize transition-colors text-[9px] sm:text-sm leading-tight ${
                          d.isClosed
                            ? "bg-rose-500/[0.08] text-rose-300/80 border-rose-500/20"
                            : isToday 
                              ? "bg-cyan-400/[0.12] text-cyan-300 font-extrabold border-cyan-400/40 shadow-[0_0_18px_rgba(34,211,238,0.10)]"
                              : "bg-white/[0.035] text-slate-100 font-bold border-white/[0.08]"
                        }`}>
                          {d.label} {d.isClosed && <span className="hidden sm:inline text-[10px] ml-1 font-mono">CHIUSO</span>}
                        </div>
                        {columns.length > 0 && (
                          <div className="grid gap-x-2" style={{ gridTemplateColumns: `repeat(${maxConcurrent}, minmax(0, 1fr))` }}>
                            {columns.map(colId => {
                              const s = staffList.find(staff => staff.id === colId) || { id: colId, name: colId };
                              return (
                                <div key={s.id} className="text-center text-[7px] sm:text-[10px] uppercase font-bold text-slate-400 bg-white/[0.025] py-1 rounded-md border border-white/[0.07] truncate px-0.5 sm:px-1">
                                  {s.name.split(' ')[0]}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {agendaDisplaySlots.map((slot, slotIndex) => {
                    const isQuarter = slot.endsWith("15") || slot.endsWith("45");
                    const previousSlot = agendaDisplaySlots[slotIndex - 1];
                    const nextSlot = agendaDisplaySlots[slotIndex + 1];

                    return (
                      <div className="contents" key={slot}>
                        <div style={{ gridColumn: 1 }} className="w-full h-full min-h-[32px] sm:min-h-[38px] text-slate-400 font-medium flex items-center justify-center text-[10px] sm:text-sm bg-[#09101d]/95 backdrop-blur-md sticky left-0 z-20 border-r border-white/[0.04] shadow-[4px_0_12px_rgba(0,0,0,0.5)] md:shadow-none">
                          <span
                            className={`px-1 sm:px-2 py-1 rounded-xl transition-all ${
                              isQuarter
                                ? "text-[10px] text-slate-600"
                                : "bg-white/[0.035] border border-white/[0.08] text-slate-300"
                            }`}
                          >
                            {slot}
                          </span>
                        </div>

                        {viewWeekDays.map((d, dIndex) => {
                          const cols: any[] = [];
                          columns.forEach((colId, cIndex) => {
                            const apptVal = radarMap[d.date]?.[colId]?.[slot];
                            const cellKey = `${d.date}-${slot}-${colId}`;
                            const targetColumn = (dIndex * maxConcurrent) + cIndex + 2;

                            if (apptVal === "COVERED") {
                              return;
                            }

                            const appts = Array.isArray(apptVal) ? apptVal : apptVal ? [apptVal] : [];

                            if (appts.length > 0) {
                              const [y, m, dStr] = d.date.split("-");
                              const maxSpan = Math.max(...appts.map((a: any) => a._rowSpan || 1));
                              cols.push(
                                <div
                                  key={cellKey}
                                  style={{
                                    gridRow: `span ${maxSpan} / span ${maxSpan}`,
                                    gridColumn: targetColumn
                                  }}
                                  className="h-full min-h-[32px] sm:min-h-[38px] py-px relative z-10 flex flex-col gap-1"
                                >
                                  {appts.map((item: any, itemIdx: number) => {
                                    if (item._nativeException) {
                                      const nativeStyle = item._nativeException === "ferie"
                                        ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
                                        : item._nativeException === "pausa"
                                          ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                                          : "border-blue-500/30 bg-blue-500/10 text-blue-300";
                                      const nativeLabel = item._nativeException === "ferie"
                                        ? "FERIE"
                                        : item._nativeException === "pausa"
                                          ? "PAUSA"
                                          : "PERMESSO";
                                      const nativeTime = item._nativeException === "ferie" && item.time === "ALL_DAY"
                                        ? "Tutto il giorno"
                                        : `${item.time}–${item.endTime}`;

                                      return (
                                        <div
                                          key={item.id || itemIdx}
                                          title={`${nativeLabel} · ${nativeTime}`}
                                          className={`flex h-full min-h-[44px] w-full flex-col items-center justify-center rounded-xl border p-1 text-center font-bold ${nativeStyle}`}
                                        >
                                          <span className="text-xs leading-tight">{nativeLabel}</span>
                                          <span className="mt-0.5 text-[9px] font-medium opacity-75">{nativeTime}</span>
                                        </div>
                                      );
                                    }

                                    return (
                                      <AppointmentBlock
                                        key={item.id || itemIdx}
                                        appt={item}
                                        italianDate={`${dStr}/${m}/${y}`}
                                        durationInMinutes={(item._rowSpan || 1) * 15}
                                      />
                                    );
                                  })}
                                </div>
                              );
                              return;
                            }

                            const slotStatus = getDayScheduleSlotStatus(daySchedules[d.date], slot);
                            if (slotStatus !== "open") {
                              const previousAppointment = previousSlot
                                ? radarMap[d.date]?.[colId]?.[previousSlot]
                                : null;
                              const nextAppointment = nextSlot
                                ? radarMap[d.date]?.[colId]?.[nextSlot]
                                : null;
                              const previousStatus = previousSlot
                                ? getDayScheduleSlotStatus(daySchedules[d.date], previousSlot)
                                : null;
                              const nextStatus = nextSlot
                                ? getDayScheduleSlotStatus(daySchedules[d.date], nextSlot)
                                : null;
                              const isStatusStart = !previousSlot || previousStatus !== slotStatus || Boolean(previousAppointment);
                              const isStatusEnd = !nextSlot || nextStatus !== slotStatus || Boolean(nextAppointment);

                              cols.push(
                                <div
                                  key={cellKey}
                                  style={{ gridColumn: targetColumn }}
                                  aria-label={`${slotStatus === "break" ? "Pausa" : "Chiuso"} alle ${slot}`}
                                  title={`${slotStatus === "break" ? "Pausa" : "Chiuso"} alle ${slot}`}
                                  className={`mx-px h-full min-h-[32px] sm:min-h-[38px] flex items-center justify-center border-x ${
                                    slotStatus === "break"
                                      ? "bg-amber-400/[0.07] border-amber-400/[0.12]"
                                      : "bg-rose-400/[0.065] border-rose-400/[0.11]"
                                  } ${
                                    isStatusStart ? "rounded-t-xl border-t" : "border-t-0"
                                  } ${
                                    isStatusEnd ? "rounded-b-xl border-b" : "border-b-0"
                                  }`}
                                >
                                  {isStatusStart && (
                                    <span className={`hidden sm:inline text-[10px] font-mono font-bold tracking-wider ${
                                      slotStatus === "break" ? "text-amber-300/70" : "text-rose-300/55"
                                    }`}>
                                      {slotStatus === "break" ? "PAUSA" : "CHIUSO"}
                                    </span>
                                  )}
                                </div>
                              );
                            } else {
                              cols.push(
                                <div key={cellKey} style={{ gridColumn: targetColumn }} className="h-full min-h-[32px] sm:min-h-[38px]">
                                  <WalkInButton
                                    date={d.date}
                                    time={slot}
                                    tenantId={tenantId}
                                    services={tenantServices}
                                    staff={staffList}
                                    locationId={view.id === "all" ? undefined : view.id}
                                  />
                                </div>
                              );
                            }
                          });
                          return cols;
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </SwipeableAgenda>
          </div>

            <div className="flex flex-col gap-6">
              <div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-red-900/5 border border-[#1a2642] h-fit flex flex-col">
                <div className="mb-6 pb-6 border-b border-[#1e2b4a]">
                  <h2 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <span>🧭</span>
                    Chiusure generali attive
                  </h2>

                  <div className="overflow-y-auto max-h-[220px] custom-scrollbar space-y-2 pr-1">
                    {currentClosures.length > 0 ? (
                      currentClosures.map((app) => {
                        const isFerie =
                          app.time === "ALL_DAY" ||
                          app.customerName.includes("FERIE");
                        const isShopClosure = app.source === "shop";

                        return (
                          <div
                            key={app.id}
                            className="flex items-center justify-between gap-3 p-3 bg-[#131c31] rounded-xl border border-[#1e2b4a]"
                          >
                            <div className="min-w-0">
                              <p
                                className={`font-bold text-[12px] truncate ${
                                  isFerie ? "text-orange-400" : "text-slate-300"
                                }`}
                              >
                                {isShopClosure
                                  ? app.time === "ALL_DAY" ? "CHIUSURA GENERALE" : "CHIUSURA TEMPORANEA"
                                  : isFerie ? "🌴 FERIE" : "☕ PAUSA"}
                              </p>
                              <p className="text-slate-400 text-[10px] uppercase mt-0.5">
                                {app.date.split("-").reverse().join("/")} •{" "}
                                {app.time === "ALL_DAY"
                                  ? "Tutto il giorno"
                                  : `${app.time}${app.endTime ? ` - ${app.endTime}` : ""}`}
                              </p>
                            </div>

                            {isShopClosure ? (
                              <form action={unblockShopClosure} className="shrink-0">
                                <input type="hidden" name="closureId" value={app.id} />
                                <button type="submit" className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700">Sblocca</button>
                              </form>
                            ) : (
                              <div className="scale-75 origin-right shrink-0">
                                <DeleteButton
                                  appointmentId={app.id}
                                  customerName={app.customerName}
                                  phone="0000000000"
                                  date={app.date}
                                  time={app.time}
                                  isSpecial={true}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-slate-500 text-sm italic">
                        Nessuna chiusura generale attiva nella settimana visibile.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <span>⚙️</span>
                    Chiusura generale del salone
                  </h2>

                  <div className="mb-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
                    <p className="text-xs font-bold text-indigo-200">Ferie, permessi e pause di un collaboratore</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">Gestiscili da Team → icona dell&apos;orologio accanto al nome. Lì sono salvati sul singolo dipendente e bloccano automaticamente le prenotazioni.</p>
                  </div>

                  <div className="mb-6 pb-6 border-b border-[#1e2b4a]">
                    <h3 className="text-[10px] text-slate-400 font-bold uppercase mb-3">
                      ☕ Chiusura temporanea (tutto il salone)
                    </h3>

                    <form
                      action={createShopClosure}
                      className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full"
                    >
                      <input type="hidden" name="blockType" value="PAUSA" />
                      <input type="hidden" name="staffId" value="all" />
                      <input
                        type="date"
                        name="date"
                        required
                        defaultValue={todayItaly}
                        className="col-span-2 sm:col-span-1 bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-3 py-2 focus:outline-none text-sm"
                        style={{ colorScheme: "dark" }}
                      />
                      <select
                        name="startTime"
                        required
                        className="bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-2 py-2 text-sm"
                      >
                        <option value="">Dalle</option>
                        {allSlots.map((s) => (
                          <option key={`s-${s}`} value={s}>{s}</option>
                        ))}
                      </select>
                      <select
                        name="endTime"
                        required
                        className="bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-2 py-2 text-sm"
                      >
                        <option value="">Alle</option>
                        {allSlots.map((s) => (
                          <option key={`e-${s}`} value={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="col-span-2 sm:col-span-1 bg-red-500/10 text-red-400 border border-red-500/20 font-bold px-4 py-2 rounded-xl text-sm"
                      >
                        Chiudi salone
                      </button>
                    </form>
                  </div>

                  <div>
                    <h3 className="text-[10px] text-orange-400 font-bold uppercase mb-2">
                      🌴 Chiusura intera (dal - al)
                    </h3>

                    <form
                      action={createShopHoliday}
                      className="flex flex-wrap sm:flex-nowrap gap-2 w-full"
                    >
                      <input type="hidden" name="staffId" value="all" />
                      <input
                        type="date"
                        name="startDate"
                        required
                        defaultValue={todayItaly}
                        className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-2 py-2 focus:outline-none focus:border-orange-500/50 text-sm"
                        style={{
                          colorScheme: "dark",
                        }}
                      />

                      <input
                        type="date"
                        name="endDate"
                        required
                        defaultValue={todayItaly}
                        className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-2 py-2 focus:outline-none focus:border-orange-500/50 text-sm"
                        style={{
                          colorScheme: "dark",
                        }}
                      />

                      <button
                        type="submit"
                        className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 font-bold px-3 py-2 rounded-xl transition text-sm w-full sm:w-auto"
                      >
                        Salva
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>

              );
            })}
          </AgendaLocationTabbedArea>
          </div>
          <div data-tab="gestione">
            <TrialLaunchPanel
              slug={slug}
              tenantId={tenantId}
              tenantName={tenant.name}
              category={tenant.category}
              city={tenant.city}
              description={tenant.description}
              phone={tenant.phone}
              address={tenant.address}
              instagramUrl={tenant.instagramUrl}
              tiktokUrl={tenant.tiktokUrl}
              mapsLink={tenant.mapsLink}
              openTime={tenant.openTime}
              closeTime={tenant.closeTime}
              breakStart={tenant.breakStart}
              breakEnd={tenant.breakEnd}
              closedDays={typeof tenant.closedDays === 'string' ? JSON.parse(tenant.closedDays) : tenant.closedDays}
              trialStatus={tenant.trialStatus}
              isDemoData={tenant.isDemoData}
              trialEndsAt={tenant.trialEndsAt?.toISOString()}
              services={tenantServices.map((service) => ({
                id: service.id,
                name: service.name,
                duration: service.duration,
                price: service.price ?? "",
              }))}
              staffCount={staffList.length}
              appointmentCount={rawAppointments.filter((app) => !app.customerName.includes("PAUSA") && !app.customerName.includes("FERIE")).length}
            />
            
            <MarketingWidget tenantId={tenantId} isPremium={isPremium} plan={tenant.plan} slug={slug} />

            <div className="mt-6">
              <ReviewNeatxWidget slug={slug} initialReview={platformReview} />
            </div>

            <div className="mt-6">
              <LocationTabs
                tenantId={tenantId}
                tenantSlug={slug}
                tenantName={tenantName}
                tenantLogoUrl={tenant.logoUrl}
                plan={tenant.plan}
              />
            </div>
          </div>

          <div data-tab="business">
            <div id="tour-business-focus" className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-cyan-900/10 border border-[#1a2642] h-full flex flex-col relative overflow-hidden mb-6">
              <div className="absolute -right-4 -top-4 text-8xl opacity-[0.02] pointer-events-none">
                🎯
              </div>

              <h2 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2">
                <span>🎯</span>
                Focus di Oggi
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#131c31] border border-[#1e2b4a] p-4 rounded-2xl shadow-inner">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                    Clienti Oggi
                  </p>

                  <p className="text-3xl font-extrabold text-white">
                    {todayAppointmentsList.length}
                  </p>
                </div>

                <div className="bg-[#131c31] border border-[#1e2b4a] p-4 rounded-2xl shadow-inner">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                    Già Pagati
                  </p>

                  <p className="text-3xl font-extrabold text-emerald-400">
                    {todayPaid}
                  </p>
                </div>
              </div>

              <div className="bg-[#131c31] border border-[#1e2b4a] p-5 rounded-2xl flex items-center justify-between shadow-inner mb-6">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                    Incasso Stimato Oggi
                  </p>

                  <p className="text-4xl font-extrabold text-[#00b4ff]">
                    {isPremium ? `€${todayTotalRevenue}` : '🔒'}
                  </p>
                </div>

                <div className="text-4xl opacity-20">💰</div>
              </div>
            </div>

            <AnalyticsChart data={analyticsData} isPro={isPremium} plan={tenant.plan} slug={slug} />

{/* SEZIONE PAGAMENTI STRIPE */}
            <div id="tour-stripe-form" className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-blue-900/10 border border-[#1a2642] h-full flex flex-col relative overflow-hidden mb-6">
              <div className="absolute -right-4 -top-4 text-8xl opacity-[0.02] pointer-events-none">
                💳
              </div>
              <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-lg font-extrabold text-white mb-1 flex items-center gap-2">
                    <CreditCard size={20} />
                    Integrazione Pagamenti (Stripe)
                  </h2>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                    I pagamenti vanno direttamente sul <strong className="text-slate-300">tuo</strong> IBAN. <strong className="text-emerald-400">NeatX non tocca i tuoi soldi.</strong> Non li tratteniamo, non li spostiamo, non li vediamo. È Stripe (lo stesso circuito di PayPal) a gestire il trasferimento dal cliente al tuo conto. <strong className="text-slate-300">NeatX non salva né il tuo IBAN né i tuoi dati bancari.</strong> Zero commissioni da parte nostra (solo il ~1.5% di Stripe). Inserisci nome, cognome, data di nascita e IBAN direttamente su Stripe — noi non vediamo nulla.
                  </p>
                  
                  <div className="flex flex-col md:flex-row gap-3 items-stretch mt-4">
                    <div className="bg-[#131c31] border border-[#1e2b4a] rounded-xl p-3 flex-1 max-w-sm">
                      <p className="text-xs text-slate-400 font-medium mb-1">Dopo aver cliccato "Collega IBAN":</p>
                      <ol className="text-[11px] text-slate-500 space-y-1 ml-4 list-decimal">
                        <li>Verrai reindirizzato su <strong className="text-slate-300">Stripe</strong> (il circuito di pagamenti)</li>
                        <li>Inserisci <strong className="text-slate-300">nome, cognome, data di nascita e IBAN</strong></li>
                        <li>Conferma — fatto. I pagamenti dei clienti arrivano direttamente sul tuo conto</li>
                      </ol>
                      <p className="text-[10px] text-slate-600 mt-2 italic">NeatX non riceve, non salva e non vede nessuno di questi dati.</p>
                    </div>

                    <div className="relative rounded-2xl p-5 flex-1 max-w-sm flex flex-col justify-between overflow-hidden shadow-2xl group border border-white/10 bg-[#111111]">
                      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600 rounded-full mix-blend-screen filter blur-[50px] opacity-40 group-hover:opacity-60 transition-opacity"></div>
                      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600 rounded-full mix-blend-screen filter blur-[50px] opacity-40 group-hover:opacity-60 transition-opacity"></div>
                      
                      <div className="z-10 relative">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-sans font-black text-white tracking-tighter text-[18px]">
                            Revolut <span className="font-normal text-slate-300 tracking-normal">Pro</span>
                          </span>
                          <span className="bg-white/10 text-white px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border border-white/10">Sponsor</span>
                        </div>
                        <p className="text-[13px] text-white font-semibold mb-1">Il conto business per freelance.</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
                          Cashback su ogni acquisto e zero canone mensile. Perfetto da usare per gli incassi Stripe.
                        </p>
                      </div>
                      
                      <a href="https://revolut.com/referral/?referral-code=lorebisceglie!JUL2-26-AR-RPB&geo-redirect" target="_blank" rel="noopener noreferrer" className="z-10 relative inline-flex items-center justify-center w-full bg-white text-black text-[12px] font-bold py-2.5 px-4 rounded-xl hover:bg-slate-200 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]">
                        Apri conto gratuito →
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="shrink-0 w-full xl:w-auto">
                  {storeSettings?.stripeOnboardingComplete ? (
                    <div className="flex flex-col items-start xl:items-end gap-1">
                      <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10">
                        <CheckCircle size={16} /> IBAN Collegato (Gestisci su Stripe)
                      </a>
                      <span className="text-[10px] text-slate-500 ml-1 xl:ml-0 xl:mr-2">I tuoi dati bancari restano solo su Stripe, NeatX non li salva</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start xl:items-end gap-2">
                      <StripeConnectButton tenantId={tenantId} />
                      <span className="text-[10px] text-slate-600 text-left xl:text-right max-w-[240px] leading-relaxed">Inserisci i dati direttamente su Stripe. <strong className="text-slate-500">NeatX non vede e non salva il tuo IBAN.</strong></span>
                    </div>
                  )}
                </div>
              </div>
              
              {storeSettings?.stripeOnboardingComplete && (
                <StripeSettingsForm 
                  tenantId={tenantId}
                  initialStrategy={storeSettings.paymentStrategy}
                  initialFixed={storeSettings.paymentFixedAmount}
                  initialPercentage={storeSettings.paymentPercentage}
                  initialMandatory={storeSettings.paymentMandatory}
                />
              )}
            </div>

{/* ATTIVITA RECENTI */}
            <div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-cyan-900/10 border border-[#1a2642] h-full flex flex-col">
              <h2 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2">
                <Receipt size={20} />
                Attività Recenti
              </h2>

              <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-3 max-h-[500px]">
                {recentActivities.length > 0 ? (
                  recentActivities.map((log) => {
                    let bgColor = "bg-[#131c31]";
                    let dotColor = "bg-slate-500";
                    let icon = "📝";

                    if (log.action === "CREATE_APPOINTMENT") {
                      bgColor = "bg-emerald-500/10 border-emerald-500/20";
                      dotColor = "bg-emerald-400";
                      icon = "✅";
                    } else if (log.action === "DELETE_APPOINTMENT" || log.action === "CANCEL_APPOINTMENT") {
                      bgColor = "bg-red-500/10 border-red-500/20";
                      dotColor = "bg-red-400";
                      icon = "❌";
                    } else if (log.action === "MOVE_APPOINTMENT") {
                      bgColor = "bg-amber-500/10 border-amber-500/20";
                      dotColor = "bg-amber-400";
                      icon = "🔄";
                    } else if (log.action === "NO_SHOW") {
                      bgColor = "bg-orange-500/10 border-orange-500/20";
                      dotColor = "bg-orange-400";
                      icon = "👻";
                    } else if (log.action === "SECURITY_ALERT") {
                      bgColor = "bg-red-500/20 border-red-500/40 animate-pulse";
                      dotColor = "bg-red-500";
                      icon = "🚨";
                    }

                    return (
                      <div
                        key={log.id}
                        className={`p-4 rounded-2xl border ${bgColor} flex gap-3`}
                      >
                        <div className="mt-1">
                          <span className="text-lg">{icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white mb-1 leading-snug">
                            {log.message}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-2">
                            <span>
                              {new Date(log.createdAt).toLocaleDateString("it-IT", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
                            ></span>
                            <span>{log.actor === "admin" ? "Admin" : "Cliente"}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 bg-[#131c31] rounded-2xl border border-[#1e2b4a]">
                    <span className="text-4xl block mb-2 opacity-30">😴</span>
                    <p className="text-slate-400 text-sm font-medium">
                      Nessuna attività recente
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </TabbedArea>
        
        {isSuperAdmin && (
          <ActivityLogPanel tenantId={tenantId} />
        )}

        <SupportWidget tenantId={tenant.id} colorTheme={tenant.themeColor} />
      </div>
    </div>
  );
}
