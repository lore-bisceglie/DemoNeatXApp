export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import AnalyticsCharts from "./AnalyticsCharts";

export default async function AnalyticsPage(props: { params: Promise<{ slug: string }> }) {
  noStore();
  
  const { slug } = await props.params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return <div className="p-10 text-white">Negozio non trovato.</div>;
  const TENANT_ID = tenant.id;



  // 📅 Calcola date in fuso orario Italia
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

  // 📊 Query: appuntamenti degli ultimi 3 mesi
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const threeMonthsAgoStr = threeMonthsAgo.toISOString().split("T")[0];

  const allAppointments = await prisma.appointment.findMany({
    where: {
      tenantId: TENANT_ID,
      date: { gte: threeMonthsAgoStr },
    },
    orderBy: { date: "asc" },
    include: { service: true }
  });

  // Filtra PAUSA e FERIE
  const appointments = allAppointments.filter(
    (a) =>
      !a.customerName.includes("PAUSA") && !a.customerName.includes("FERIE")
  );

  // 📊 Query: no-show degli ultimi 3 mesi
  const noShows = await prisma.noShow.findMany({
    where: {
      tenantId: TENANT_ID,
      date: { gte: threeMonthsAgoStr },
    },
  });

  // =========================================
  // 1. INCASSO PER SETTIMANA (ultime 8 settimane)
  // =========================================
  const weeklyRevenue: { label: string; revenue: number; count: number }[] = [];
  
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - i * 7); // Lunedì
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Domenica

    const startStr = weekStart.toISOString().split("T")[0];
    const endStr = weekEnd.toISOString().split("T")[0];

    const weekAppts = appointments.filter(
      (a) => a.date >= startStr && a.date <= endStr
    );

    const revenue = weekAppts.reduce(
      (total, a) => total + (a.service?.price || 0),
      0
    );

    // Formato label: "16-22 Giu"
    const monthNames = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
    const dayStart = weekStart.getDate();
    const dayEnd = weekEnd.getDate();
    const monthLabel = monthNames[weekEnd.getMonth()];
    
    weeklyRevenue.push({
      label: `${dayStart}-${dayEnd} ${monthLabel}`,
      revenue,
      count: weekAppts.length,
    });
  }

  // =========================================
  // 2. APPUNTAMENTI PER GIORNO DELLA SETTIMANA
  // =========================================
  const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
  const dayOfWeekCounts: { day: string; count: number; avg: number }[] = [];

  // Conta appuntamenti per giorno (solo Mar-Sab, i giorni lavorativi)
  const workDays = [2, 3, 4, 5, 6]; // Mar, Mer, Gio, Ven, Sab
  for (const dayIdx of workDays) {
    const dayAppts = appointments.filter((a) => {
      const d = new Date(a.date + "T12:00:00");
      return d.getDay() === dayIdx;
    });
    
    // Calcola settimane attive per media
    const uniqueWeeks = new Set(
      dayAppts.map((a) => {
        const d = new Date(a.date + "T12:00:00");
        const weekNum = Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
        return weekNum;
      })
    );
    
    const weeksCount = Math.max(uniqueWeeks.size, 1);
    
    dayOfWeekCounts.push({
      day: dayNames[dayIdx],
      count: dayAppts.length,
      avg: Math.round((dayAppts.length / weeksCount) * 10) / 10,
    });
  }

  // =========================================
  // 3. FASCE ORARIE PIÙ GETTONATE
  // =========================================
  const timeSlotCounts: { slot: string; count: number }[] = [];
  const slots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30",
  ];

  for (const slot of slots) {
    const count = appointments.filter((a) => a.time === slot).length;
    timeSlotCounts.push({ slot, count });
  }

  // =========================================
  // 4. STATISTICHE CLIENTI
  // =========================================
  const uniquePhones = new Set(
    appointments
      .filter((a) => a.customerPhone !== "0000000000")
      .map((a) => a.customerPhone)
  );
  const totalUniqueClients = uniquePhones.size;

  // Clienti con più di 1 visita = "abituali"
  const phoneCounts: Record<string, number> = {};
  appointments
    .filter((a) => a.customerPhone !== "0000000000")
    .forEach((a) => {
      phoneCounts[a.customerPhone] = (phoneCounts[a.customerPhone] || 0) + 1;
    });
  const returningClients = Object.values(phoneCounts).filter((c) => c > 1).length;
  const newClients = totalUniqueClients - returningClients;

  // Walk-in count
  const walkInCount = appointments.filter((a) => a.source === "WALK_IN").length;
  const onlineCount = appointments.filter((a) => a.source === "ONLINE").length;

  // No-show rate
  const totalCompleted = appointments.length;
  const noShowRate =
    totalCompleted > 0
      ? Math.round((noShows.length / (totalCompleted + noShows.length)) * 100)
      : 0;

  // Fatturato totale 3 mesi
  let totalRevenue = appointments.reduce(
    (total, a) => total + (a.service?.price || 0),
    0
  );

  // Incasso medio per giorno lavorativo
  const uniqueDays = new Set(appointments.map((a) => a.date));
  let avgDailyRevenue =
    uniqueDays.size > 0 ? Math.round(totalRevenue / uniqueDays.size) : 0;

  // =========================================
  // 💉 MOCK DATA PER LA DEMO (Se non ci sono appuntamenti)
  // =========================================
  let finalWeeklyRevenue = weeklyRevenue;
  let finalDayOfWeekCounts = dayOfWeekCounts;
  let finalTimeSlotCounts = timeSlotCounts;
  let finalClientStats = {
    totalUniqueClients,
    returningClients,
    newClients,
    walkInCount,
    onlineCount,
    noShowRate,
  };



  return (
    <div className="min-h-screen bg-[#050814] flex flex-col p-2 sm:p-8 font-sans text-slate-200 selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto w-full flex-grow">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="text-white">Neat</span>
              <span className="text-[#00b4ff]">X</span>
              <span className="text-slate-500 font-medium text-2xl ml-2">
                | Analisi & Report
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Dati degli ultimi 3 mesi — aggiornati al {day}/{month}/{year}
            </p>
          </div>
          <Link
            href={`/t/${slug}/admin`}
            className="bg-[#131c31] hover:bg-[#1e2b4a] text-slate-300 text-sm font-bold px-5 py-2.5 rounded-xl border border-[#1e2b4a] transition flex items-center gap-2"
          >
            ← Torna alla Dashboard
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <div className="bg-[#0b1221] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#1a2642] shadow-xl">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
              Fatturato 3 Mesi
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              €{totalRevenue}
            </p>
          </div>
          <div className="bg-[#0b1221] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#1a2642] shadow-xl">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
              Media Giornaliera
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#00b4ff]">
              €{avgDailyRevenue}
            </p>
          </div>
          <div className="bg-[#0b1221] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#1a2642] shadow-xl">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
              Totale Prenotazioni
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">
              {appointments.length}
            </p>
          </div>
          <div className="bg-[#0b1221] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#1a2642] shadow-xl">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
              Clienti Unici
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              {finalClientStats.totalUniqueClients}
            </p>
          </div>
          <div className="bg-[#0b1221] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#1a2642] shadow-xl">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
              Tasso No-Show
            </p>
            <p
              className={`text-2xl sm:text-3xl font-extrabold ${
                finalClientStats.noShowRate > 10 ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {finalClientStats.noShowRate}%
            </p>
          </div>
        </div>

        {/* Charts */}
        <AnalyticsCharts
          weeklyRevenue={finalWeeklyRevenue}
          dayOfWeekCounts={finalDayOfWeekCounts}
          timeSlotCounts={finalTimeSlotCounts}
          clientStats={finalClientStats}
        />
      </div>
    </div>
  );
}
