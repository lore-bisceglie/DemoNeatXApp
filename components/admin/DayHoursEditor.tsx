"use client";

import { useState, useEffect } from "react";
import type { WeekSchedule, DayHours } from "@/lib/opening-hours";

const WEEK_DAYS = [
  { value: 1, label: "Lunedì" },
  { value: 2, label: "Martedì" },
  { value: 3, label: "Mercoledì" },
  { value: 4, label: "Giovedì" },
  { value: 5, label: "Venerdì" },
  { value: 6, label: "Sabato" },
  { value: 0, label: "Domenica" },
];

interface DayHoursEditorProps {
  /** Valore iniziale: può essere il vecchio formato JSON `[0,6]` o il nuovo WeekSchedule */
  initialValue: string | null | undefined;
  /** Chiamata ogni volta che l'utente modifica un valore */
  onChange: (schedule: WeekSchedule) => void;
  /** Orari flat del tenant/sede da usare come valori di default quando si abilita un giorno */
  defaultOpen?: string;
  defaultClose?: string;
}

function parseInitialSchedule(
  raw: string | null | undefined,
  defaultOpen: string,
  defaultClose: string,
): WeekSchedule {
  if (!raw) return buildDefault(defaultOpen, defaultClose);
  try {
    const parsed = JSON.parse(raw);
    // Vecchio formato: array di numeri
    if (Array.isArray(parsed)) {
      return buildDefault(defaultOpen, defaultClose, parsed as number[]);
    }
    // Nuovo formato
    if (typeof parsed === "object" && parsed !== null && "closed" in parsed && "hours" in parsed) {
      return parsed as WeekSchedule;
    }
  } catch {
    // ignore
  }
  return buildDefault(defaultOpen, defaultClose);
}

function buildDefault(
  open: string,
  close: string,
  closed: number[] = [0],
): WeekSchedule {
  const hours: Record<string, DayHours> = {};
  for (let d = 0; d <= 6; d++) {
    if (!closed.includes(d)) {
      hours[String(d)] = { open, close, breakStart: null, breakEnd: null };
    }
  }
  return { closed, hours };
}

export default function DayHoursEditor({
  initialValue,
  onChange,
  defaultOpen = "09:00",
  defaultClose = "19:00",
}: DayHoursEditorProps) {
  const [schedule, setSchedule] = useState<WeekSchedule>(() =>
    parseInitialSchedule(initialValue, defaultOpen, defaultClose),
  );

  useEffect(() => {
    onChange(schedule);
  }, [schedule]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleDay(day: number) {
    setSchedule((prev) => {
      const isClosed = prev.closed.includes(day);
      if (isClosed) {
        // Apri il giorno, aggiungi orari di default
        const newClosed = prev.closed.filter((d) => d !== day);
        const newHours = {
          ...prev.hours,
          [String(day)]: { open: defaultOpen, close: defaultClose, breakStart: null, breakEnd: null },
        };
        return { closed: newClosed, hours: newHours };
      } else {
        // Chiudi il giorno, rimuovi orari
        const newClosed = [...prev.closed, day].sort();
        const newHours = { ...prev.hours };
        delete newHours[String(day)];
        return { closed: newClosed, hours: newHours };
      }
    });
  }

  function updateDayField(day: number, field: keyof DayHours, value: string) {
    setSchedule((prev) => {
      const existing = prev.hours[String(day)] ?? { open: defaultOpen, close: defaultClose };
      return {
        ...prev,
        hours: {
          ...prev.hours,
          [String(day)]: { ...existing, [field]: value || null },
        },
      };
    });
  }

  return (
    <div className="space-y-2">
      {WEEK_DAYS.map(({ value: day, label }) => {
        const isClosed = schedule.closed.includes(day);
        const dayHours = schedule.hours[String(day)];

        return (
          <div
            key={day}
            className={`rounded-xl border transition-all ${
              isClosed
                ? "border-red-500/20 bg-red-500/5"
                : "border-[#1e2b4a] bg-[#131c31]"
            }`}
          >
            {/* Riga intestazione giorno */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className={`text-sm font-semibold w-24 ${isClosed ? "text-red-400" : "text-white"}`}>
                {label}
              </span>
              <button
                type="button"
                onClick={() => toggleDay(day)}
                aria-pressed={isClosed}
                className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${
                  isClosed
                    ? "border-red-500/40 bg-red-500/15 text-red-400 hover:bg-red-500/25"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                }`}
              >
                {isClosed ? "Chiuso" : "Aperto"}
              </button>
            </div>

            {/* Riga orari (visibile solo se aperto) */}
            {!isClosed && dayHours && (
              <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Apertura</label>
                  <input
                    type="time"
                    value={dayHours.open ?? ""}
                    onChange={(e) => updateDayField(day, "open", e.target.value)}
                    className="w-full bg-[#0b1221] border border-[#1e2b4a] rounded-lg px-2 py-1.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Chiusura</label>
                  <input
                    type="time"
                    value={dayHours.close ?? ""}
                    onChange={(e) => updateDayField(day, "close", e.target.value)}
                    className="w-full bg-[#0b1221] border border-[#1e2b4a] rounded-lg px-2 py-1.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Pausa inizio</label>
                  <input
                    type="time"
                    value={dayHours.breakStart ?? ""}
                    onChange={(e) => updateDayField(day, "breakStart", e.target.value)}
                    className="w-full bg-[#0b1221] border border-[#1e2b4a] rounded-lg px-2 py-1.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Pausa fine</label>
                  <input
                    type="time"
                    value={dayHours.breakEnd ?? ""}
                    onChange={(e) => updateDayField(day, "breakEnd", e.target.value)}
                    className="w-full bg-[#0b1221] border border-[#1e2b4a] rounded-lg px-2 py-1.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
      <p className="text-xs text-slate-500 pt-1">
        Clicca su "Aperto/Chiuso" per cambiare lo stato del giorno. Puoi impostare orari diversi per ogni giornata (es. sabato solo mattina).
      </p>
    </div>
  );
}
