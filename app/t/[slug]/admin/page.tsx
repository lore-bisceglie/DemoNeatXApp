import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export function headers() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  };
}
import { BarChart3, CalendarDays, Users, Receipt, Globe, CreditCard, CheckCircle } from "lucide-react";
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
import ResetDemoButton from "../../../dashboard/ResetDemoButton";
import DayNavigator from "../../../dashboard/DayNavigator";
import AnalyticsChart from "../../../dashboard/AnalyticsChart";
import MessageRechargeCard from "./MessageRechargeCard";
import StripeConnectButton from "./StripeConnectButton";
import ReferralCard from "@/components/ReferralCard";
import LocationTabs from "@/components/admin/LocationTabs";

import LoginScreen from "./LoginScreen";
import TrialLaunchPanel from "./TrialLaunchPanel";
import SupportWidget from "./SupportWidget";
import crypto from "crypto";

export default async function Dashboard(props: { searchParams: Promise<{ [key: string]: string | undefined }>; params: Promise<{ slug: string }> }) {
  noStore();

  const searchParams = await props.searchParams;
  const activeTab = searchParams?.tab || (searchParams?.stripe ? 'stripe' : 'agenda');
  const filterLocationId = searchParams?.locationId || "";

  
  const { slug } = await props.params;
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('admin_auth_' + slug)?.value;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { services: true }
  });

  if (!tenant) return <div className="p-10 text-white">Attività non trovata.</div>;

  if (!tenant.adminPassword) {
    const newPassword = crypto.randomUUID().substring(0, 8);
    await prisma.tenant.update({ where: { slug }, data: { adminPassword: newPassword } });
    return <LoginScreen slug={slug} tenantName={tenant.name} showLegacyHint />;
  }

  if (authCookie !== tenant.adminPassword) {
    return (
      <LoginScreen
        slug={slug}
        tenantName={tenant.name}
        ownerEmail={tenant.ownerEmail}
        showLegacyHint={!tenant.ownerPasswordHash}
      />
    );
  }

  const tenantId = tenant.id;
  const tenantName = tenant.name;
  const tenantServices = tenant.services;

  // C1 — Primo gruppo di query parallele: tutte dipendono solo da tenantId
  // e sono indipendenti tra loro, quindi partono insieme.
  const [staffList, locationsRaw] = await Promise.all([
    prisma.staff.findMany({ where: { tenantId } }),
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

  // Logica PAYWALL (viene eseguita dopo aver già caricato staff e locations in parallelo)
  const todayDate = new Date();
  const trialEndsAt = tenant.trialEndsAt;
  const isTrialExpired = trialEndsAt && todayDate > trialEndsAt;
  if (isTrialExpired && tenant.plan !== "pro" && tenant.plan !== "elite" && tenant.trialStatus !== "converted" && !searchParams?.payment) {
    redirect(`/paywall/${slug}`);
  }

  
  // Parse chiusura days
  let activeClosedDays: number[] = [];
  if (tenant.closedDays) {
    try { activeClosedDays = JSON.parse(tenant.closedDays); } catch {}
  }
  if (filterLocationId) {
    const loc = locations.find(l => l.id === filterLocationId);
    if (loc?.closedDays) {
      try { activeClosedDays = JSON.parse(loc.closedDays); } catch {}
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

  const timeToMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (value: number) => {
    const hours = Math.floor(value / 60).toString().padStart(2, "0");
    const minutes = (value % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const isPremium = tenant.plan === "elite" || (tenant.trialEndsAt != null && new Date(tenant.trialEndsAt) > new Date());
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

  const allSlots: string[] = [];
  for (let h = 9; h <= 19; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 19 && m > 0) break;
      allSlots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
  }

  const isAgendaTab = activeTab === 'agenda';
  const isServiziTab = activeTab === 'servizi';

  // C1 — Secondo gruppo di query parallele: tutte dipendono da weekDatesArray e currentMonthPrefix
  // che sono ora disponibili. Le lanciamo insieme per dimezzare il tempo di attesa DB.
  const currentMonthPrefix = todayItaly.substring(0, 7);
  const [
    rawAppointments,
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
        ...(filterLocationId ? { locationId: filterLocationId } : {}),
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      include: { service: true, staff: true },
    }),
    // Appuntamenti per il radar (griglia settimanale) — solo se tab agenda
    isAgendaTab
      ? prisma.appointment.findMany({
          where: {
            date: { in: weekDatesArray },
            tenantId,
            ...(filterLocationId ? { locationId: filterLocationId } : {}),
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
  const waitlistData = waitlistItems;
  const radarAppointments = radarAppointmentsRaw;

  const columns = staffList.length > 0 ? staffList.map(s => s.id) : ["unassigned"];
  const maxConcurrent = columns.length;
  const radarMap: Record<string, Record<string, Record<string, any>>> = {};

  if (isAgendaTab) {
    weekDatesArray.forEach((d) => {
      radarMap[d] = {};
      for (const colId of columns) {
        radarMap[d][colId] = {};
      }
    });
  }



  radarAppointments.forEach((app) => {
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

    const slotsToCover = Math.ceil(durationMins / 15);
    const startIndex = app.time === "ALL_DAY" ? 0 : allSlots.indexOf(app.time);

    if (startIndex !== -1) {
      const appWithSpan = {
        ...app,
        _rowSpan: slotsToCover,
      };

      // Assegna la colonna in base allo staffId reale dell'appuntamento, fallback sulla prima colonna per appuntamenti vecchi
      const targetCol = app.staffId && columns.includes(app.staffId) ? app.staffId : columns[0];
      const actualTime = app.time === "ALL_DAY" ? "09:00" : app.time;
      radarMap[app.date][targetCol][actualTime] = appWithSpan;

      for (let idx = 1; idx < slotsToCover; idx++) {
        const coveredSlot = allSlots[startIndex + idx];
        if (coveredSlot) {
          radarMap[app.date][targetCol][coveredSlot] = "COVERED";
        }
      }
    }
  });
  const freeGapReports = weekDays
    .flatMap((dayInfo) => {
      const gaps: {
        date: string;
        label: string;
        start: string;
        end: string;
        duration: number;
      }[] = [];

      let gapStart: string | null = null;
      let gapDuration = 0;

      allSlots.forEach((slot) => {
        const isPastToday =
          dayInfo.date === todayItaly &&
          timeToMinutes(slot) <= currentTotalMinutes;
        let isSlotCompletelyFree = false;
        for (const colId of columns) {
          if (!radarMap[dayInfo.date]?.[colId]?.[slot]) {
            isSlotCompletelyFree = true;
            break;
          }
        }
        const isFree = !isPastToday && isSlotCompletelyFree;

        if (isFree) {
          if (!gapStart) gapStart = slot;
          gapDuration += 15;
          return;
        }

        if (gapStart && gapDuration >= 30) {
          gaps.push({
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
        gaps.push({
          date: dayInfo.date,
          label: dayInfo.label,
          start: gapStart,
          end: minutesToTime(timeToMinutes(gapStart) + gapDuration),
          duration: gapDuration,
        });
      }

      return gaps;
    })
    .sort((a, b) => {
      if (a.date === b.date) return a.start.localeCompare(b.start);
      return a.date.localeCompare(b.date);
    })
    .slice(0, 6);

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
  const currentClosures = appointments.filter((app) => isClosure(app));


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

          const existingApps = await prisma.appointment.findMany({
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
          existingApps.forEach((app) => {
            const aStart =
              parseInt(app.time.split(":")[0]) * 60 +
              parseInt(app.time.split(":")[1]);

            const aEnd = app.endTime
              ? parseInt(app.endTime.split(":")[0]) * 60 +
                parseInt(app.endTime.split(":")[1])
              : aStart + 15;

            if (Math.max(startMins, aStart) < Math.min(endMins, aEnd)) {
              overlapCount++;
            }
          });
          const hasOverlap = overlapCount >= (storeSettings?.maxConcurrentAppointments || 1);

          if (hasOverlap) {
            redirectUrl = `/t/${slug}/admin?error=MULTIPLE_CONFLICTS`;
          } else {
            let staffIds: (string | null)[] = [null];
            
            if (staffIdParam && staffIdParam !== "all") {
              staffIds = [staffIdParam];
            } else {
              const staffMembers = await prisma.staff.findMany({ where: { tenantId } });
              if (staffMembers.length > 0) {
                staffIds = staffMembers.map((s) => s.id);
              }
            }
            
            const label = blockType === "PERMESSO" ? "📋 PERMESSO" : "☕ PAUSA";
            const newApps = staffIds.map(sId => ({
                customerName: label,
                customerPhone: "0000000000",
                date,
                time: startTime,
                endTime,
                tenantId,
                staffId: sId,
                cancelToken: crypto.randomUUID(),
            }));
            await prisma.appointment.createMany({ data: newApps });
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
      const datesToBlock = [];
      const checkLoop = new Date(start);

      while (checkLoop <= end) {
        datesToBlock.push(checkLoop.toISOString().split("T")[0]);
        checkLoop.setDate(checkLoop.getDate() + 1);
      }

      try {
        const existingAppointments = await prisma.appointment.findMany({
          where: {
            date: {
              in: datesToBlock,
            },
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
          const insertLoop = new Date(start);

          while (insertLoop <= end) {
            const d = insertLoop.toISOString().split("T")[0];

            let staffIds: (string | null)[] = [null];
            
            if (staffIdParam && staffIdParam !== "all") {
              staffIds = [staffIdParam];
            } else {
              const staffMembers = await prisma.staff.findMany({ where: { tenantId } });
              if (staffMembers.length > 0) {
                staffIds = staffMembers.map((s) => s.id);
              }
            }
            
            for (const sId of staffIds) {
              const existingFerie = await prisma.appointment.findFirst({
                where: { date: d, time: "ALL_DAY", tenantId, staffId: sId },
              });

              if (!existingFerie) {
                await prisma.appointment.create({
                  data: {
                    customerName: "🌴 FERIE",
                    customerPhone: "0000000000",
                    date: d,
                    time: "ALL_DAY",
                    tenantId,
                    staffId: sId,
                    cancelToken: crypto.randomUUID(),
                  },
                });
              }
            }

            insertLoop.setDate(insertLoop.getDate() + 1);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    revalidatePath(redirectUrl);
    redirect(redirectUrl);
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

          <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <TeamDrawer tenantId={tenantId} isPremium={isPremium} plan={tenant.plan} allServices={tenantServices} initialStaffSheetUrl={tenant.staffSheetUrl} locations={locations.map(l => ({ id: l.id, name: l.name }))} slug={slug} />
            <CustomerDrawer tenantId={tenantId} />
            <Link
              href={`/t/${slug}/admin/analytics`}
              className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 text-sm active:scale-90 hover:scale-[1.03]"
            >
              <BarChart3 size={16} /><span className="hidden sm:inline">Analytics</span>
            </Link>
            {tenant.stripeCustomerId && <PortalButton slug={slug} />}
            <a
              href={`/api/export/appointments?tenantId=${tenantId}`}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-emerald-500/30 transition-all duration-150 flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-90 hover:scale-[1.03]"
            >
              <CalendarDays size={16} /><span className="hidden sm:inline">Export</span> Agenda
            </a>
            <a
              href={`/api/export/customers?tenantId=${tenantId}`}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-amber-500/30 transition-all duration-150 flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-90 hover:scale-[1.03]"
            >
              <Users size={16} /><span className="hidden sm:inline">Export</span> Clienti
            </a>
            <a
              href={`/api/export/timesheets?tenantId=${tenantId}`}
              className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-blue-500/30 transition-all duration-150 flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-90 hover:scale-[1.03]"
            >
              <Receipt size={16} /><span className="hidden sm:inline">Export</span> Presenze
            </a>
            <Link
              href={`/t/${slug}`}
              target="_blank"
              className="col-span-3 sm:col-span-1 bg-gradient-to-r from-[#00b4ff] to-cyan-400 hover:from-cyan-400 hover:to-[#00b4ff] text-[#050814] text-sm font-extrabold px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-150 flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 hover:scale-[1.03]"
            >
              <Globe size={16} /> Pagina Clienti
            </Link>
          </div>
        </div>

        {/* Dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
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
        <div className="mb-6">
          <WaitlistDashboard initialData={waitlistItems} tenantId={tenant.id} slug={slug} />
        </div>

        <TabbedArea initialTab={activeTab} tabConfig={tabConfig} slug={slug}>
          <div data-tab="agenda">
            {locations.length > 1 && (
              <div className="mb-4 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 snap-x">
                <Link href={`/t/${slug}/admin?tab=agenda`} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-150 snap-center active:scale-90 ${!filterLocationId ? 'bg-[#00b4ff] text-[#050814] border-[#00b4ff] shadow-[0_0_8px_rgba(0,180,255,0.3)]' : 'bg-[#131c31] text-slate-400 border-[#1e2b4a] hover:border-slate-500 hover:bg-[#1a2642]'}`}>Tutte le sedi</Link>
                {locations.map((loc: any) => (
                  <Link key={loc.id} href={`/t/${slug}/admin?tab=agenda&locationId=${loc.id}`} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-150 snap-center active:scale-90 ${filterLocationId === loc.id ? 'bg-[#00b4ff] text-[#050814] border-[#00b4ff] shadow-[0_0_8px_rgba(0,180,255,0.3)]' : 'bg-[#131c31] text-slate-400 border-[#1e2b4a] hover:border-slate-500 hover:bg-[#1a2642]'}`}>{loc.name}</Link>
                ))}
              </div>
            )}
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

          <div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-cyan-900/10 border border-[#1a2642] mb-6 overflow-hidden flex flex-col">
            <SwipeableAgenda>
              <DayNavigator currentDate={adjustedTargetDate} slug={slug} isMultiStaff={isMultiStaff} locationId={filterLocationId || undefined} />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-[#1e2b4a] pb-4">
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
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

            <div className="overflow-x-auto pb-4 custom-scrollbar">
              <div
                className="min-w-[650px] md:min-w-[900px] grid gap-x-2 gap-y-0"
                style={{
                  gridTemplateColumns: `minmax(60px, 80px) repeat(${weekDays.length}, repeat(${maxConcurrent}, minmax(0, 1fr)))`
                }}
              >
                  <div style={{ gridColumn: 1 }} className="text-slate-500 font-bold text-center flex items-center justify-center sticky left-0 bg-[#0b1221] z-20 pb-2 shadow-[8px_0_0_#0b1221] md:shadow-none border-b border-transparent">
                    Ora
                  </div>

                  {weekDays.map((d, dIndex) => {
                    const isToday = d.date === todayItaly;
                    
                    return (
                      <div key={d.date} style={{ gridColumn: `span ${maxConcurrent}` }} className="flex flex-col gap-2 mb-2">
                        <div className={`text-center py-2 rounded-xl border capitalize transition-colors ${
                          d.isClosed
                            ? "bg-red-900/20 text-red-400 border-red-800/30"
                            : isToday 
                              ? "bg-cyan-500/10 text-[#00b4ff] font-extrabold border-[#00b4ff]/40 shadow-[0_0_15px_rgba(0,180,255,0.15)]" 
                              : "bg-[#131c31] text-white font-bold border-[#1e2b4a]"
                        }`}>
                          {d.label} {d.isClosed && <span className="text-[10px] ml-1 font-mono">CHIUSO</span>}
                        </div>
                        {staffList.length > 0 && (
                          <div className="grid gap-x-2" style={{ gridTemplateColumns: `repeat(${maxConcurrent}, minmax(0, 1fr))` }}>
                            {staffList.map(s => (
                              <div key={s.id} className="text-center text-[10px] uppercase font-bold text-slate-400 bg-[#0b1221] py-1 rounded border border-[#1e2b4a] truncate px-1">
                                {s.name.split(' ')[0]}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {allSlots.map((slot) => {
                    const isQuarter = slot.endsWith("15") || slot.endsWith("45");

                    return (
                      <div className="contents" key={slot}>
                        <div style={{ gridColumn: 1 }} className="w-full h-full text-slate-400 font-medium flex items-center justify-center text-sm bg-[#0b1221] sticky left-0 z-20 border-r border-transparent shadow-[8px_0_0_#0b1221] md:shadow-none">
                          <span
                            className={`px-2 py-1 rounded-xl transition-all ${
                              isQuarter
                                ? "text-[10px] text-slate-600"
                                : "bg-[#131c31] border border-[#1e2b4a]"
                            }`}
                          >
                            {slot}
                          </span>
                        </div>

                        {weekDays.map((d, dIndex) => {
                          const cols: any[] = [];
                          columns.forEach((colId, cIndex) => {
                            const appt = radarMap[d.date]?.[colId]?.[slot];
                            const cellKey = `${d.date}-${slot}-${colId}`;
                            const targetColumn = (dIndex * maxConcurrent) + cIndex + 2;

                            if (appt === "COVERED") {
                              return;
                            }

                            if (appt) {
                              const [y, m, dStr] = d.date.split("-");
                              cols.push(
                                <div
                                  key={cellKey}
                                  style={{
                                    gridRow: `span ${appt._rowSpan} / span ${appt._rowSpan}`,
                                    gridColumn: targetColumn
                                  }}
                                  className="h-full min-h-[40px] py-[4px] relative z-10"
                                >
                                  <AppointmentBlock
                                    appt={appt}
                                    italianDate={`${dStr}/${m}/${y}`}
                                    durationInMinutes={appt._rowSpan * 15}
                                  />
                                </div>
                              );
                              return;
                            }

                            if (d.isClosed) {
                              cols.push(
                                <div key={cellKey} style={{ gridColumn: targetColumn }} className="h-full min-h-[40px] py-[4px] flex items-center justify-center">
                                  <span className="text-[10px] text-red-400/40 font-mono font-bold tracking-wider">CHIUSO</span>
                                </div>
                              );
                            } else {
                              cols.push(
                                <div key={cellKey} style={{ gridColumn: targetColumn }} className="h-full min-h-[40px] py-[4px]">
                                  <WalkInButton
                                    date={d.date}
                                    time={slot}
                                    tenantId={tenantId}
                                    services={tenantServices}
                                    staff={staffList}
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
                    Chiusure attive
                  </h2>

                  <div className="overflow-y-auto max-h-[220px] custom-scrollbar space-y-2 pr-1">
                    {currentClosures.length > 0 ? (
                      currentClosures.map((app) => {
                        const isFerie =
                          app.time === "ALL_DAY" ||
                          app.customerName.includes("FERIE");

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
                                {isFerie ? "🌴 FERIE" : "☕ PAUSA"}
                              </p>
                              <p className="text-slate-400 text-[10px] uppercase mt-0.5">
                                {app.date.split("-").reverse().join("/")} •{" "}
                                {app.time === "ALL_DAY"
                                  ? "Tutto il giorno"
                                  : `${app.time}${app.endTime ? ` - ${app.endTime}` : ""}`}
                              </p>
                            </div>

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
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-slate-500 text-sm italic">
                        Nessuna pausa o ferie attiva nella settimana visibile.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <span>⚙️</span>
                    Aggiungi Chiusura / Pausa
                  </h2>

                  <div className="mb-6 pb-6 border-b border-[#1e2b4a]">
                    <h3 className="text-[10px] text-slate-400 font-bold uppercase mb-3">
                      ☕ Blocca Orari (Pausa)
                    </h3>

                    <form
                      action={blockTimeRange}
                      className="grid grid-cols-2 sm:grid-cols-6 gap-2 w-full"
                    >
                      <input type="hidden" name="blockType" value="PAUSA" />
                      {staffList.length > 0 && (
                        <select
                          name="staffId"
                          className="col-span-2 sm:col-span-1 bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-2 py-2 focus:outline-none text-sm"
                        >
                          <option value="all">Tutto lo staff</option>
                          {staffList.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      )}
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
                        Blocca
                      </button>
                    </form>
                  </div>

                  <div className="mb-6 pb-6 border-b border-[#1e2b4a]">
                    <h3 className="text-[10px] text-blue-400 font-bold uppercase mb-3">
                      📋 Permesso Retribuito
                    </h3>

                    <form
                      action={blockTimeRange}
                      className="grid grid-cols-2 sm:grid-cols-6 gap-2 w-full"
                    >
                      <input type="hidden" name="blockType" value="PERMESSO" />
                      {staffList.length > 0 && (
                        <select
                          name="staffId"
                          className="col-span-2 sm:col-span-1 bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-2 py-2 focus:outline-none text-sm"
                        >
                          <option value="all">Tutto lo staff</option>
                          {staffList.map((s) => (
                            <option key={`p-${s.id}`} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      )}
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
                          <option key={`ps-${s}`} value={s}>{s}</option>
                        ))}
                      </select>
                      <select
                        name="endTime"
                        required
                        className="bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-2 py-2 text-sm"
                      >
                        <option value="">Alle</option>
                        {allSlots.map((s) => (
                          <option key={`pe-${s}`} value={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="col-span-2 sm:col-span-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold px-4 py-2 rounded-xl text-sm"
                      >
                        Registra
                      </button>
                    </form>
                  </div>

                  <div>
                    <h3 className="text-[10px] text-orange-400 font-bold uppercase mb-2">
                      🌴 Ferie (Dal - Al)
                    </h3>

                    <form
                      action={blockHoliday}
                      className="flex flex-wrap sm:flex-nowrap gap-2 w-full"
                    >
                      {staffList.length > 0 && (
                        <select
                          name="staffId"
                          className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-2 py-2 focus:outline-none focus:border-orange-500/50 text-sm"
                        >
                          <option value="all">Tutto lo staff</option>
                          {staffList.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      )}
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
                price: Number(service.price || 0),
              }))}
              staffCount={staffList.length}
              appointmentCount={rawAppointments.filter((app) => !app.customerName.includes("PAUSA") && !app.customerName.includes("FERIE")).length}
            />
            
            <MarketingWidget tenantId={tenantId} isPremium={isPremium} plan={tenant.plan} slug={slug} />

            <div className="mt-6">
              <LocationTabs tenantId={tenantId} tenantSlug={slug} tenantName={tenantName} plan={tenant.plan} />
            </div>
          </div>

          <div data-tab="business">
            <div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-cyan-900/10 border border-[#1a2642] h-full flex flex-col relative overflow-hidden mb-6">
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

            <AnalyticsChart data={analyticsData} plan={tenant.plan} slug={slug} />

{/* SEZIONE PAGAMENTI STRIPE */}
            <div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-blue-900/10 border border-[#1a2642] h-full flex flex-col relative overflow-hidden mb-6">
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
                            Revolut <span className="font-normal text-slate-300 tracking-normal">Business</span>
                          </span>
                          <span className="bg-white/10 text-white px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border border-white/10">Sponsor</span>
                        </div>
                        <p className="text-[13px] text-white font-semibold mb-1">Il conto business senza confini.</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
                          IBAN immediato, carte fisiche e virtuali gratuite. Perfetto da collegare a Stripe in 2 minuti.
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
        
        <SupportWidget tenantId={tenant.id} colorTheme={tenant.themeColor} />
      </div>
    </div>
  );
}
