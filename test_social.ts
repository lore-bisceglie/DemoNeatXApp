function socialHandle(value: unknown, domain: string) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const pathHandle = url.pathname.replace(/^\/@?/, "").split(/[/?#\s]/)[0];
      const cleanPathHandle = pathHandle.replace(/[^a-z0-9._]/gi, "");
      return cleanPathHandle || null;
    } catch {
      return null;
    }
  }

  const handle = trimmed
    .replace(/^@+/, "")
    .replace(new RegExp(`^(www\\.)?${domain.replace(".", "\\.")}/@?`, "i"), "")
    .replace(/^\/+/, "")
    .split(/[/?#\s]/)[0]
    .replace(/[^a-z0-9._]/gi, "");

  return handle || null;
}

export function normalizeInstagramUrl(value: unknown) {
  const handle = socialHandle(value, "instagram.com");
  return handle ? `https://instagram.com/${handle}` : null;
}

console.log("Empty:", normalizeInstagramUrl(""));
console.log("@greenbeauty:", normalizeInstagramUrl("@greenbeauty"));
console.log("green.beauty:", normalizeInstagramUrl("green.beauty"));
console.log("https://instagram.com/greenbeauty:", normalizeInstagramUrl("https://instagram.com/greenbeauty"));
console.log("https://www.instagram.com/greenbeauty:", normalizeInstagramUrl("https://www.instagram.com/greenbeauty"));
