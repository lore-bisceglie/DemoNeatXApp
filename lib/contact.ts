const DEFAULT_SALES_WHATSAPP_NUMBER = "393333333333";

export function phoneDigits(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/\D/g, "");
}

export function normalizeWhatsappPhone(value: unknown) {
  let digits = phoneDigits(value);
  if (!digits) return null;

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.length === 10 && digits.startsWith("3")) {
    digits = `39${digits}`;
  }

  return digits.length >= 8 ? digits : null;
}

export function normalizeOptionalUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export function normalizeInstagramUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return normalizeOptionalUrl(trimmed);
  }

  const handle = trimmed
    .replace(/^@+/, "")
    .replace(/^instagram\.com\//i, "")
    .replace(/^www\.instagram\.com\//i, "")
    .replace(/^\/+/, "")
    .split(/[/?#\s]/)[0]
    .replace(/[^a-z0-9._]/gi, "");

  return handle ? `https://instagram.com/${handle}` : null;
}

export function buildMapsLink(address: string | null | undefined, explicit?: string | null) {
  const direct = normalizeOptionalUrl(explicit);
  if (direct) return direct;

  const cleanAddress = typeof address === "string" ? address.trim() : "";
  if (!cleanAddress) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`;
}

export function buildWhatsappUrl(phone: string | null | undefined, message?: string) {
  const digits = normalizeWhatsappPhone(phone || "");
  if (!digits) return null;

  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

export function getBookingRedirectUrl({
  bookingUrl,
  phone,
  message,
}: {
  bookingUrl?: string | null;
  phone?: string | null;
  message?: string;
}) {
  return normalizeOptionalUrl(bookingUrl) || buildWhatsappUrl(phone, message);
}

export function getSalesWhatsappNumber() {
  return (
    normalizeWhatsappPhone(process.env.NEXT_PUBLIC_SALES_WHATSAPP_NUMBER || "") ||
    DEFAULT_SALES_WHATSAPP_NUMBER
  );
}

export function getSalesWhatsappUrl(message: string) {
  return buildWhatsappUrl(getSalesWhatsappNumber(), message) || `https://wa.me/${DEFAULT_SALES_WHATSAPP_NUMBER}`;
}
