"use client";

import { Clock, Plus, Trash2 } from "lucide-react";
import type { WeeklySchedule, ScheduleBlock } from "@/lib/schedule";
import { DAY_NAMES } from "@/lib/schedule";

type Props = {
  value: WeeklySchedule;
  onChange: (schedule: WeeklySchedule) => void;
};

const EMPTY_DAY: ScheduleBlock[] = [];

// Editor controllato degli orari settimanali del negozio (per-giorno, blocchi multipli).
// Nessun fetch/salvataggio interno: il parent possiede lo stato e la persistenza.
export default function ShopHoursEditor({ value, onChange }: Props) {
  const toggleDay = (day: string) => {
    const current = value[day];
    if (current?.active) {
      onChange({ ...value, [day]: { active: false, blocks: [] } });
    } else {
      onChange({ ...value, [day]: { active: true, blocks: [{ start: "09:00", end: "19:00" }] } });
    }
  };

  const addBlock = (day: string) => {
    const blocks = value[day]?.blocks || [];
    const lastEnd = blocks.length > 0 ? blocks[blocks.length - 1].end : "09:00";
    const [h, m] = lastEnd.split(":").map(Number);
    const next = `${Math.min(h + 4, 23).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    onChange({ ...value, [day]: { active: true, blocks: [...blocks, { start: lastEnd, end: next }] } });
  };

  const updateBlock = (day: string, index: number, field: "start" | "end", val: string) => {
    const blocks = [...(value[day]?.blocks || [])];
    blocks[index] = { ...blocks[index], [field]: val };
    onChange({ ...value, [day]: { active: value[day]?.active ?? true, blocks } });
  };

  const removeBlock = (day: string, index: number) => {
    const blocks = (value[day]?.blocks || []).filter((_, i) => i !== index);
    onChange({ ...value, [day]: { active: blocks.length > 0, blocks } });
  };

  // Lun..Dom per la UI
  const orderedDays = [...DAY_NAMES.slice(1), DAY_NAMES[0]];

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        Imposta gli orari di apertura per ogni giorno. Puoi aggiungere più fasce (es. mattina e pomeriggio) o aprire solo mezza giornata.
      </p>
      {orderedDays.map((day) => {
        const dayData = value[day];
        const blocks = dayData?.active ? dayData.blocks : EMPTY_DAY;
        const isActive = dayData?.active ?? false;
        return (
          <div
            key={day}
            className={`rounded-2xl border p-3 transition ${
              isActive ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/5 bg-white/[0.02] opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-extrabold text-white capitalize min-w-[90px]">{day}</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-500"
                  }`}
                >
                  {isActive ? "Aperto" : "Chiuso"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleDay(day)}
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition ${
                  isActive
                    ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                    : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                }`}
              >
                {isActive ? "Chiudi giorno" : "Apri giorno"}
              </button>
            </div>
            {isActive && (
              <div className="space-y-2 ml-1">
                {blocks.map((block, bi) => (
                  <div key={bi} className="flex items-center gap-2">
                    <Clock size={14} className="shrink-0 text-slate-500" />
                    <input
                      type="time"
                      value={block.start}
                      onChange={(e) => updateBlock(day, bi, "start", e.target.value)}
                      className="w-28 rounded-lg border border-[#1e2b4a] bg-[#131c31] px-3 py-1.5 text-sm text-white focus:border-indigo-400 focus:outline-none"
                    />
                    <span className="text-slate-600 text-xs">—</span>
                    <input
                      type="time"
                      value={block.end}
                      onChange={(e) => updateBlock(day, bi, "end", e.target.value)}
                      className="w-28 rounded-lg border border-[#1e2b4a] bg-[#131c31] px-3 py-1.5 text-sm text-white focus:border-indigo-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeBlock(day, bi)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addBlock(day)}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition mt-1"
                >
                  <Plus size={13} />
                  Aggiungi fascia oraria
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
