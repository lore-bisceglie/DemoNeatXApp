const ROME_DATE_FORMATTER = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Rome",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const ROME_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Rome",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  hourCycle: "h23",
});

export function getRomeDate(value: Date): string {
  return ROME_DATE_FORMATTER.format(value);
}

/** Restituisce il giorno della settimana (0=domenica … 6=sabato) in fuso Europe/Rome */
export function getRomeDayOfWeek(value: Date): number {
  const romeDate = getRomeDate(value);
  return new Date(romeDate + "T12:00:00Z").getUTCDay();
}

export function getRomeClock(value: Date): { date: string; minutes: number } {
  const parts = ROME_TIME_FORMATTER.formatToParts(value);
  const hours = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minutes = Number(parts.find((part) => part.type === "minute")?.value || 0);
  return { date: getRomeDate(value), minutes: hours * 60 + minutes };
}
