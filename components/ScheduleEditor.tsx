"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Calendar, ChevronLeft, ChevronRight, Clock, Coffee, Plus, Save, Trash2, Umbrella, X } from "lucide-react";
import type { ScheduleBlock, ShiftException, WeeklySchedule } from "@/lib/schedule";
import { DAY_NAMES, getDayScheduleForDate, timeToMins } from "@/lib/schedule";

type Props = { staffId: string; staffName: string; onClose: () => void };
type ExceptionType = ShiftException["type"];

const EMPTY_DAY: ScheduleBlock[] = [];
const pad = (value: number) => String(value).padStart(2, "0");
const TIME_OPTIONS = Array.from({ length: 72 }, (_, index) => {
  const minutes = 6 * 60 + index * 15;
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
});
const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const todayIso = () => toIsoDate(new Date());
const fromIsoDate = (value: string) => { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day); };
const formatDate = (value: string) => fromIsoDate(value).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
const minsToTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

function TimeSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-[#1e2b4a] bg-[#131c31] px-2 py-1.5 text-sm text-white outline-none focus:border-indigo-400">{TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}</select>;
}

export default function ScheduleEditor({ staffId, staffName, onClose }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"orari" | "eccezioni">("eccezioni");
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [shopSchedule, setShopSchedule] = useState<WeeklySchedule>({});
  const [inheritsStoreHours, setInheritsStoreHours] = useState(true);
  const [exceptions, setExceptions] = useState<ShiftException[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState(todayIso());

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/schedule?staffId=${encodeURIComponent(staffId)}`);
      if (!response.ok) throw new Error("load");
      const data = await response.json() as { baseSchedule?: WeeklySchedule; shiftExceptions?: ShiftException[]; shopSchedule?: WeeklySchedule };
      const baseSchedule = data.baseSchedule || {};
      const inherited = Object.keys(baseSchedule).length === 0;
      const storeSchedule = data.shopSchedule || {};
      setShopSchedule(storeSchedule);
      setInheritsStoreHours(inherited);
      setSchedule(inherited ? storeSchedule : baseSchedule);
      setExceptions(data.shiftExceptions || []);
    } catch { setFeedback("Impossibile caricare il calendario."); }
    finally { setLoading(false); }
  }, [staffId]);

  useEffect(() => { void loadSchedule(); }, [loadSchedule]);

  const saveExceptions = async (next: ShiftException[]) => {
    setSaving(true);
    try {
      const response = await fetch("/api/staff/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ staffId, exceptions: next }) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Salvataggio non riuscito");
      setExceptions(next);
      router.refresh();
      setFeedback("Calendario aggiornato anche in agenda");
      window.setTimeout(() => setFeedback(null), 2200);
    } catch (error) { setFeedback(error instanceof Error ? error.message : "Salvataggio non riuscito"); }
    finally { setSaving(false); }
  };

  const addException = (type: ExceptionType, start: string | null, end: string | null) => {
    if (type !== "ferie" && (!start || !end || start >= end)) { setFeedback("L'orario di fine deve essere dopo l'inizio."); return; }
    const withoutConflict = type === "ferie" ? exceptions.filter((item) => item.date !== selectedDate) : exceptions.filter((item) => !(item.date === selectedDate && item.type === "ferie"));
    void saveExceptions([...withoutConflict, { date: selectedDate, type, start, end }].sort((a, b) => a.date.localeCompare(b.date)));
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/staff/schedule", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ staffId, baseSchedule: inheritsStoreHours ? {} : schedule }) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Salvataggio non riuscito");
      router.refresh();
      setFeedback(inheritsStoreHours ? "Orari del negozio collegati" : "Orari fissi salvati"); window.setTimeout(() => onClose(), 600);
    } catch (error) { setFeedback(error instanceof Error ? error.message : "Salvataggio non riuscito"); }
    finally { setSaving(false); }
  };

  const toggleDay = (day: string) => { setInheritsStoreHours(false); setSchedule((current) => current[day]?.active ? { ...current, [day]: { active: false, blocks: [] } } : { ...current, [day]: { active: true, blocks: [{ start: "09:00", end: "13:00" }] } }); };
  const updateBlock = (day: string, index: number, field: keyof ScheduleBlock, value: string) => { setInheritsStoreHours(false); setSchedule((current) => { const blocks = [...(current[day]?.blocks || [])]; blocks[index] = { ...blocks[index], [field]: value }; return { ...current, [day]: { active: true, blocks } }; }); };
  const addBlock = (day: string) => { setInheritsStoreHours(false); setSchedule((current) => { const blocks = current[day]?.blocks || []; const start = blocks[blocks.length - 1]?.end || "09:00"; const startIndex = TIME_OPTIONS.indexOf(start); const endIndex = Math.min(TIME_OPTIONS.length - 1, Math.max(0, startIndex) + 16); if (startIndex < 0 || endIndex <= startIndex) return current; const end = TIME_OPTIONS[endIndex]; return { ...current, [day]: { active: true, blocks: [...blocks, { start, end }] } }; }); };
  const removeBlock = (day: string, index: number) => { setInheritsStoreHours(false); setSchedule((current) => { const blocks = (current[day]?.blocks || []).filter((_, itemIndex) => itemIndex !== index); return { ...current, [day]: { active: blocks.length > 0, blocks } }; }); };
  const restoreStoreHours = () => { setSchedule(shopSchedule); setInheritsStoreHours(true); };

  const monthCells = useMemo(() => { const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay(); const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); return Array.from({ length: Math.ceil((firstDay + days) / 7) * 7 }, (_, index) => { const day = index - firstDay + 1; return day > 0 && day <= days ? toIsoDate(new Date(month.getFullYear(), month.getMonth(), day)) : null; }); }, [month]);
  const selectedExceptions = exceptions.filter((item) => item.date === selectedDate);
  const monthLabel = month.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  const breakPresets = useMemo(() => {
    const day = getDayScheduleForDate(schedule, [], selectedDate);
    const presets: { start: string; end: string; label: string }[] = [];
    for (const block of day.blocks) {
      const start = timeToMins(block.start);
      const end = timeToMins(block.end);
      if (end - start < 60) continue;
      const middle = start + Math.round(((end - start - 60) / 2) / 15) * 15;
      for (const candidate of [start, middle, end - 60]) {
        const preset = { start: minsToTime(candidate), end: minsToTime(candidate + 60), label: `${minsToTime(candidate)} – ${minsToTime(candidate + 60)}` };
        if (!presets.some((item) => item.start === preset.start && item.end === preset.end)) presets.push(preset);
      }
    }
    return presets.slice(0, 3);
  }, [schedule, selectedDate]);
  const permissionPresets = useMemo(() => {
    const day = getDayScheduleForDate(schedule, [], selectedDate);
    const presets: { start: string; end: string; label: string }[] = [];
    for (const block of day.blocks) {
      const start = timeToMins(block.start);
      const end = timeToMins(block.end);
      if (end - start < 120) continue;
      const middle = start + Math.floor((end - start - 120) / 30) * 15;
      for (const candidate of [start, middle, end - 120]) {
        const preset = { start: minsToTime(candidate), end: minsToTime(candidate + 120), label: `${minsToTime(candidate)} – ${minsToTime(candidate + 120)}` };
        if (!presets.some((item) => item.start === preset.start && item.end === preset.end)) presets.push(preset);
      }
    }
    return presets.slice(0, 3);
  }, [schedule, selectedDate]);

  if (loading) return <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="rounded-2xl border border-[#1e2b4a] bg-[#0b1221] px-6 py-4 text-sm font-bold text-slate-300">Caricamento calendario...</div></div>;

  return <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}><div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-[#1e2b4a] bg-[#0b1221] shadow-2xl" onClick={(event) => event.stopPropagation()}>
    <header className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-[#1e2b4a] bg-[#131c31] px-6 py-4"><div><h2 className="text-xl font-extrabold capitalize text-white">{staffName}</h2><p className="mt-0.5 text-xs text-slate-500">Turni e assenze · Europe/Rome</p></div><button onClick={onClose} aria-label="Chiudi" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1e2b4a] text-slate-400 hover:bg-red-500/20 hover:text-red-300"><X size={18} /></button></header>
    <div className="flex border-b border-[#1e2b4a]"><button onClick={() => setTab("eccezioni")} className={`flex items-center gap-2 px-6 py-3 text-sm font-bold ${tab === "eccezioni" ? "border-b-2 border-amber-400 bg-amber-500/5 text-amber-300" : "text-slate-500"}`}><Calendar size={15} /> Calendario assenze</button><button onClick={() => setTab("orari")} className={`flex items-center gap-2 px-6 py-3 text-sm font-bold ${tab === "orari" ? "border-b-2 border-indigo-400 bg-indigo-500/5 text-indigo-300" : "text-slate-500"}`}><Clock size={15} /> Orari fissi</button></div>
    {tab === "orari" && <div className="mx-6 mt-5 flex flex-col gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-extrabold text-cyan-200">{inheritsStoreHours ? "Allineato agli orari del negozio" : "Turno personalizzato"}</p><p className="mt-1 text-xs leading-relaxed text-slate-400">{inheritsStoreHours ? "Le modifiche agli orari del negozio si applicano automaticamente anche a Pietro." : "Le prenotazioni restano comunque limitate agli orari e alle pause del negozio."}</p></div><button type="button" onClick={restoreStoreHours} className="shrink-0 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-500/20">{inheritsStoreHours ? "Orari negozio attivi" : "Ripristina orari negozio"}</button></div>}
    <div className="p-6">{tab === "eccezioni" ? <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
      <section><div className="mb-3 flex items-center justify-between"><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><ChevronLeft size={17} /></button><h3 className="text-sm font-extrabold capitalize text-white">{monthLabel}</h3><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><ChevronRight size={17} /></button></div><div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600">{["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"].map((day) => <span key={day} className="py-2">{day}</span>)}</div><div className="grid grid-cols-7 gap-1">{monthCells.map((date, index) => { const dayExceptions = date ? exceptions.filter((item) => item.date === date) : []; const selected = date === selectedDate; return <button type="button" key={`${date || "empty"}-${index}`} disabled={!date} onClick={() => date && setSelectedDate(date)} className={`min-h-14 rounded-xl border p-1 text-left transition ${!date ? "border-transparent" : selected ? "border-indigo-400 bg-indigo-500/15" : "border-[#1e2b4a] bg-[#131c31] hover:border-indigo-400/50"}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${selected ? "bg-indigo-500 text-white" : "text-slate-300"}`}>{date ? Number(date.slice(-2)) : ""}</span>{dayExceptions.length > 0 && <span className="mt-1 flex flex-wrap gap-1">{dayExceptions.map((item, itemIndex) => <span key={`${item.type}-${itemIndex}`} className={`h-1.5 w-1.5 rounded-full ${item.type === "ferie" ? "bg-amber-400" : "bg-blue-400"}`} />)}</span>}</button>; })}</div><p className="mt-4 text-xs leading-relaxed text-slate-500">Seleziona una data e usa una delle azioni rapide: il salvataggio è immediato.</p></section>
      <section className="rounded-2xl border border-[#1e2b4a] bg-[#131c31] p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Giorno selezionato</p>
        <h3 className="mt-1 text-lg font-extrabold capitalize text-white">{formatDate(selectedDate)}</h3>
        <button disabled={saving} onClick={() => addException("ferie", null, null)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm font-extrabold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"><Umbrella size={16} /> Ferie · giornata intera</button>
        <div className="mt-4 rounded-xl border border-[#1e2b4a] bg-[#0b1221] p-3">
          <p className="text-xs font-bold text-slate-400">Permesso rapido · 2 ore</p>
          {permissionPresets.length > 0 ? <div className="mt-2 grid gap-2">{permissionPresets.map((preset) => <button key={`permesso-${preset.start}-${preset.end}`} disabled={saving} onClick={() => addException("permesso", preset.start, preset.end)} className="flex items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2.5 text-sm font-extrabold text-blue-300 hover:bg-blue-500/20 disabled:opacity-50"><Ban size={15} /> {preset.label}</button>)}</div> : <p className="mt-2 text-xs leading-relaxed text-slate-500">Imposta prima un turno attivo per questa data: i permessi vengono proposti solo dentro l'orario di lavoro.</p>}
        </div>
        <div className="mt-3 rounded-xl border border-[#1e2b4a] bg-[#0b1221] p-3">
          <p className="text-xs font-bold text-slate-400">Pausa rapida · 1 ora</p>
          {breakPresets.length > 0 ? <div className="mt-2 grid gap-2">{breakPresets.map((preset) => <button key={`pausa-${preset.start}-${preset.end}`} disabled={saving} onClick={() => addException("pausa", preset.start, preset.end)} className="flex items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2.5 text-sm font-extrabold text-violet-300 hover:bg-violet-500/20 disabled:opacity-50"><Coffee size={15} /> {preset.label}</button>)}</div> : <p className="mt-2 text-xs leading-relaxed text-slate-500">Le pause vengono proposte solo dentro un turno attivo.</p>}
        </div>
        <div className="mt-5 space-y-2">{selectedExceptions.length === 0 ? <p className="rounded-xl border border-dashed border-[#1e2b4a] px-3 py-4 text-center text-xs text-slate-600">Nessuna assenza in questo giorno</p> : selectedExceptions.map((item, index) => <div key={`${item.type}-${item.start}-${index}`} className="flex items-center justify-between rounded-xl border border-[#1e2b4a] bg-[#0b1221] px-3 py-2.5"><div className="flex items-center gap-2 text-sm font-bold text-white"><span className={item.type === "ferie" ? "text-amber-400" : item.type === "pausa" ? "text-violet-400" : "text-blue-400"}>{item.type === "ferie" ? <Umbrella size={15} /> : item.type === "pausa" ? <Coffee size={15} /> : <Ban size={15} />}</span><span className="capitalize">{item.type}</span><span className="text-xs font-normal text-slate-400">{item.start && item.end ? `${item.start} – ${item.end}` : "Giornata intera"}</span></div><button onClick={() => void saveExceptions(exceptions.filter((candidate) => candidate !== item))} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10" title="Rimuovi"><Trash2 size={14} /></button></div>)}</div>
        {feedback && <p className={`mt-4 text-center text-xs font-bold ${feedback.includes("non") || feedback.includes("fine") ? "text-red-300" : "text-emerald-300"}`}>{feedback}</p>}
      </section>
    </div> : <section className="space-y-4"><p className="text-sm text-slate-400">Scegli i giorni attivi e gli orari dai menu a intervalli di 15 minuti. Le ferie e i permessi hanno priorità.</p>{DAY_NAMES.map((day) => { const dayData = schedule[day]; const blocks = dayData?.active ? dayData.blocks : EMPTY_DAY; const active = dayData?.active ?? false; return <div key={day} className={`rounded-2xl border p-4 ${active ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/5 bg-white/[0.02] opacity-60"}`}><div className="flex items-center justify-between"><div><span className="text-sm font-extrabold capitalize text-white">{day}</span><span className="ml-2 rounded-full bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-500">{active ? "In servizio" : "Riposo"}</span></div><button onClick={() => toggleDay(day)} className="rounded-lg border border-[#1e2b4a] px-3 py-1.5 text-xs font-bold text-slate-300">{active ? "Metti riposo" : "Attiva turno"}</button></div>{active && <div className="mt-3 space-y-2">{blocks.map((block, index) => <div className="flex items-center gap-2" key={`${day}-${index}`}><TimeSelect value={block.start} onChange={(value) => updateBlock(day, index, "start", value)} /><span className="text-slate-600">—</span><TimeSelect value={block.end} onChange={(value) => updateBlock(day, index, "end", value)} /><button onClick={() => removeBlock(day, index)} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button></div>)}<button onClick={() => addBlock(day)} className="flex items-center gap-1 text-xs font-bold text-indigo-400"><Plus size={13} /> Aggiungi turno</button></div>}</div>; })}<div className="flex justify-end pt-2"><button onClick={() => void saveSchedule()} disabled={saving} className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-extrabold text-[#03111f] disabled:opacity-50"><Save size={16} /> {saving ? "Salvataggio..." : "Salva orari fissi"}</button></div></section>}</div>
  </div></div>;
}
