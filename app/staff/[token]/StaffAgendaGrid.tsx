"use client";

type ScheduleBlock = { start: string; end: string };
type PersonalAppointment = ScheduleBlock & { customerName: string; serviceName: string };
type StaffRequest = {
  date: string;
  type: string;
  start: string | null;
  end: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled" | "cancellation_requested";
};
type ShiftException = {
  date: string;
  type: "ferie" | "permesso" | "pausa";
  start: string | null;
  end: string | null;
};

type AgendaData = {
  requests: StaffRequest[];
  approvedExceptions: ShiftException[];
  baseBlocksByDate: Record<string, ScheduleBlock[]>;
  busyIntervalsByDate: Record<string, PersonalAppointment[]>;
  timelineStart: string;
  timelineEnd: string;
};

type AgendaItem = {
  kind: "appointment" | "ferie" | "permesso" | "pausa" | "pending" | "cancellation";
  start: string;
  end: string;
  title: string;
  subtitle: string;
};

const pad = (value: number) => String(value).padStart(2, "0");
const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};
const minutesToTime = (value: number) => `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;
const fromIso = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const shortDate = (value: string) => fromIso(value).toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" });

function slotsFrom(start: string, end: string) {
  const slots: string[] = [];
  for (let cursor = timeToMinutes(start); cursor < timeToMinutes(end); cursor += 15) {
    slots.push(minutesToTime(cursor));
  }
  return slots;
}

function contains(block: ScheduleBlock, slot: string) {
  const slotStart = timeToMinutes(slot);
  const slotEnd = slotStart + 15;
  return slotStart >= timeToMinutes(block.start) && slotEnd <= timeToMinutes(block.end);
}

function itemSpan(item: AgendaItem) {
  return Math.max(1, Math.ceil((timeToMinutes(item.end) - timeToMinutes(item.start)) / 15));
}

function itemStartsAt(item: AgendaItem, slot: string) {
  return item.start === slot;
}

export default function StaffAgendaGrid({
  dates,
  staffName,
  data,
  today,
  selectedDate,
  weekOffset,
  maxWeekOffset,
  minDate,
  maxDate,
  onPreviousWeek,
  onCurrentWeek,
  onNextWeek,
  onJumpToDate,
  onSelectDate,
}: {
  dates: string[];
  staffName: string;
  data: AgendaData;
  today: string;
  selectedDate: string | null;
  weekOffset: number;
  maxWeekOffset: number;
  minDate: string;
  maxDate: string;
  onPreviousWeek: () => void;
  onCurrentWeek: () => void;
  onNextWeek: () => void;
  onJumpToDate: (date: string) => void;
  onSelectDate: (date: string) => void;
}) {
  const slots = slotsFrom(data.timelineStart, data.timelineEnd);

  const itemForSlot = (date: string, slot: string): AgendaItem | null => {
    const cancellation = data.requests.find((item) => {
      if (item.date !== date || item.status !== "cancellation_requested") return false;
      if (item.type === "ferie") return true;
      return Boolean(item.start && item.end && contains({ start: item.start, end: item.end }, slot));
    });
    if (cancellation) {
      const start = cancellation.type === "ferie" ? data.timelineStart : cancellation.start!;
      const end = cancellation.type === "ferie" ? data.timelineEnd : cancellation.end!;
      return {
        kind: "cancellation",
        start,
        end,
        title: "ANNULLAMENTO IN ATTESA",
        subtitle: cancellation.type === "ferie" ? "Assenza ancora attiva" : `${start}–${end}`,
      };
    }
    const exception = data.approvedExceptions.find((item) => {
      if (item.date !== date) return false;
      if (item.type === "ferie") return true;
      return Boolean(item.start && item.end && contains({ start: item.start, end: item.end }, slot));
    });
    if (exception) {
      const start = exception.type === "ferie" ? data.timelineStart : exception.start!;
      const end = exception.type === "ferie" ? data.timelineEnd : exception.end!;
      return {
        kind: exception.type,
        start,
        end,
        title: exception.type === "ferie" ? "FERIE" : exception.type === "pausa" ? "PAUSA" : "PERMESSO",
        subtitle: exception.type === "ferie" ? "Tutto il giorno" : `${start}–${end}`,
      };
    }

    const pending = data.requests.find((item) => {
      if (item.date !== date || item.status !== "pending") return false;
      if (item.type === "ferie") return true;
      return Boolean(item.start && item.end && contains({ start: item.start, end: item.end }, slot));
    });
    if (pending) {
      const start = pending.type === "ferie" ? data.timelineStart : pending.start!;
      const end = pending.type === "ferie" ? data.timelineEnd : pending.end!;
      return {
        kind: "pending",
        start,
        end,
        title: "IN ATTESA",
        subtitle: pending.type === "ferie" ? "Richiesta ferie" : `${start}–${end}`,
      };
    }

    const appointment = (data.busyIntervalsByDate[date] || []).find((item) => contains(item, slot));
    if (appointment) {
      return {
        kind: "appointment",
        start: appointment.start,
        end: appointment.end,
        title: appointment.customerName,
        subtitle: appointment.serviceName,
      };
    }

    return null;
  };

  const itemStyle: Record<AgendaItem["kind"], string> = {
    appointment: "border-red-500/30 bg-red-500/12 text-red-100 hover:bg-red-500/20",
    ferie: "border-orange-500/30 bg-orange-500/10 text-orange-200",
    permesso: "border-blue-500/30 bg-blue-500/10 text-blue-200",
    pausa: "border-violet-500/30 bg-violet-500/10 text-violet-200",
    pending: "border-amber-400/35 bg-amber-400/10 text-amber-100",
    cancellation: "border-amber-400/55 bg-amber-400/20 text-amber-50",
  };

  return (
    <section className="relative left-1/2 mb-5 w-[calc(100vw-1rem)] max-w-[1400px] -translate-x-1/2 rounded-b-2xl border border-white/[0.07] bg-gradient-to-b from-[#0d1628] to-[#09101d] p-3 shadow-2xl shadow-black/20 sm:w-[calc(100vw-2rem)] sm:rounded-b-3xl sm:p-5">
      <div className="mb-4 flex flex-col justify-between gap-3 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Accesso personale</p>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight text-white sm:text-xl">La mia agenda</h2>
          <p className="mt-1 text-xs text-slate-500">I tuoi appuntamenti, turni, ferie e permessi.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2"><div className="flex items-center gap-1 rounded-2xl border border-[#1e2b4a] bg-[#131c31] p-1"><button type="button" onClick={onPreviousWeek} disabled={weekOffset === 0} className="rounded-xl px-3 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/10 hover:text-white disabled:opacity-25">← Prec</button><button type="button" onClick={onCurrentWeek} disabled={weekOffset === 0} className="rounded-xl bg-cyan-400 px-3 py-2 text-xs font-black text-[#05101c] transition hover:bg-cyan-300 disabled:cursor-default disabled:bg-cyan-400/70">Oggi</button><button type="button" onClick={onNextWeek} disabled={weekOffset >= maxWeekOffset} className="rounded-xl px-3 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/10 hover:text-white disabled:opacity-25">Pros →</button></div><label className="flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-2.5 py-1.5 text-[10px] font-bold text-cyan-200"><span className="hidden sm:inline">Vai alla data</span><input type="date" min={minDate} max={maxDate} onChange={(event) => { if (event.target.value) onJumpToDate(event.target.value); }} aria-label="Vai alla data" className="w-[126px] bg-transparent text-xs font-bold text-cyan-100 outline-none [color-scheme:dark]" /></label><span className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-2.5 py-2 text-[10px] font-bold text-cyan-300">15 min</span></div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-400/70" /> Disponibile</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400/70" /> Cliente</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-400/70" /> Pausa</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400/70" /> Permesso</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-400/70" /> Ferie</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-300" /> Annullamento richiesto</span>
      </div>

      <p className="mb-2 flex justify-center text-[10px] font-medium uppercase tracking-widest text-slate-500 sm:hidden">← Scorri per vedere la settimana →</p>
      <div className="overflow-x-auto pb-3">
        <div
          className="grid min-w-[900px] gap-x-px gap-y-0 rounded-2xl border border-white/[0.06] bg-[#070d18]/70 p-1 pr-6 sm:gap-x-1 sm:p-3 sm:pr-8"
          style={{ gridTemplateColumns: `minmax(52px, 70px) repeat(${dates.length}, minmax(110px, 1fr))` }}
        >
          <div className="sticky left-0 top-0 z-40 flex items-center justify-center border-r border-white/[0.04] bg-[#09101d]/95 pb-2 text-center text-xs font-bold uppercase tracking-widest text-slate-500 shadow-[4px_0_12px_rgba(0,0,0,0.5)] backdrop-blur-md">Ora</div>
          {dates.map((date) => {
            const isToday = date === today;
            const isSelected = date === selectedDate;
            const isWorkingDay = (data.baseBlocksByDate[date] || []).length > 0;
            const isPast = date < today;
            const isRequestableDay = isWorkingDay && !isPast;
            return (
              <button
                type="button"
                key={date}
                onClick={() => onSelectDate(date)}
                disabled={!isRequestableDay}
                className={`sticky top-0 z-30 mb-2 rounded-lg border py-2 text-center text-[10px] font-bold capitalize transition sm:text-sm ${
                  isToday
                    ? "border-cyan-400/50 bg-cyan-400/[0.12] text-cyan-200"
                    : isSelected
                      ? "border-violet-400/60 bg-violet-400/[0.12] text-violet-100"
                    : isRequestableDay
                      ? "border-white/[0.08] bg-white/[0.035] text-slate-100 hover:border-cyan-400/30"
                      : isPast
                        ? "cursor-not-allowed border-white/[0.06] bg-white/[0.02] text-slate-500"
                        : "cursor-not-allowed border-rose-500/20 bg-rose-500/[0.08] text-rose-300/80"
                }`}
              >
                <span className="block">{shortDate(date)} {!isWorkingDay ? <span className="ml-1 text-[9px] font-mono">CHIUSO</span> : isPast ? <span className="ml-1 text-[9px] font-mono">PASSATO</span> : null}</span>
                <span className="mt-1 block truncate border-t border-white/[0.06] pt-1 text-[9px] font-bold uppercase text-slate-400">{staffName.split(" ")[0]}</span>
                {isSelected && <span className="mt-1 inline-flex rounded-full bg-violet-400/20 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-violet-200">Scelto</span>}
              </button>
            );
          })}

          {slots.map((slot) => (
            <div className="contents" key={slot}>
              <div className="sticky left-0 z-20 flex min-h-[32px] items-center justify-center border-r border-white/[0.04] bg-[#09101d]/95 text-[10px] font-medium text-slate-400 shadow-[4px_0_12px_rgba(0,0,0,0.5)] backdrop-blur-md sm:min-h-[38px] sm:text-sm">
                <span className={`rounded-xl px-1 py-1 ${slot.endsWith(":15") || slot.endsWith(":45") ? "text-slate-600" : "border border-white/[0.08] bg-white/[0.035] text-slate-300"}`}>{slot}</span>
              </div>
              {dates.map((date, dateIndex) => {
                const item = itemForSlot(date, slot);
                const column = dateIndex + 2;

                if (item && !itemStartsAt(item, slot)) return null;

                if (item) {
                  const span = itemSpan(item);
                  return (
                    <button
                      type="button"
                      key={`${date}-${slot}`}
                      style={{ gridRow: `span ${span} / span ${span}`, gridColumn: column }}
                      onClick={() => onSelectDate(date)}
                      disabled={date < today}
                      title={`${item.start}–${item.end} · ${item.title} · ${item.subtitle}`}
                      className={`z-10 flex h-full min-h-[44px] w-full flex-col items-center justify-center rounded-xl border p-1 text-center font-bold transition disabled:cursor-default disabled:opacity-70 ${itemStyle[item.kind]}`}
                    >
                      <span className="text-[9px] font-medium opacity-70">{item.kind === "appointment" ? `${item.start}–${item.end}` : item.subtitle}</span>
                      <span className="mt-0.5 w-full truncate whitespace-normal text-[11px] leading-tight sm:text-sm">{item.title}</span>
                      {item.kind === "appointment" && <span className="mt-0.5 w-full truncate text-[9px] font-medium opacity-70">{item.subtitle}</span>}
                    </button>
                  );
                }

                const isOpen = (data.baseBlocksByDate[date] || []).some((block) => contains(block, slot));
                const isRequestableSlot = isOpen && date >= today;
                return (
                  <button
                    type="button"
                    key={`${date}-${slot}`}
                    style={{ gridColumn: column }}
                    onClick={() => onSelectDate(date)}
                    disabled={!isRequestableSlot}
                    title={isRequestableSlot ? `${shortDate(date)} · ${slot} · libero` : isOpen ? `${shortDate(date)} · ${slot} · passato` : `${shortDate(date)} · ${slot} · fuori turno`}
                    className={`mx-px my-px flex min-h-[30px] w-[calc(100%_-_2px)] items-center justify-center rounded-lg border text-center text-[9px] font-medium transition sm:min-h-[36px] ${
                      isRequestableSlot
                        ? "border-white/[0.055] bg-white/[0.012] text-slate-500 hover:border-cyan-400/20 hover:bg-cyan-400/[0.05] hover:text-cyan-200"
                        : isOpen
                          ? "border-white/[0.04] bg-white/[0.015] text-transparent"
                          : "border-rose-400/[0.11] bg-rose-400/[0.055] text-transparent"
                    }`}
                  >
                    {isRequestableSlot && <span className="inline-flex items-center gap-1 text-[10px] font-medium tracking-wider opacity-45"><span className="text-sm leading-none text-cyan-400/80">+</span><span className="hidden sm:inline">Libero</span></span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-1 text-center text-[11px] text-slate-600">Tocca un giorno o uno spazio libero per inviare una richiesta di ferie o permesso.</p>
    </section>
  );
}
