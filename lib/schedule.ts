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
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function parseShiftExceptions(json: string | null | undefined): ShiftException[] {
  if (!json || json.length < 3) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

export function computeDayHours(day: DaySchedule | undefined): number {
  if (!day || !day.active || !day.blocks) return 0;
  let mins = 0;
  for (const b of day.blocks) {
    mins += Math.max(0, timeToMins(b.end) - timeToMins(b.start));
  }
  return mins / 60;
}

export function getDayScheduleForDate(
  weeklySchedule: WeeklySchedule,
  exceptions: ShiftException[],
  dateStr: string,
): { active: boolean; blocks: ScheduleBlock[]; exceptionNote?: string } {
  const date = new Date(dateStr + "T12:00:00");
  const dayName = dayIndexToName(date.getDay());

  const exception = exceptions.find((e) => e.date === dateStr);
  if (exception) {
    if (exception.type === "ferie") {
      return { active: false, blocks: [], exceptionNote: "Ferie" };
    }
    if (exception.type === "permesso") {
      const base = weeklySchedule[dayName];
      if (!base || !base.active) return { active: false, blocks: [] };
      const filtered = base.blocks.filter((b) => {
        const bs = timeToMins(b.start);
        const be = timeToMins(b.end);
        const es = exception.start ? timeToMins(exception.start) : 0;
        const ee = exception.end ? timeToMins(exception.end) : 0;
        return !(bs >= es && be <= ee);
      });
      return { active: filtered.length > 0, blocks: filtered, exceptionNote: `Permesso ${exception.start}-${exception.end}` };
    }
    if (exception.type === "pausa") {
      const base = weeklySchedule[dayName];
      if (!base || !base.active) return { active: false, blocks: [] };
      return { active: true, blocks: base.blocks, exceptionNote: `Pausa ${exception.start}-${exception.end}` };
    }
  }

  const day = weeklySchedule[dayName];
  if (!day || !day.active) return { active: false, blocks: [] };
  return { active: true, blocks: day.blocks };
}
