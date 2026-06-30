export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
// import { cookies } from "next/headers"; // Riattivare per la login admin
import { redirect } from "next/navigation";
import DeleteButton from "./DeleteButton";
import WalkInButton from "./WalkInButton";
import AppointmentBlock from "./AppointmentBlock";
import { unstable_noStore as noStore } from "next/cache";

import AutoRefreshMonitor from "./AutoRefreshMonitor";
import SwipeableAgenda from "./SwipeableAgenda";
import CustomerDrawer from "./CustomerDrawer";
import WaitlistDashboard from "./WaitlistDashboard";
import ResetDemoButton from "./ResetDemoButton";

export default async function Dashboard(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  noStore();

  const searchParams = await props.searchParams;

  const DEMO_TENANT_ID = "cmqtds1840000yyqbd23x1jdj";

  // 1. CARICAMENTO DEL NEGOZIO E DEI SERVIZI
  const tenant = await prisma.tenant.findUnique({
    where: {
      id: DEMO_TENANT_ID,
    },
    include: {
      services: true,
    },
  });

  if (!tenant) {
    return (
      <div className="p-10 text-white font-bold text-xl">
        ⚠️ Nessuna attività configurata nel Database.
      </div>
    );
  }

  const tenantId = tenant.id;
  const tenantName = tenant.name;
  const tenantServices = tenant.services;

  let storeSettings = await prisma.storeSettings.findUnique({
    where: {
      tenantId,
    },
  });

  if (!storeSettings) {
    storeSettings = await prisma.storeSettings.create({
      data: {
        tenantId,
        smsCredits: 50,
      },
    });
  }

  const now = new Date();

  const dateFormatter = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = dateFormatter.formatToParts(now);
  const day = parts.find((p) => p.type === "day")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const year = parts.find((p) => p.type === "year")?.value;

  const todayItaly = `${year}-${month}-${day}`;
  const currentMonthPrefix = `${year}-${month}`;

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

  const timeToMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (value: number) => {
    const hours = Math.floor(value / 60)
      .toString()
      .padStart(2, "0");
    const minutes = (value % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const weekOffset = parseInt(searchParams.weekOffset || "0", 10);

  const dayNames = [
    "Domenica",
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
  ];

  const refDate = new Date(now);

  refDate.setDate(refDate.getDate() + weekOffset * 7);

  if (refDate.getDay() === 0) {
    refDate.setDate(refDate.getDate() + 2);
  }

  if (refDate.getDay() === 1) {
    refDate.setDate(refDate.getDate() + 1);
  }

  const diffToTue = 2 - refDate.getDay();
  const tuesday = new Date(refDate);
  tuesday.setDate(refDate.getDate() + diffToTue);

  const weekDays = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(tuesday);
    d.setDate(tuesday.getDate() + i);

    const iso = d.toISOString().split("T")[0];
    const [, m, dayStr] = iso.split("-");
    const label = `${dayNames[d.getDay()].substring(0, 3)} ${dayStr}/${m}`;

    return {
      date: iso,
      label,
    };
  });

  const weekDatesArray = weekDays.map((w) => w.date);

  // 🌟 GENERATORE DINAMICO DI SLOT: Da 09:00 a 19:00 ogni 15 minuti
  const allSlots: string[] = [];

  for (let h = 9; h <= 19; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 19 && m > 0) break;

      allSlots.push(
        `${h.toString().padStart(2, "0")}:${m
          .toString()
          .padStart(2, "0")}`
      );
    }
  }

  // 🌟 QUERY PRINCIPALI SUL DATABASE
  const rawAppointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: todayItaly,
      },
      tenantId,
    },
    orderBy: [
      {
        date: "asc",
      },
      {
        time: "asc",
      },
    ],
    include: {
      service: true,
    },
  });

  // 🌟 MOTORE DI MAPPATURA RADAR (TETRIS CSS)
  const radarMap: Record<string, Record<string, any>> = {};

  weekDatesArray.forEach((d) => {
    radarMap[d] = {};
  });

  const radarAppointments = await prisma.appointment.findMany({
    where: {
      date: {
        in: weekDatesArray,
      },
      tenantId,
    },
    include: {
      service: true,
    },
  });

  radarAppointments.forEach((app) => {
    if (app.time === "ALL_DAY") {
      // 🌟 FIX FERIE: Assegna un'altezza gigantesca che copre l'intera colonna
      const slotsToCover = allSlots.length;
      const appWithSpan = {
        ...app,
        _rowSpan: slotsToCover,
      };

      radarMap[app.date]["09:00"] = appWithSpan;

      // Istruisce il CSS Grid di nascondere tutti gli slot sottostanti
      for (let i = 1; i < slotsToCover; i++) {
        radarMap[app.date][allSlots[i]] = "COVERED";
      }

      return;
    }

    let durationMins = 15;

    if (app.service?.duration) {
      durationMins = app.service.duration;
    } else if (app.endTime) {
      const start = app.time.split(":").map(Number);
      const end = app.endTime.split(":").map(Number);
      durationMins = end[0] * 60 + end[1] - (start[0] * 60 + start[1]);
    }

    const slotsToCover = Math.ceil(durationMins / 15);
    const startIndex = allSlots.indexOf(app.time);

    if (startIndex !== -1) {
      const appWithSpan = {
        ...app,
        _rowSpan: slotsToCover,
      };

      radarMap[app.date][app.time] = appWithSpan;

      for (let i = 1; i < slotsToCover; i++) {
        const coveredSlot = allSlots[startIndex + i];

        if (coveredSlot) {
          radarMap[app.date][coveredSlot] = "COVERED";
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
        const isFree = !isPastToday && !radarMap[dayInfo.date]?.[slot];

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

  // 🌟 CALCOLO INCASSI DINAMICI PREMIUM
  const monthlyAppointments = await prisma.appointment.findMany({
    where: {
      date: {
        startsWith: currentMonthPrefix,
      },
      tenantId,
    },
    include: {
      service: true,
    },
  });

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

  // ------------------------------------------------------------------
  // SERVER ACTIONS DA ADMIN
  // ------------------------------------------------------------------

  async function blockTimeRange(formData: FormData) {
    "use server";

    let redirectUrl = "/dashboard";

    const date = formData.get("date") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;

    if (date && startTime && endTime) {
      const startMins =
        parseInt(startTime.split(":")[0]) * 60 +
        parseInt(startTime.split(":")[1]);

      const endMins =
        parseInt(endTime.split(":")[0]) * 60 +
        parseInt(endTime.split(":")[1]);

      if (startMins < endMins) {
        try {
          const existingApps = await prisma.appointment.findMany({
            where: {
              date,
              tenantId,
              NOT: [
                { customerName: { contains: "PAUSA" } },
                { customerName: { contains: "FERIE" } },
                { time: "ALL_DAY" },
              ],
            },
          });

          const hasOverlap = existingApps.some((app) => {
            const aStart =
              parseInt(app.time.split(":")[0]) * 60 +
              parseInt(app.time.split(":")[1]);

            const aEnd = app.endTime
              ? parseInt(app.endTime.split(":")[0]) * 60 +
                parseInt(app.endTime.split(":")[1])
              : aStart + 15;

            return Math.max(startMins, aStart) < Math.min(endMins, aEnd);
          });

          if (hasOverlap) {
            redirectUrl = `/dashboard?error=MULTIPLE_CONFLICTS`;
          } else {
            await prisma.appointment.create({
              data: {
                customerName: "☕ PAUSA",
                customerPhone: "0000000000",
                date,
                time: startTime,
                endTime,
                tenantId,
                cancelToken: crypto.randomUUID(),
              },
            });
          }
        } catch (error) {
          console.error(error);
        }
      }
    }

    redirect(redirectUrl);
  }

  async function blockHoliday(formData: FormData) {
    "use server";

    let redirectUrl = "/dashboard";

    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

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
            NOT: [
              { customerName: { contains: "PAUSA" } },
              { customerName: { contains: "FERIE" } },
              { time: "ALL_DAY" },
            ],
          },
        });

        if (existingAppointments.length > 0) {
          redirectUrl = `/dashboard?error=MULTIPLE_CONFLICTS`;
        } else {
          const insertLoop = new Date(start);

          while (insertLoop <= end) {
            const d = insertLoop.toISOString().split("T")[0];

            const existingFerie = await prisma.appointment.findFirst({
              where: {
                date: d,
                time: "ALL_DAY",
                tenantId,
              },
            });

            if (!existingFerie) {
              await prisma.appointment.create({
                data: {
                  customerName: "🌴 FERIE",
                  customerPhone: "0000000000",
                  date: d,
                  time: "ALL_DAY",
                  tenantId,
                  cancelToken: crypto.randomUUID(),
                },
              });
            }

            insertLoop.setDate(insertLoop.getDate() + 1);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    redirect(redirectUrl);
  }

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

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 custom-scrollbar snap-x">
            <CustomerDrawer tenantId={tenantId} />
            <a
              href={`/api/export/appointments?tenantId=${tenantId}`}
              className="flex-shrink-0 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-emerald-500/30 transition flex justify-center items-center gap-2 whitespace-nowrap snap-center"
            >
              Export agenda
            </a>
            <a
              href={`/api/export/customers?tenantId=${tenantId}`}
              className="flex-shrink-0 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-amber-500/30 transition flex justify-center items-center gap-2 whitespace-nowrap snap-center"
            >
              Export clienti
            </a>
            <ResetDemoButton />
            <Link
              href="/dashboard/analytics"
              className="flex-shrink-0 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold px-4 sm:px-4 py-2 sm:py-2.5 rounded-xl transition flex items-center gap-2 text-sm snap-center"
            >
              <span>📊</span> Analytics
            </Link>

            <Link
              href="/"
              className="flex-shrink-0 bg-[#00b4ff] hover:bg-cyan-400 text-[#050814] text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition flex justify-center items-center gap-2 whitespace-nowrap snap-center"
            >
              [+] Nuova Prenotazione
            </Link>
          </div>
        </div>

        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-3xl p-5 mb-6 shadow-xl shadow-cyan-900/10">
          <h2 className="text-white font-extrabold text-lg mb-2">
            Demo condivisibile NeatX
          </h2>
          <p className="text-cyan-100 text-sm leading-relaxed">
            Questa dashboard e pensata per far provare l'agenda a barbieri,
            centri beauty, nails, studi, tattoo, massaggiatori e consulenti.
            Usa nomi e numeri finti: puoi bloccare, spostare, annullare,
            segnare pagato, aprire la rubrica e simulare avvisi senza uscire
            dalla demo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              step: "01",
              title: "Prenota come cliente",
              text: "Dalla pagina pubblica scegli attività, servizio, giorno e pagamento demo.",
            },
            {
              step: "02",
              title: "Controlla il radar",
              text: "Lo slot compare nell'agenda dinamica con durata, colore e stato pagamento.",
            },
            {
              step: "03",
              title: "Gestisci il lavoro",
              text: "Apri il blocco per spostare, eliminare, segnare pagato o inviare avvisi simulati.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-[#0b1221] border border-[#1a2642] rounded-3xl p-4 shadow-xl shadow-cyan-900/5"
            >
              <p className="text-[#00b4ff] text-[10px] font-extrabold uppercase tracking-widest mb-2">
                Tour {item.step}
              </p>
              <h3 className="text-white font-extrabold text-sm mb-1">
                {item.title}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}

          <div className="bg-[#0b1221] border border-yellow-500/25 rounded-3xl p-4 shadow-xl shadow-yellow-900/5">
            <p className="text-yellow-300 text-[10px] font-extrabold uppercase tracking-widest mb-2">
              Demo pulita
            </p>
            <h3 className="text-white font-extrabold text-sm mb-1">
              Ricrea esempi
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Riporta la demo a una situazione piena di esempi pronti da
              mostrare.
            </p>
            <ResetDemoButton compact />
          </div>
        </div>

        {/* I 3 KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-cyan-900/10 border border-[#1a2642] flex flex-col justify-center h-full min-h-[140px]">
            <h2 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Prossimo in arrivo
            </h2>

            {nextAppointment ? (
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-xl font-extrabold text-white truncate max-w-[150px]">
                    {nextAppointment.customerName}
                  </p>

                  <p className="text-[#00b4ff] font-bold text-base">
                    {nextAppointment.time}
                    <span className="text-xs font-medium text-slate-400 ml-1">
                      ({nextAppointment.date.split("-").reverse().join("/")})
                    </span>
                  </p>
                </div>

                <div className="bg-[#131c31] p-3 rounded-2xl border border-[#1e2b4a] text-xl shadow-inner">
                  ⏳
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm font-medium italic mt-2">
                Nessun cliente in attesa.
              </p>
            )}
          </div>

          <div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-emerald-900/10 border border-[#1a2642] flex flex-col justify-center h-full min-h-[140px] relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-8xl opacity-[0.03] pointer-events-none">
              📊
            </div>

            <h2 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-2">
              <span>📈</span>
              Statistiche Mese
            </h2>

            <div className="flex items-end gap-3 mt-2">
              <span className="text-4xl font-extrabold text-emerald-400">
                €{estimatedRevenue}
              </span>

              <span className="text-slate-400 font-medium mb-1 text-sm">
                / {validMonthly.length} app.ti
              </span>
            </div>

            <p className="text-[10px] text-slate-500 mt-2">
              Calcolo dinamico sul prezzo dei servizi configurati.
            </p>
          </div>

          <div
            className={`p-6 rounded-3xl shadow-xl border flex flex-col justify-center h-full min-h-[140px] relative overflow-hidden transition-all ${
              storeSettings.smsCredits > 20
                ? "bg-[#0b1221] border-[#1a2642] shadow-cyan-900/10"
                : "bg-red-950/20 border-red-900/50 shadow-red-900/20"
            }`}
          >
            <div className="absolute -right-4 -top-4 text-8xl opacity-[0.03] pointer-events-none">
              💬
            </div>

            <h2
              className={`text-xs font-bold mb-2 uppercase tracking-widest flex items-center justify-between ${
                storeSettings.smsCredits > 20
                  ? "text-slate-500"
                  : "text-red-400"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>💬</span>
                Messaggi Auto
              </span>
            </h2>

            <div className="flex items-end gap-3 mt-2">
              <span
                className={`text-4xl font-extrabold ${
                  storeSettings.smsCredits > 20 ? "text-white" : "text-red-500"
                }`}
              >
                {storeSettings.smsCredits}
              </span>

              <span className="text-slate-400 font-medium mb-1 text-sm">
                crediti residui
              </span>
            </div>
          </div>
        </div>

        <WaitlistDashboard />

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

        {/* AGENDA SETTIMANALE TETRIS */}
        <div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-cyan-900/10 border border-[#1a2642] mb-6 overflow-hidden flex flex-col">
          <SwipeableAgenda>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-[#1e2b4a] pb-4">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                📒 Agenda Dinamica ({tenantName})
              </h2>

              <div className="flex items-center gap-1 bg-[#131c31] p-1.5 rounded-2xl border border-[#1e2b4a] w-fit">
                <Link
                  href={`/dashboard?weekOffset=${weekOffset - 1}`}
                  prefetch={false}
                  scroll={false}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-[#1e2b4a] rounded-xl transition font-medium"
                >
                  ← Prec
                </Link>

                {/* ✅ RIPRISTINATO IL BOTTONE "OGGI" AZZURRO */}
                <Link
                  href="/dashboard"
                  prefetch={false}
                  scroll={false}
                  className={`px-4 py-2 text-sm font-bold rounded-xl transition ${
                    weekOffset === 0
                      ? "bg-[#00b4ff] text-[#050814] shadow-lg shadow-cyan-500/20"
                      : "text-slate-300 hover:bg-[#1e2b4a]"
                  }`}
                >
                  Oggi
                </Link>

                <Link
                  href={`/dashboard?weekOffset=${weekOffset + 1}`}
                  prefetch={false}
                  scroll={false}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-[#1e2b4a] rounded-xl transition font-medium"
                >
                  Pros →
                </Link>
              </div>
            </div>
          </SwipeableAgenda>

          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="min-w-[650px] md:min-w-[900px] grid grid-cols-[60px_repeat(5,1fr)] md:grid-cols-[80px_repeat(5,1fr)] gap-2">
                <div className="text-slate-500 font-bold text-center flex items-center justify-center sticky left-0 bg-[#0b1221] z-20 pb-2 shadow-[8px_0_0_#0b1221] md:shadow-none">
                  Ora
                </div>

                {/* ✅ RIPRISTINATA L'EVIDENZIAZIONE AZZURRA DEL GIORNO ATTUALE */}
                {weekDays.map((d) => {
                  const isToday = d.date === todayItaly;
                  
                  return (
                    <div
                      key={d.date}
                      className={`text-center py-2 mb-2 rounded-xl border capitalize transition-colors ${
                        isToday 
                          ? "bg-cyan-500/10 text-[#00b4ff] font-extrabold border-[#00b4ff]/40 shadow-[0_0_15px_rgba(0,180,255,0.15)]" 
                          : "bg-[#131c31] text-white font-bold border-[#1e2b4a]"
                      }`}
                    >
                      {d.label}
                    </div>
                  );
                })}

                {allSlots.map((slot) => {
                  const isQuarter =
                    slot.endsWith("15") || slot.endsWith("45");

                  return (
                    <div className="contents" key={slot}>
                      <div className="text-slate-400 font-medium flex items-center justify-center text-sm bg-[#0b1221] sticky left-0 z-10 border-r border-transparent shadow-[8px_0_0_#0b1221] md:shadow-none">
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

                      {weekDays.map((d) => {
                        const appt = radarMap[d.date]?.[slot];

                        if (appt === "COVERED") return null;

                        if (appt) {
                          const [y, m, dStr] = d.date.split("-");

                          return (
                            <div
                              key={`${d.date}-${slot}`}
                              style={{
                                gridRow: `span ${appt._rowSpan} / span ${appt._rowSpan}`,
                              }}
                              className="h-full min-h-[35px]"
                            >
                              <AppointmentBlock
                                appt={appt}
                                italianDate={`${dStr}/${m}/${y}`}
                                durationInMinutes={appt._rowSpan * 15}
                              />
                            </div>
                          );
                        }

                        return (
                          <div key={`${d.date}-${slot}`} className="h-full">
                            <WalkInButton
                              date={d.date}
                              time={slot}
                              tenantId={tenantId}
                              services={tenantServices}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
        </div>

        {/* ALTRE FUNZIONI DASHBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-cyan-900/10 border border-[#1a2642] h-full flex flex-col relative overflow-hidden">
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
                  €{todayTotalRevenue}
                </p>
              </div>

              <div className="text-4xl opacity-20">💰</div>
            </div>
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
                    ☕ Blocca Orari
                  </h3>

                  <form
                    action={blockTimeRange}
                    className="flex flex-wrap sm:flex-nowrap gap-2 w-full"
                  >
                    <input
                      type="date"
                      name="date"
                      required
                      defaultValue={todayItaly}
                      className="bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-3 py-2 focus:outline-none text-sm w-full sm:w-[40%]"
                      style={{
                        colorScheme: "dark",
                      }}
                    />

                    <select
                      name="startTime"
                      required
                      className="bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-2 py-2 text-sm flex-grow"
                    >
                      <option value="">Dalle</option>
                      {allSlots.map((s) => (
                        <option key={`s-${s}`} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <select
                      name="endTime"
                      required
                      className="bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-2 py-2 text-sm flex-grow"
                    >
                      <option value="">Alle</option>
                      {allSlots.map((s) => (
                        <option key={`e-${s}`} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      className="bg-red-500/10 text-red-400 border border-red-500/20 font-bold px-4 py-2 rounded-xl text-sm w-full sm:w-auto"
                    >
                      Blocca
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
      </div>
    </div>
  );
}
