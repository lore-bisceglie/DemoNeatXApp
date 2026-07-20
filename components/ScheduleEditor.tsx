"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Plus, Save, Trash2, X, Ban, Umbrella, Coffee } from "lucide-react";
import type { WeeklySchedule, ShiftException, ScheduleBlock } from "@/lib/schedule";
import { DAY_NAMES } from "@/lib/schedule";

type Props = {
  staffId: string;
  staffName: string;
  onClose: () => void;
};

const EMPTY_DAY: ScheduleBlock[] = [];

export default function ScheduleEditor({ staffId, staffName, onClose }: Props) {
  const [tab, setTab] = useState<"orari" | "eccezioni">("orari");
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [exceptions, setExceptions] = useState<ShiftException[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Nuova eccezione form
  const [newEx, setNewEx] = useState<ShiftException>({
    date: "",
    type: "ferie",
    start: null,
    end: null,
  });

  useEffect(() => {
    loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  const loadSchedule = async () => {
    setLoading(true);
    const res = await fetch(`/api/staff/schedule?staffId=${staffId}`);
    const data = await res.json();
    setSchedule(data.baseSchedule || {});
    setExceptions(data.shiftExceptions || []);
    setLoading(false);
  };

  const toggleDay = (day: string) => {
    setSchedule((prev) => {
      const current = prev[day];
      if (current?.active) {
        return { ...prev, [day]: { active: false, blocks: [] } };
      }
      return { ...prev, [day]: { active: true, blocks: [{ start: "09:00", end: "13:00" }] } };
    });
  };

  const addBlock = (day: string) => {
    setSchedule((prev) => {
      const blocks = prev[day]?.blocks || [];
      const lastEnd = blocks.length > 0 ? blocks[blocks.length - 1].end : "09:00";
      const [h, m] = lastEnd.split(":").map(Number);
      const next = `${(h + 4).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      return {
        ...prev,
        [day]: { active: true, blocks: [...blocks, { start: lastEnd, end: next }] },
      };
    });
  };

  const updateBlock = (day: string, index: number, field: "start" | "end", value: string) => {
    setSchedule((prev) => {
      const blocks = [...(prev[day]?.blocks || [])];
      blocks[index] = { ...blocks[index], [field]: value };
      return { ...prev, [day]: { active: prev[day]?.active ?? true, blocks } };
    });
  };

  const removeBlock = (day: string, index: number) => {
    setSchedule((prev) => {
      const blocks = (prev[day]?.blocks || []).filter((_, i) => i !== index);
      return { ...prev, [day]: { active: blocks.length > 0, blocks } };
    });
  };

  const saveSchedule = async () => {
    setSaving(true);
    await fetch("/api/staff/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, baseSchedule: schedule }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => onClose(), 600);
  };

  const addException = () => {
    if (!newEx.date) return;
    setExceptions((prev) => [...prev, { ...newEx }]);
    setNewEx({ date: "", type: "ferie", start: null, end: null });
  };

  const removeException = (index: number) => {
    setExceptions((prev) => prev.filter((_, i) => i !== index));
  };

  const saveExceptions = async () => {
    setSaving(true);
    await fetch("/api/staff/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, exceptions }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => onClose(), 600);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="text-slate-400 text-lg font-bold">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#1e2b4a] bg-[#0b1221] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1e2b4a] bg-[#131c31] px-6 py-4 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-extrabold text-white capitalize">{staffName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Gestione turni e orari</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1e2b4a] text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition">
            <X size={18} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[#1e2b4a]">
          <button
            onClick={() => setTab("orari")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition ${
              tab === "orari" ? "border-b-2 border-indigo-400 text-indigo-300 bg-indigo-500/5" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Calendar size={15} />
            Orari Fissi Settimanali
          </button>
          <button
            onClick={() => setTab("eccezioni")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition ${
              tab === "eccezioni" ? "border-b-2 border-amber-400 text-amber-300 bg-amber-500/5" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Umbrella size={15} />
            Ferie, Permessi e Pause
          </button>
        </div>

        <div className="p-6">
          {tab === "orari" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400 mb-4">
                Imposta gli orari fissi per ogni giorno della settimana. I giorni senza orari (Riposo) bloccano l&apos;agenda.
              </p>
              {DAY_NAMES.map((day) => {
                const dayData = schedule[day];
                const blocks = dayData?.active ? dayData.blocks : EMPTY_DAY;
                const isActive = dayData?.active ?? false;
                return (
                  <div key={day} className={`rounded-2xl border p-4 transition ${
                    isActive ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/5 bg-white/[0.02] opacity-60"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-white capitalize min-w-[90px]">{day}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-500"
                        }`}>
                          {isActive ? "In servizio" : "Riposo"}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleDay(day)}
                        className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition ${
                          isActive
                            ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                            : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                      >
                        {isActive ? "Metti Riposo" : "Attiva turno"}
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
                              onClick={() => removeBlock(day, bi)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addBlock(day)}
                          className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition mt-2"
                        >
                          <Plus size={13} />
                          Aggiungi turno
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-end pt-4">
                {saved ? (
                  <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/15 px-6 py-3 text-sm font-extrabold text-emerald-300">
                    ✓ Salvataggio completato
                  </div>
                ) : (
                <button
                  onClick={saveSchedule}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-extrabold text-[#03111f] transition hover:scale-105 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Salvataggio..." : "Salva orari fissi"}
                </button>
                )}
              </div>
            </div>
          )}

          {tab === "eccezioni" && (
            <div className="space-y-6">
              <p className="text-sm text-slate-400">
                Aggiungi ferie, permessi o pause per giornate specifiche. Queste eccezioni hanno priorità sugli orari fissi.
              </p>

              {/* Existing exceptions */}
              {exceptions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#1e2b4a] bg-[#0b1221] p-8 text-center">
                  <Umbrella size={28} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-bold text-slate-500">Nessuna eccezione</p>
                  <p className="text-xs text-slate-600 mt-1">Aggiungi ferie, permessi o pause qui sotto</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {exceptions.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl border border-[#1e2b4a] bg-[#0b1221] px-5 py-3">
                      <div className="flex items-center gap-4">
                        {ex.type === "ferie" && <Umbrella size={16} className="text-amber-400" />}
                        {ex.type === "permesso" && <Ban size={16} className="text-blue-400" />}
                        {ex.type === "pausa" && <Coffee size={16} className="text-cyan-400" />}
                        <span className={`text-xs font-extrabold uppercase min-w-[70px] ${
                          ex.type === "ferie" ? "text-amber-400" : ex.type === "permesso" ? "text-blue-400" : "text-cyan-400"
                        }`}>
                          {ex.type}
                        </span>
                        <span className="text-sm font-bold text-white">{ex.date}</span>
                        {ex.start && ex.end && (
                          <span className="text-xs text-slate-400">{ex.start} - {ex.end}</span>
                        )}
                        {ex.type === "ferie" && <span className="text-xs text-slate-500">Giornata intera</span>}
                      </div>
                      <button
                        onClick={() => removeException(i)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add exception form */}
              <div className="rounded-2xl border border-[#1e2b4a] bg-[#0b1221] p-5">
                <h4 className="text-sm font-extrabold text-white mb-4">Aggiungi eccezione</h4>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Data</label>
                    <input
                      type="date"
                      value={newEx.date}
                      onChange={(e) => setNewEx({ ...newEx, date: e.target.value })}
                      className="rounded-xl border border-[#1e2b4a] bg-[#131c31] px-3 py-2.5 text-sm text-white focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Tipo</label>
                    <select
                      value={newEx.type}
                      onChange={(e) => {
                        const t = e.target.value as "ferie" | "permesso" | "pausa";
                        setNewEx({ ...newEx, type: t, start: t === "ferie" ? null : "09:00", end: t === "ferie" ? null : "13:00" });
                      }}
                      className="rounded-xl border border-[#1e2b4a] bg-[#131c31] px-3 py-2.5 text-sm text-white focus:border-indigo-400 focus:outline-none"
                    >
                      <option value="ferie">Ferie</option>
                      <option value="permesso">Permesso</option>
                      <option value="pausa">Pausa</option>
                    </select>
                  </div>
                  {newEx.type !== "ferie" && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Da</label>
                        <input
                          type="time"
                          value={newEx.start || ""}
                          onChange={(e) => setNewEx({ ...newEx, start: e.target.value })}
                          className="rounded-xl border border-[#1e2b4a] bg-[#131c31] px-3 py-2.5 text-sm text-white focus:border-indigo-400 focus:outline-none w-24"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">A</label>
                        <input
                          type="time"
                          value={newEx.end || ""}
                          onChange={(e) => setNewEx({ ...newEx, end: e.target.value })}
                          className="rounded-xl border border-[#1e2b4a] bg-[#131c31] px-3 py-2.5 text-sm text-white focus:border-indigo-400 focus:outline-none w-24"
                        />
                      </div>
                    </>
                  )}
                  <button
                    onClick={addException}
                    disabled={!newEx.date}
                    className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-400 disabled:opacity-40"
                  >
                    <Plus size={15} />
                    Aggiungi
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                {saved ? (
                  <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/15 px-6 py-3 text-sm font-extrabold text-emerald-300">
                    ✓ Salvataggio completato
                  </div>
                ) : (
                <button
                  onClick={saveExceptions}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-extrabold text-white transition hover:scale-105 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Salvataggio..." : "Salva eccezioni"}
                </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
