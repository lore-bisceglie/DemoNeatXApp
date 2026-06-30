export function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function csvLine(values: unknown[]) {
  return values.map(csvCell).join(",");
}

