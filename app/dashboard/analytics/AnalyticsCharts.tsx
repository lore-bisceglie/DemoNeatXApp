"use client";

import { useState } from "react";

type Props = {
  weeklyRevenue: { label: string; revenue: number; count: number }[];
  dayOfWeekCounts: { day: string; count: number; avg: number }[];
  timeSlotCounts: { slot: string; count: number }[];
  clientStats: {
    totalUniqueClients: number;
    returningClients: number;
    newClients: number;
    walkInCount: number;
    onlineCount: number;
    noShowRate: number;
  };
};

export default function AnalyticsCharts({
  weeklyRevenue,
  dayOfWeekCounts,
  timeSlotCounts,
  clientStats,
}: Props) {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const maxRevenue = Math.max(...weeklyRevenue.map((w) => w.revenue), 1);
  const maxDayCount = Math.max(...dayOfWeekCounts.map((d) => d.count), 1);
  const maxSlotCount = Math.max(...timeSlotCounts.map((s) => s.count), 1);
  const busiestDay = dayOfWeekCounts.reduce((max, d) =>
    d.count > max.count ? d : max
  );

  // Trova le 3 fasce più gettonate
  const topSlots = [...timeSlotCounts]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* ========== GRAFICO 1: Incasso Settimanale ========== */}
      <div className="bg-[#0b1221] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#1a2642] shadow-xl">
        <h2 className="text-lg font-extrabold text-white mb-1 flex items-center gap-2">
          <span>💰</span> Andamento Incassi
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Fatturato stimato per settimana (ultime 8 settimane)
        </p>

        <div className="flex items-end gap-2 sm:gap-3 h-[200px] sm:h-[250px]">
          {weeklyRevenue.map((week, i) => {
            const heightPct = (week.revenue / maxRevenue) * 100;
            const isHovered = hoveredBar === `week-${i}`;
            const isLast = i === weeklyRevenue.length - 1;

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end h-full relative group"
                onMouseEnter={() => setHoveredBar(`week-${i}`)}
                onMouseLeave={() => setHoveredBar(null)}
                onTouchStart={() => setHoveredBar(`week-${i}`)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1e2b4a] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg z-10 whitespace-nowrap border border-[#2a3d5f]">
                    €{week.revenue} · {week.count} app.
                  </div>
                )}

                {/* Bar */}
                <div
                  className={`w-full rounded-t-lg transition-all duration-700 ease-out cursor-pointer ${
                    isLast
                      ? "bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-lg shadow-cyan-500/20"
                      : "bg-gradient-to-t from-emerald-700 to-emerald-500"
                  } ${isHovered ? "opacity-100 scale-x-110" : "opacity-80"}`}
                  style={{
                    height: `${Math.max(heightPct, 3)}%`,
                    transitionDelay: `${i * 80}ms`,
                  }}
                />

                {/* Label */}
                <p className="text-[8px] sm:text-[10px] text-slate-500 mt-2 text-center leading-tight font-medium">
                  {week.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========== ROW 2: Giorni + Fasce Orarie ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAFICO 2: Giorni della Settimana */}
        <div className="bg-[#0b1221] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#1a2642] shadow-xl">
          <h2 className="text-lg font-extrabold text-white mb-1 flex items-center gap-2">
            <span>📅</span> Giorni più Richiesti
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Appuntamenti totali per giorno lavorativo
          </p>

          <div className="space-y-3">
            {dayOfWeekCounts.map((d, i) => {
              const widthPct = (d.count / maxDayCount) * 100;
              const isBusiest = d.day === busiestDay.day;

              return (
                <div key={d.day} className="flex items-center gap-3">
                  <span
                    className={`w-10 text-right text-sm font-bold ${
                      isBusiest ? "text-[#00b4ff]" : "text-slate-400"
                    }`}
                  >
                    {d.day}
                  </span>
                  <div className="flex-1 h-8 bg-[#131c31] rounded-lg overflow-hidden relative border border-[#1e2b4a]">
                    <div
                      className={`h-full rounded-lg transition-all duration-700 ease-out flex items-center ${
                        isBusiest
                          ? "bg-gradient-to-r from-cyan-600 to-cyan-400"
                          : "bg-gradient-to-r from-slate-700 to-slate-500"
                      }`}
                      style={{
                        width: `${Math.max(widthPct, 5)}%`,
                        transitionDelay: `${i * 100}ms`,
                      }}
                    >
                      <span className="text-[11px] font-bold text-white ml-2 drop-shadow">
                        {d.count}
                      </span>
                    </div>
                    {isBusiest && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-cyan-300 font-bold uppercase tracking-wider">
                        🔥 Top
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 w-16 text-right">
                    ~{d.avg}/sett
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRAFICO 3: Fasce Orarie */}
        <div className="bg-[#0b1221] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#1a2642] shadow-xl">
          <h2 className="text-lg font-extrabold text-white mb-1 flex items-center gap-2">
            <span>⏰</span> Fasce Orarie più Gettonate
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Top 3: {topSlots.map((s) => s.slot).join(", ")}
          </p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
            {timeSlotCounts.map((s, i) => {
              const widthPct = (s.count / maxSlotCount) * 100;
              const isTop = topSlots.some((t) => t.slot === s.slot);
              const isLunch =
                s.slot >= "12:00" && s.slot <= "13:30";

              return (
                <div key={s.slot} className="flex items-center gap-2">
                  <span
                    className={`w-11 text-[11px] font-medium text-right ${
                      isLunch
                        ? "text-amber-400/70"
                        : isTop
                        ? "text-[#00b4ff]"
                        : "text-slate-500"
                    }`}
                  >
                    {s.slot}
                  </span>
                  <div className="flex-1 h-5 bg-[#131c31] rounded overflow-hidden border border-[#1e2b4a]">
                    <div
                      className={`h-full rounded transition-all duration-500 ${
                        isTop
                          ? "bg-gradient-to-r from-cyan-600 to-cyan-400"
                          : isLunch
                          ? "bg-gradient-to-r from-amber-800 to-amber-600"
                          : "bg-gradient-to-r from-slate-700 to-slate-600"
                      }`}
                      style={{
                        width: `${Math.max(widthPct, 3)}%`,
                        transitionDelay: `${i * 30}ms`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 w-6 text-right font-medium">
                    {s.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========== ROW 3: Statistiche Clienti ========== */}
      <div className="bg-[#0b1221] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#1a2642] shadow-xl">
        <h2 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2">
          <span>👥</span> Panoramica Clienti
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Clienti Abituali vs Nuovi */}
          <div className="bg-[#131c31] border border-[#1e2b4a] p-4 rounded-2xl shadow-inner text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
              Clienti Abituali
            </p>
            <p className="text-3xl font-extrabold text-emerald-400">
              {clientStats.returningClients}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              su {clientStats.totalUniqueClients} totali
            </p>
          </div>

          <div className="bg-[#131c31] border border-[#1e2b4a] p-4 rounded-2xl shadow-inner text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
              Nuovi Clienti
            </p>
            <p className="text-3xl font-extrabold text-[#00b4ff]">
              {clientStats.newClients}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">prima visita</p>
          </div>

          {/* Prenotazioni Online vs Walk-In */}
          <div className="bg-[#131c31] border border-[#1e2b4a] p-4 rounded-2xl shadow-inner text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
              Prenotazioni Online
            </p>
            <p className="text-3xl font-extrabold text-violet-400">
              {clientStats.onlineCount}
            </p>
            <div className="mt-2 w-full bg-[#0b1221] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-700"
                style={{
                  width: `${
                    clientStats.onlineCount + clientStats.walkInCount > 0
                      ? (clientStats.onlineCount /
                          (clientStats.onlineCount + clientStats.walkInCount)) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="bg-[#131c31] border border-[#1e2b4a] p-4 rounded-2xl shadow-inner text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
              Walk-In
            </p>
            <p className="text-3xl font-extrabold text-amber-300">
              {clientStats.walkInCount}
            </p>
            <div className="mt-2 w-full bg-[#0b1221] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700"
                style={{
                  width: `${
                    clientStats.onlineCount + clientStats.walkInCount > 0
                      ? (clientStats.walkInCount /
                          (clientStats.onlineCount + clientStats.walkInCount)) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
