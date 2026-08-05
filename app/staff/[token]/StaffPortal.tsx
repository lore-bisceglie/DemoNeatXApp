"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock3, LockKeyhole, Send, Umbrella, X } from "lucide-react";
import StaffAgendaGrid from "./StaffAgendaGrid";

type RequestRow = {
  id: string;
  date: string;
  type: string;
  start: string | null;
  end: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled" | "cancellation_requested";
  createdAt: string;
};

type TimeOption = { start: string; end: string; label: string };
type ScheduleBlock = { start: string; end: string };
type PersonalAppointment = ScheduleBlock & { customerName: string; serviceName: string };
type NextAppointment = PersonalAppointment & { date: string };
type PortalData = {
  staff: { name: string; tenantName: string };
  requests: RequestRow[];
  approvedExceptions: Array<{ date: string; type: "ferie" | "permesso" | "pausa"; start: string | null; end: string | null }>;
  workingDates: string[];
  timeOptionsByDate: Record<string, TimeOption[]>;
  workingBlocksByDate: Record<string, ScheduleBlock[]>;
  baseBlocksByDate: Record<string, ScheduleBlock[]>;
  busyIntervalsByDate: Record<string, PersonalAppointment[]>;
  nextAppointment: NextAppointment | null;
  today: string;
  nowMinutes: number;
  maxWeekOffset: number;
  maxDate: string;
  calendarWeekOffset: number;
  timelineStart: string;
  timelineEnd: string;
};

const pad = (value: number) => String(value).padStart(2, "0");
const toIso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const fromIso = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};
const dayNumber = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
};
const shortDate = (value: string) => fromIso(value).toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" });
const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};
const minutesToTime = (value: number) => `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;

function statusForDate(requests: RequestRow[], date: string) {
  const rows = requests.filter((item) => item.date === date);
  return rows.find((item) => item.status === "pending") || rows.find((item) => item.status === "cancellation_requested") || rows.find((item) => item.status === "approved") || rows.find((item) => item.status === "rejected") || null;
}

function slotsFrom(start: string, end: string, includeEnd = false) {
  const slots: string[] = [];
  const endMinutes = timeToMinutes(end);
  for (let cursor = timeToMinutes(start); includeEnd ? cursor <= endMinutes : cursor < endMinutes; cursor += 15) {
    slots.push(minutesToTime(cursor));
  }
  return slots;
}

type TimelineStatus = "free" | "busy" | "pending" | "approved" | "pause" | "off";

function intervalContains(block: ScheduleBlock, slot: string) {
  const slotStart = timeToMinutes(slot);
  const slotEnd = slotStart + 15;
  return slotStart >= timeToMinutes(block.start) && slotEnd <= timeToMinutes(block.end);
}

export function PersonalWeekTimeline({
  dates,
  data,
  selectedDate,
  onSelectDate,
}: {
  dates: string[];
  data: PortalData;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}) {
  const timelineSlots = slotsFrom(data.timelineStart, data.timelineEnd);
  const statusForSlot = (date: string, slot: string): TimelineStatus => {
    const approved = data.approvedExceptions.filter((item) => item.date === date);
    if (approved.some((item) => item.type === "ferie" || (item.type === "permesso" && item.start && item.end && intervalContains({ start: item.start, end: item.end }, slot)))) {
      return "approved";
    }
    if (approved.some((item) => item.type === "pausa" && item.start && item.end && intervalContains({ start: item.start, end: item.end }, slot))) {
      return "pause";
    }
    const pending = data.requests.filter((item) => item.date === date && item.status === "pending");
    if (pending.some((item) => item.type === "ferie" || (item.start && item.end && intervalContains({ start: item.start, end: item.end }, slot)))) {
      return "pending";
    }
    if ((data.busyIntervalsByDate[date] || []).some((item) => intervalContains(item, slot))) return "busy";
    if ((data.baseBlocksByDate[date] || []).some((item) => intervalContains(item, slot))) return "free";
    return "off";
  };

  const statusStyle: Record<TimelineStatus, { className: string; label: string }> = {
    free: { className: "bg-cyan-400/20 hover:bg-cyan-400/30", label: "Nel turno · libero" },
    busy: { className: "bg-violet-400/35 hover:bg-violet-400/45", label: "Occupato" },
    pending: { className: "bg-amber-400/45 hover:bg-amber-400/55", label: "Richiesta in attesa" },
    approved: { className: "bg-emerald-400/45 hover:bg-emerald-400/55", label: "Assenza approvata" },
    pause: { className: "bg-fuchsia-400/30 hover:bg-fuchsia-400/40", label: "Pausa" },
    off: { className: "bg-white/[0.025] hover:bg-white/[0.05]", label: "Fuori turno" },
  };

  return <section className="mb-5 rounded-3xl border border-[#1e2b4a] bg-[#0b1221] p-4 shadow-xl"><div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-base font-black text-white">La mia settimana</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">Vedi solo il tuo tempo: nessun nome o contatto cliente.</p></div><span className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-2 py-1 text-[10px] font-bold text-cyan-300">15 min</span></div><div className="mb-3 flex flex-wrap gap-x-3 gap-y-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-cyan-400/70" /> Libero</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-violet-400/80" /> Occupato</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Attesa</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Approvata</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-fuchsia-400/80" /> Pausa</span></div><div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#070d18]"><div className="grid min-w-[560px] gap-px p-1" style={{ gridTemplateColumns: `44px repeat(${dates.length}, minmax(0, 1fr))` }}><div className="sticky left-0 top-0 z-20 flex items-center justify-center bg-[#070d18] text-[9px] font-bold uppercase tracking-wider text-slate-600">Ora</div>{dates.map((date) => <button type="button" key={date} onClick={() => onSelectDate(date)} className={`sticky top-0 z-10 rounded-lg border px-1 py-2 text-center text-[10px] font-black uppercase transition ${selectedDate === date ? "border-cyan-400 bg-cyan-400/15 text-cyan-200" : "border-white/[0.07] bg-[#131c31] text-slate-300 hover:border-cyan-400/40"}`}><span className="block">{shortDate(date).replace(/\./g, "")}</span></button>)}{timelineSlots.map((slot) => <div className="contents" key={slot}><div className="sticky left-0 z-10 flex min-h-5 items-center justify-center bg-[#070d18] text-[9px] font-bold text-slate-600">{slot.endsWith(":00") ? slot : ""}</div>{dates.map((date) => { const status = statusForSlot(date, slot); const display = statusStyle[status]; return <button type="button" key={`${date}-${slot}`} onClick={() => onSelectDate(date)} title={`${shortDate(date)} · ${slot} · ${display.label}`} aria-label={`${shortDate(date)} alle ${slot}: ${display.label}`} className={`min-h-5 rounded-sm border border-transparent transition ${display.className} ${selectedDate === date ? "ring-1 ring-inset ring-cyan-200/20" : ""}`} />; })}</div>)}</div></div><p className="mt-3 text-center text-[11px] text-slate-600">Tocca un giorno della griglia per richiedere ferie o un permesso.</p></section>;
}

export function PersonalAppointmentsAgenda({
  dates,
  data,
  selectedDate,
  onSelectDate,
}: {
  dates: string[];
  data: PortalData;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}) {
  const absencesForDate = (date: string) => data.approvedExceptions.filter((item) => item.date === date);

  return (
    <section className="mb-5 rounded-3xl border border-[#1e2b4a] bg-[#0b1221] p-4 shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Solo personale</p>
          <h2 className="mt-1 text-base font-black text-white">La mia agenda clienti</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Vedi i tuoi appuntamenti: ora, nome e servizio. Niente numeri, incassi o agenda dei colleghi.
          </p>
        </div>
        <span className="rounded-xl border border-violet-400/20 bg-violet-400/10 px-2 py-1 text-[10px] font-bold text-violet-200">
          Questa settimana
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#070d18] p-2">
        <div className="grid min-w-[700px] grid-cols-7 gap-2">
          {dates.map((date) => {
            const appointments = data.busyIntervalsByDate[date] || [];
            const absences = absencesForDate(date);
            const baseBlocks = data.baseBlocksByDate[date] || [];
            const hasApprovedLeave = absences.some((item) => item.type === "ferie" || item.type === "permesso");

            return (
              <div
                key={date}
                className={`min-h-52 rounded-2xl border p-2.5 transition ${
                  selectedDate === date
                    ? "border-cyan-400 bg-cyan-400/[0.08]"
                    : "border-white/[0.07] bg-[#111a2d]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectDate(date)}
                  className="w-full rounded-xl px-1 pb-2 text-left transition hover:bg-white/[0.04]"
                  aria-label={`Apri ${shortDate(date)}`}
                >
                  <p className="text-[10px] font-black uppercase text-slate-400">{shortDate(date).replace(/\./g, "")}</p>
                  <p className="mt-1 text-[10px] font-bold text-cyan-300">
                    {baseBlocks.length > 0
                      ? baseBlocks.map((block) => `${block.start}–${block.end}`).join(" · ")
                      : "Fuori turno"}
                  </p>
                </button>

                {hasApprovedLeave && (
                  <div className="mb-2 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-200">
                    Assenza approvata
                  </div>
                )}

                <div className="space-y-2">
                  {appointments.map((appointment) => (
                    <button
                      type="button"
                      key={`${appointment.start}-${appointment.end}-${appointment.customerName}`}
                      onClick={() => onSelectDate(date)}
                      title={`${appointment.start}–${appointment.end} · ${appointment.customerName} · ${appointment.serviceName}`}
                      className="w-full rounded-xl border border-violet-300/25 bg-violet-400/15 p-2 text-left transition hover:bg-violet-400/25"
                    >
                      <p className="text-[10px] font-black text-violet-200">{appointment.start}–{appointment.end}</p>
                      <p className="mt-1 truncate text-xs font-black text-white">{appointment.customerName}</p>
                      <p className="mt-0.5 truncate text-[10px] font-medium text-violet-200/80">{appointment.serviceName}</p>
                    </button>
                  ))}
                  {appointments.length === 0 && !hasApprovedLeave && (
                    <button
                      type="button"
                      onClick={() => onSelectDate(date)}
                      className="w-full rounded-xl border border-dashed border-cyan-400/15 bg-cyan-400/[0.03] px-2 py-3 text-left text-[10px] font-bold text-slate-500 transition hover:border-cyan-400/35 hover:text-cyan-200"
                    >
                      Nessun cliente prenotato
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-slate-600">Tocca un giorno o un appuntamento per aprire la richiesta di ferie o permesso.</p>
    </section>
  );
}

function NextClientCard({ data, onSelectDate }: { data: PortalData; onSelectDate: (date: string) => void }) {
  const next = data.nextAppointment;

  if (!next) {
    return (
      <section className="relative left-1/2 mb-0 w-[calc(100vw-1rem)] max-w-[1400px] -translate-x-1/2 rounded-t-2xl border border-b-0 border-cyan-400/15 bg-gradient-to-r from-cyan-500/[0.10] to-[#0b1221] p-4 shadow-xl sm:w-[calc(100vw-2rem)] sm:rounded-t-3xl sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Prossimo cliente</p>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div><h2 className="text-lg font-black text-white">Nessun appuntamento in arrivo</h2><p className="mt-1 text-xs text-slate-400">Controlla la tua agenda per i prossimi turni.</p></div>
          <span className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-200">Agenda libera</span>
        </div>
      </section>
    );
  }

  const dateLabel = next.date === data.today ? "Oggi" : shortDate(next.date);
  const isNow = next.date === data.today && timeToMinutes(next.start) <= data.nowMinutes;

  return (
    <button
      type="button"
      onClick={() => onSelectDate(next.date)}
      className="relative left-1/2 mb-0 flex w-[calc(100vw-1rem)] max-w-[1400px] -translate-x-1/2 items-center justify-between gap-4 rounded-t-2xl border border-b-0 border-red-400/25 bg-gradient-to-r from-red-500/[0.14] via-[#111a2d] to-[#0b1221] p-4 text-left shadow-xl transition hover:border-red-300/45 hover:from-red-500/[0.20] sm:w-[calc(100vw-2rem)] sm:rounded-t-3xl sm:p-5"
      title="Apri il giorno nell'agenda"
    >
      <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest text-red-300">{isNow ? "In corso" : "Prossimo cliente"}</p><h2 className="mt-1 truncate text-xl font-black text-white sm:text-2xl">{next.customerName}</h2><p className="mt-1 truncate text-sm font-medium text-red-100/80">{next.serviceName}</p></div>
      <div className="shrink-0 rounded-2xl border border-red-300/25 bg-red-400/10 px-3 py-2 text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-red-200/70">{dateLabel}</p><p className="mt-0.5 text-base font-black text-white">{next.start}</p><p className="text-[10px] font-medium text-red-100/70">fino alle {next.end}</p></div>
    </button>
  );
}

export default function StaffPortal({ token, staffName, tenantName }: { token: string; staffName: string; tenantName: string }) {
  const [data, setData] = useState<PortalData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [jumpedDate, setJumpedDate] = useState<string | null>(null);
  const [showExactTime, setShowExactTime] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`/api/staff/requests?token=${encodeURIComponent(token)}&weekOffset=${weekOffset}`, { cache: "no-store" });
    if (response.ok) setData(await response.json() as PortalData);
    else setMessage("Questo link non è più attivo.");
  }, [token, weekOffset]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const refresh = () => { void load(); };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const intervalId = window.setInterval(refresh, 15_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [load]);

  const visibleDates = useMemo(() => {
    if (!data) return [];
    const start = fromIso(data.today);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + weekOffset * 7);
    return Array.from({ length: 7 }, (_, index) => toIso(addDays(start, index))).filter((date) => data.workingDates.includes(date));
  }, [data, weekOffset]);

  const agendaDates = useMemo(() => {
    const start = data ? fromIso(data.today) : new Date();
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + weekOffset * 7);
    return Array.from({ length: 7 }, (_, index) => toIso(addDays(start, index)));
  }, [data, weekOffset]);

  const selectedRequest = data && selectedDate ? statusForDate(data.requests, selectedDate) : null;
  const selectedQuickOptions = data && selectedDate ? data.timeOptionsByDate[selectedDate] || [] : [];
  const selectedBlocks = data && selectedDate ? data.workingBlocksByDate[selectedDate] || [] : [];
  const selectedAppointments = data && selectedDate ? data.busyIntervalsByDate[selectedDate] || [] : [];
  const startOptions = selectedBlocks.flatMap((block) => slotsFrom(block.start, block.end));
  const startBlock = customStart
    ? selectedBlocks.find((block) => timeToMinutes(customStart) >= timeToMinutes(block.start) && timeToMinutes(customStart) < timeToMinutes(block.end))
    : null;
  const endOptions = startBlock && customStart ? slotsFrom(minutesToTime(timeToMinutes(customStart) + 15), startBlock.end, true) : [];

  const selectDate = (date: string) => {
    setSelectedDate(date);
    setMessage(null);
    setShowExactTime(false);
    setCustomStart("");
    setCustomEnd("");
  };

  const selectDateForRequest = (date: string) => {
    if (!(data?.baseBlocksByDate[date] || []).length) {
      setMessage("In questo giorno non hai un turno: non puoi inviare una richiesta.");
      return;
    }
    selectDate(date);
    window.setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 50);
  };

  const changeWeek = (nextWeekOffset: number) => {
    const maxWeekOffset = data?.maxWeekOffset ?? 52;
    const boundedOffset = Math.max(0, Math.min(maxWeekOffset, nextWeekOffset));
    if (boundedOffset === weekOffset) return;
    setSelectedDate(null);
    setMessage(null);
    setShowExactTime(false);
    setCustomStart("");
    setCustomEnd("");
    setWeekOffset(boundedOffset);
  };

  const jumpToDate = (date: string) => {
    if (!data || date < data.today || date > data.maxDate) return;
    const currentMonday = fromIso(data.today);
    currentMonday.setDate(currentMonday.getDate() - ((currentMonday.getDay() + 6) % 7));
    const targetWeekOffset = Math.floor((dayNumber(date) - dayNumber(toIso(currentMonday))) / 7);
    setJumpedDate(date);
    changeWeek(targetWeekOffset);
  };

  useEffect(() => {
    if (!jumpedDate || !data || data.calendarWeekOffset !== weekOffset || !agendaDates.includes(jumpedDate)) return;
    setJumpedDate(null);
    if (!(data.baseBlocksByDate[jumpedDate] || []).length) {
      setMessage("In questa data non hai un turno: l'agenda è stata comunque aperta sulla settimana scelta.");
      return;
    }
    selectDate(jumpedDate);
    window.setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 50);
  }, [agendaDates, data, jumpedDate, weekOffset]);

  const openExactTime = () => {
    const firstBlock = selectedBlocks[0];
    if (!firstBlock) return;
    const start = firstBlock.start;
    const defaultEnd = Math.min(timeToMinutes(start) + 120, timeToMinutes(firstBlock.end));
    setCustomStart(start);
    setCustomEnd(minutesToTime(defaultEnd));
    setShowExactTime(true);
  };

  const changeCustomStart = (start: string) => {
    const block = selectedBlocks.find((item) => timeToMinutes(start) >= timeToMinutes(item.start) && timeToMinutes(start) < timeToMinutes(item.end));
    setCustomStart(start);
    if (!block) return;
    const currentEndIsValid = customEnd && timeToMinutes(customEnd) > timeToMinutes(start) && timeToMinutes(customEnd) <= timeToMinutes(block.end);
    if (!currentEndIsValid) {
      setCustomEnd(minutesToTime(Math.min(timeToMinutes(start) + 120, timeToMinutes(block.end))));
    }
  };

  const requestLeave = async (type: "ferie" | "permesso", option?: TimeOption) => {
    if (!selectedDate || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/staff/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, date: selectedDate, type, start: option?.start || null, end: option?.end || null }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Richiesta non inviata");
      setShowExactTime(false);
      setMessage("Richiesta inviata · gialla in attesa di approvazione");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Richiesta non inviata");
    } finally {
      setBusy(false);
    }
  };

  const withdrawRequest = async () => {
    if (!selectedRequest || !["pending", "approved"].includes(selectedRequest.status) || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/staff/requests", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, requestId: selectedRequest.id }) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Non riesco a ritirare la richiesta");
      const cancellationRequested = Boolean((result as { cancellationRequested?: boolean }).cancellationRequested);
      if (cancellationRequested) {
        setMessage("Annullamento richiesto: l'assenza resta attiva finché il titolare non conferma.");
      } else {
        setSelectedDate(null);
        setMessage("Richiesta annullata");
      }
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Non riesco a gestire la richiesta");
    } finally {
      setBusy(false);
    }
  };

  const statusLabel = selectedRequest?.status === "approved"
    ? "APPROVATA"
    : selectedRequest?.status === "cancellation_requested"
      ? "ANNULLAMENTO IN ATTESA"
    : selectedRequest?.status === "rejected"
      ? "RIFIUTATA"
      : selectedRequest?.status === "pending"
        ? "IN ATTESA"
        : "NESSUNA RICHIESTA";

  if (!data) {
    return <main className="flex min-h-screen items-center justify-center bg-[#050814] p-6 text-sm font-bold text-slate-300">Caricamento agenda...</main>;
  }

  return <main className="min-h-screen bg-[#050814] px-4 py-6 text-slate-200 sm:px-6"><div className="mx-auto max-w-md">
    <header className="mb-6 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-400">{tenantName}</p><h1 className="mt-1 text-2xl font-black text-white">Ciao, {staffName}</h1><p className="mt-1 text-xs text-slate-500">Tocca una data. Niente password, niente moduli.</p></div><div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300"><LockKeyhole size={20} /></div></header>

    <NextClientCard data={data} onSelectDate={selectDate} />

    <div className="hidden">

    <section className="mb-5 rounded-3xl border border-[#1e2b4a] bg-[#0b1221] p-4 shadow-xl"><div className="mb-4 flex items-center justify-between"><button type="button" disabled={weekOffset === 0} onClick={() => setWeekOffset((value) => Math.max(0, value - 1))} className="rounded-xl p-2 text-slate-400 hover:bg-white/5 disabled:opacity-20" aria-label="Settimana precedente"><ChevronLeft size={18} /></button><span className="text-sm font-extrabold text-white">I tuoi prossimi turni</span><button type="button" disabled={weekOffset >= 51} onClick={() => setWeekOffset((value) => Math.min(51, value + 1))} className="rounded-xl p-2 text-slate-400 hover:bg-white/5 disabled:opacity-20" aria-label="Settimana successiva"><ChevronRight size={18} /></button></div><div className="grid grid-cols-2 gap-2">{visibleDates.length === 0 ? <p className="col-span-2 py-8 text-center text-sm text-slate-500">Nessun turno in questa settimana.</p> : visibleDates.map((date) => { const row = statusForDate(data.requests, date); const selected = date === selectedDate; const color = row?.status === "approved" ? "border-emerald-400 bg-emerald-500/20" : row?.status === "pending" ? "border-amber-400 bg-amber-500/20" : row?.status === "rejected" ? "border-red-400 bg-red-500/20" : selected ? "border-cyan-400 bg-cyan-500/10" : "border-[#1e2b4a] bg-[#131c31]"; return <button type="button" key={date} onClick={() => selectDate(date)} className={`min-h-20 rounded-2xl border-2 p-3 text-left transition active:scale-[.98] ${color}`}><p className="text-xs font-bold uppercase text-slate-400">{shortDate(date)}</p><p className="mt-2 text-sm font-black text-white">{row?.status === "approved" ? "Approvata" : row?.status === "pending" ? "In attesa" : row?.status === "rejected" ? "Rifiutata" : "Disponibile"}</p>{row?.type === "permesso" && <p className="mt-1 text-[10px] font-bold text-slate-300">{row.start}–{row.end}</p>}</button>; })}</div><div className="mt-4 flex justify-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-500"><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Approvata</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Attesa</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-red-400" /> Rifiutata</span></div></section>

    </div>

    <StaffAgendaGrid dates={agendaDates} staffName={staffName} data={data} today={data.today} selectedDate={selectedDate} weekOffset={weekOffset} maxWeekOffset={data.maxWeekOffset} minDate={data.today} maxDate={data.maxDate} onPreviousWeek={() => changeWeek(weekOffset - 1)} onCurrentWeek={() => changeWeek(0)} onNextWeek={() => changeWeek(weekOffset + 1)} onJumpToDate={jumpToDate} onSelectDate={selectDateForRequest} />

    {selectedDate && <section className="rounded-3xl border border-[#1e2b4a] bg-[#0b1221] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Data selezionata</p><h2 className="mt-1 text-xl font-black capitalize text-white">{shortDate(selectedDate)}</h2></div><span className={`rounded-full px-3 py-1.5 text-[10px] font-black tracking-wider ${selectedRequest?.status === "approved" ? "bg-emerald-500/20 text-emerald-300" : selectedRequest?.status === "pending" || selectedRequest?.status === "cancellation_requested" ? "bg-amber-500/20 text-amber-300" : selectedRequest?.status === "rejected" ? "bg-red-500/20 text-red-300" : "bg-slate-500/15 text-slate-400"}`}>{statusLabel}</span></div>
      {(!selectedRequest || selectedRequest.status === "rejected") && <div className="mt-5 grid gap-3">{selectedAppointments.length > 0 && <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3 text-center"><p className="text-xs font-black text-amber-100">Hai già {selectedAppointments.length === 1 ? "un cliente" : `${selectedAppointments.length} clienti`} in agenda</p><p className="mt-1 text-[11px] leading-relaxed text-amber-100/70">Puoi comunque inviare la richiesta: il titolare dovrà prima riprogrammare gli appuntamenti coinvolti.</p></div>}<button type="button" disabled={busy} onClick={() => void requestLeave("ferie")} className="flex min-h-16 items-center justify-center gap-3 rounded-2xl border-2 border-amber-400/30 bg-amber-500/10 text-base font-black text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"><Umbrella size={22} /> Ferie · giornata intera</button><div className="grid gap-2 sm:grid-cols-2">{selectedQuickOptions.map((option) => <button type="button" disabled={busy} key={`${option.start}-${option.end}`} onClick={() => void requestLeave("permesso", option)} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-blue-400/30 bg-blue-500/10 text-sm font-black text-blue-200 transition hover:bg-blue-500/20 disabled:opacity-50"><Clock3 size={18} /> Permesso {option.label}</button>)}</div><button type="button" disabled={busy || selectedBlocks.length === 0} onClick={openExactTime} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/5 text-sm font-black text-cyan-200 transition hover:bg-cyan-500/15 disabled:opacity-50"><Clock3 size={18} /> Orario diverso? Scegli l&apos;ora precisa</button>
        {showExactTime && <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-black text-cyan-100">Permesso su misura</p><p className="mt-1 text-xs text-slate-400">Solo dentro il tuo turno, a intervalli di 15 minuti.</p></div><button type="button" onClick={() => setShowExactTime(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5" aria-label="Chiudi orario preciso"><X size={16} /></button></div><div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-400">Dalle<select aria-label="Inizio permesso" value={customStart} onChange={(event) => changeCustomStart(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#1e2b4a] bg-[#131c31] px-3 py-3 text-base font-black text-white outline-none focus:border-cyan-400">{startOptions.map((time) => <option key={time} value={time}>{time}</option>)}</select></label><label className="text-xs font-bold text-slate-400">Alle<select aria-label="Fine permesso" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#1e2b4a] bg-[#131c31] px-3 py-3 text-base font-black text-white outline-none focus:border-cyan-400">{endOptions.map((time) => <option key={time} value={time}>{time}</option>)}</select></label></div><button type="button" disabled={busy || !customStart || !customEnd} onClick={() => void requestLeave("permesso", { start: customStart, end: customEnd, label: `${customStart}–${customEnd}` })} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 text-sm font-black text-[#03111f] transition hover:bg-cyan-300 disabled:opacity-50"><Send size={17} /> Richiedi {customStart}–{customEnd}</button></div>}
      </div>}
      {selectedRequest?.status === "pending" && <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-center"><Send className="mx-auto mb-2 text-amber-300" size={24} /><p className="text-sm font-black text-amber-200">Il titolare deve ancora approvare</p><p className="mt-1 text-xs text-amber-200/70">La richiesta resta gialla finché non viene presa una decisione.</p><button type="button" disabled={busy} onClick={() => void withdrawRequest()} className="mt-3 rounded-xl border border-amber-300/30 bg-[#0b1221] px-4 py-2 text-xs font-black text-amber-200 transition hover:bg-amber-400 hover:text-[#231800] disabled:opacity-50">{busy ? "Annullamento..." : "Annulla richiesta"}</button></div>}
      {selectedRequest?.status === "approved" && <div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-center"><Check className="mx-auto mb-2 text-emerald-300" size={24} /><p className="text-sm font-black text-emerald-200">{selectedRequest.type === "ferie" ? "Ferie approvate" : "Permesso approvato"}</p><p className="mt-1 text-xs text-emerald-200/70">L&apos;assenza è registrata: in quell&apos;orario l&apos;agenda non accetterà nuove prenotazioni.</p><button type="button" disabled={busy} onClick={() => void withdrawRequest()} className="mt-3 rounded-xl border border-emerald-300/30 bg-[#0b1221] px-4 py-2 text-xs font-black text-emerald-200 transition hover:bg-emerald-400 hover:text-[#03231a] disabled:opacity-50">{busy ? "Invio..." : "Richiedi annullamento"}</button></div>}
      {selectedRequest?.status === "cancellation_requested" && <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-center"><Clock3 className="mx-auto mb-2 text-amber-300" size={24} /><p className="text-sm font-black text-amber-200">Annullamento in attesa</p><p className="mt-1 text-xs text-amber-200/70">Il turno resta bloccato finché il titolare non conferma o rifiuta l&apos;annullamento.</p></div>}
      {selectedRequest?.status === "rejected" && <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-center"><X className="mx-auto mb-2 text-red-300" size={24} /><p className="text-sm font-black text-red-200">Richiesta rifiutata</p><p className="mt-1 text-xs text-red-200/70">Puoi scegliere di nuovo la data per inviare una nuova richiesta.</p></div>}
      {message && <p className="mt-4 text-center text-xs font-bold text-slate-400">{message}</p>}
    </section>}
    {message && !selectedDate && <p role="status" className="mt-4 rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-4 py-3 text-center text-xs font-bold text-cyan-200">{message}</p>}
  </div></main>;
}
