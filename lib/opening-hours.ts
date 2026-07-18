export function parseClosedDays(value: unknown): number[] {
  let parsed = value;

  // Accetta sia il formato corretto ([0, 1]) sia eventuali vecchi valori
  // salvati due volte come stringa ("[0,1]").
  for (let attempt = 0; attempt < 2 && typeof parsed === "string"; attempt += 1) {
    const trimmed = parsed.trim();
    if (!trimmed) return [];

    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return [];
    }
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
