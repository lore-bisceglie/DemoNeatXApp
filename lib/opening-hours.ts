// ─── Tipi pubblici ────────────────────────────────────────────────────────────

export type DayHours = {
  open: string;       // "HH:MM"
  close: string;      // "HH:MM"
  breakStart?: string | null;
  breakEnd?: string | null;
};

/**
 * Formato ricco per gli orari settimanali.
 * Le chiavi sono stringhe "0"–"6" (0 = domenica, 6 = sabato, come JS Date.getDay()).
 */
export type WeekSchedule = {
  closed: number[];               // giorni completamente chiusi
  hours: Record<string, DayHours>; // orari per giorno (solo giorni aperti)
};

export type DayScheduleResult = {
  isClosed: boolean;
  open: string;
  close: string;
  breakStart: string | null;
  breakEnd: string | null;
};

export type DayScheduleSlotStatus = "open" | "closed" | "break";

// ─── Helpers interni ──────────────────────────────────────────────────────────

function tryParseJson(value: unknown, depth = 2): unknown {
  let parsed = value;
  for (let attempt = 0; attempt < depth && typeof parsed === "string"; attempt++) {
    const trimmed = parsed.trim();
    if (!trimmed) return null;
    try { parsed = JSON.parse(trimmed); } catch { return null; }
  }
  return parsed;
}

/** Determina se il valore salvato in DB usa il nuovo formato ricco. */
function isWeekSchedule(parsed: unknown): parsed is WeekSchedule {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    !Array.isArray(parsed) &&
    "closed" in parsed &&
    "hours" in parsed
  );
}

// ─── API pubblica ─────────────────────────────────────────────────────────────

/**
 * Compatibile con vecchio formato (`[0,6]`) e nuovo (`WeekSchedule`).
 * Restituisce sempre un array di interi 0–6.
 */
export function parseClosedDays(value: unknown): number[] {
  const parsed = tryParseJson(value);
  if (!parsed) return [];

  if (isWeekSchedule(parsed)) {
    return Array.from(
      new Set(
        (parsed.closed ?? [])
          .map((d: unknown) => Number(d))
          .filter((d: number) => Number.isInteger(d) && d >= 0 && d <= 6),
      ),
    ).sort((a, b) => a - b);
  }

  if (!Array.isArray(parsed)) return [];
  return Array.from(
    new Set(
      parsed
        .map((day) => Number(day))
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
    ),
  ).sort((a, b) => a - b);
}

export function serializeClosedDays(value: unknown): string | null {
  const days = parseClosedDays(value);
  return days.length > 0 ? JSON.stringify(days) : null;
}

/**
 * Restituisce gli orari di apertura/chiusura per uno specifico giorno della settimana.
 *
 * @param closedDaysRaw  Il valore grezzo del campo `closedDays` dal DB.
 * @param dayOfWeek      Numero JS: 0=domenica … 6=sabato.
 * @param fallbackOpen   Orario di apertura flat (da `openTime` del Tenant/Location).
 * @param fallbackClose  Orario di chiusura flat (da `closeTime`).
 * @param fallbackBreakStart  Pausa inizio flat.
 * @param fallbackBreakEnd    Pausa fine flat.
 */
export function parseDaySchedule(
  closedDaysRaw: unknown,
  dayOfWeek: number,
  fallbackOpen: string | null | undefined,
  fallbackClose: string | null | undefined,
  fallbackBreakStart?: string | null,
  fallbackBreakEnd?: string | null,
): DayScheduleResult {
  const parsed = tryParseJson(closedDaysRaw);

  if (isWeekSchedule(parsed)) {
    const closedList = (parsed.closed ?? []).map(Number);
    if (closedList.includes(dayOfWeek)) {
      return { isClosed: true, open: "00:00", close: "00:00", breakStart: null, breakEnd: null };
    }
    const dayConfig = parsed.hours?.[String(dayOfWeek)];
    if (dayConfig) {
      return {
        isClosed: false,
        open: dayConfig.open ?? fallbackOpen ?? "09:00",
        close: dayConfig.close ?? fallbackClose ?? "19:00",
        breakStart: dayConfig.breakStart ?? fallbackBreakStart ?? null,
        breakEnd: dayConfig.breakEnd ?? fallbackBreakEnd ?? null,
      };
    }
    // Giorno aperto ma senza config specifica → usa fallback flat
    return {
      isClosed: false,
      open: fallbackOpen ?? "09:00",
      close: fallbackClose ?? "19:00",
      breakStart: fallbackBreakStart ?? null,
      breakEnd: fallbackBreakEnd ?? null,
    };
  }

  // Vecchio formato: array di giorni chiusi
  const closedDays = parseClosedDays(closedDaysRaw);
  if (closedDays.includes(dayOfWeek)) {
    return { isClosed: true, open: "00:00", close: "00:00", breakStart: null, breakEnd: null };
  }
  return {
    isClosed: false,
    open: fallbackOpen ?? "09:00",
    close: fallbackClose ?? "19:00",
    breakStart: fallbackBreakStart ?? null,
    breakEnd: fallbackBreakEnd ?? null,
  };
}

export function getDayScheduleSlotStatus(
  schedule: DayScheduleResult,
  startTime: string,
  durationMinutes = 15,
): DayScheduleSlotStatus {
  if (schedule.isClosed) return "closed";

  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const start = toMinutes(startTime);
  const end = start + durationMinutes;
  const open = toMinutes(schedule.open);
  const close = toMinutes(schedule.close);

  if (![start, end, open, close].every(Number.isFinite) || start < open || end > close) {
    return "closed";
  }

  if (schedule.breakStart && schedule.breakEnd) {
    const breakStart = toMinutes(schedule.breakStart);
    const breakEnd = toMinutes(schedule.breakEnd);
    if (Number.isFinite(breakStart) && Number.isFinite(breakEnd) && start < breakEnd && end > breakStart) {
      return "break";
    }
  }

  return "open";
}

/**
 * Serializza il nuovo formato WeekSchedule in stringa JSON da salvare nel DB.
 */
export function serializeWeekSchedule(schedule: WeekSchedule): string {
  return JSON.stringify(schedule);
}

/**
 * Costruisce un WeekSchedule da un semplice array di giorni chiusi e
 * orari flat (comportamento uguale al vecchio sistema).
 * Utile per migrare i dati esistenti.
 */
export function buildWeekScheduleFromFlat(
  closedDays: number[],
  open: string,
  close: string,
  breakStart?: string | null,
  breakEnd?: string | null,
): WeekSchedule {
  const hours: Record<string, DayHours> = {};
  for (let day = 0; day <= 6; day++) {
    if (!closedDays.includes(day)) {
      hours[String(day)] = { open, close, breakStart: breakStart ?? null, breakEnd: breakEnd ?? null };
    }
  }
  return { closed: closedDays, hours };
}

