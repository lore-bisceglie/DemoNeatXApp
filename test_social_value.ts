function socialHandleValue(value: string | null | undefined, domain: string) {
  const raw = value?.trim();
  if (!raw) return "";

  const pattern = new RegExp(`${domain.replace(".", "\\.")}/@?([^/?#\\s]+)`, "i");
  const match = raw.match(pattern);
  if (match?.[1]) return `@${match[1].replace(/^@+/, "")}`;

  return raw.startsWith("@") ? raw : `@${raw}`;
}

console.log("Empty:", socialHandleValue("", "instagram.com"));
console.log("Null:", socialHandleValue(null, "instagram.com"));
console.log("https://instagram.com/greenbeauty:", socialHandleValue("https://instagram.com/greenbeauty", "instagram.com"));
console.log("https://instagram.com/green_beauty:", socialHandleValue("https://instagram.com/green_beauty", "instagram.com"));
console.log("@greenbeauty:", socialHandleValue("@greenbeauty", "instagram.com"));
console.log("greenbeauty:", socialHandleValue("greenbeauty", "instagram.com"));
