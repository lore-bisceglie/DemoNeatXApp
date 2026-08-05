import { getRomeDayOfWeek } from "@/lib/rome-time";

export type ScheduleBlock = {
  start: string;
  end: string;
};

export type DaySchedule = {
  active: boolean;
  blocks: ScheduleBlock[];
};

export type WeeklySchedule = {
  [day: string]: DaySchedule;
};

export type ShiftException = {
  date: string;
  type: "ferie" | "permesso" | "pausa";
  start: string | null;
  end: string | null;
};

export const DAY_NAMES = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

export const DAY_NAME_MAP_IT: Record<number, string> = {
  0: "domenica", 1: "lunedì", 2: "martedì", 3: "mercoledì",
  4: "giovedì", 5: "venerdì", 6: "sabato",
};

// Compatibilità con le chiavi salvate dai primi tenant con encoding errato.
const LEGACY_DAY_NAMES: Record<string, string> = {
  "lunedì": "lunedÃ¬",
  "martedì": "martedÃ¬",
  "mercoledì": "mercoledÃ¬",
  "giovedì": "giovedÃ¬",
  "venerdì": "venerdÃ¬",
};

export function dayIndexToName(idx: number): string {
  return DAY_NAME_MAP_IT[idx] || "lunedì";
}

export function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minsToTime(m: number): string {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const min = (m % 60).toString().padStart(2, "0");
  return `${h}:${min}`;
}

export function parseBaseSchedule(json: string | null | undefined): WeeklySchedule {
  if (!json || json.length < 3) return {};
  try {
    const value = JSON.parse(json);
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function parseShiftExceptions(json: string | null | undefined): ShiftException[] {
  if (!json || json.length < 3) return [];
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value.filter((item): item is ShiftException => Boolean(
      item && typeof item === "object" && typeof item.date === "string" &&
      (item.type === "ferie" || item.type === "permesso" || item.type === "pausa"),
    )) : [];
  } catch {
    return [];
  }
}

export function computeDayHours(day: DaySchedule | undefined): number {
  if (!day || !day.active || !day.blocks) return 0;
  let mins = 0;
  for (const block of day.blocks) {
    mins += Math.max(0, timeToMins(block.end) - timeToMins(block.start));
  }
  return mins / 60;
}

export function getDayScheduleForDate(
  weeklySchedule: WeeklySchedule,
  exceptions: ShiftException[],
  dateStr: string,
): { active: boolean; blocks: ScheduleBlock[]; exceptionNote?: string } {
  const date = new Date(`${dateStr}T12:00:00Z`);
  const dayName = dayIndexToName(getRomeDayOfWeek(date));
  const day = weeklySchedule[dayName] || weeklySchedule[LEGACY_DAY_NAMES[dayName]];
  if (!day || !day.active) return { active: false, blocks: [] };

  const dayExceptions = exceptions.filter((exception) => exception.date === dateStr);
  if (dayExceptions.some((exception) => exception.type === "ferie")) {
    return { active: false, blocks: [], exceptionNote: "Ferie" };
  }

  // Sottraiamo intervalli: 09:00-19:00 con permesso 14:00-16:00 diventa
  // 09:00-14:00 + 16:00-19:00, evitando slot che attraversano il permesso.
  let blocks = day.blocks.filter((block) => timeToMins(block.end) > timeToMins(block.start));
  const notes: string[] = [];
  for (const exception of dayExceptions) {
    if (exception.type !== "permesso" && exception.type !== "pausa") continue;
    const start = exception.start ? timeToMins(exception.start) : 0;
    const end = exception.end ? timeToMins(exception.end) : 24 * 60;
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;

    blocks = blocks.flatMap((block) => {
      const blockStart = timeToMins(block.start);
      const blockEnd = timeToMins(block.end);
      if (end <= blockStart || start >= blockEnd) return [block];
      const remaining: ScheduleBlock[] = [];
      if (start > blockStart) remaining.push({ start: block.start, end: minsToTime(Math.min(start, blockEnd)) });
      if (end < blockEnd) remaining.push({ start: minsToTime(Math.max(end, blockStart)), end: block.end });
      return remaining.filter((item) => timeToMins(item.end) > timeToMins(item.start));
    });
    notes.push(`${exception.type === "permesso" ? "Permesso" : "Pausa"} ${exception.start || "00:00"}-${exception.end || "24:00"}`);
  }

  return {
    active: blocks.length > 0,
    blocks,
    ...(notes.length > 0 ? { exceptionNote: notes.join(", ") } : {}),
  };
}
