const MAX_LOGO_URL_LENGTH = 2_048;
const MAX_LOGO_DATA_URL_LENGTH = 1_500_000;
const LOGO_DATA_URL_PATTERN = /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=]+$/i;

export type TenantLogoValidation =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

export function validateTenantLogo(value: unknown): TenantLogoValidation {
  if (typeof value !== "string") {
    return { ok: false, error: "Immagine non valida." };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: true, value: null };
  }

  if (trimmed.startsWith("data:")) {
    if (trimmed.length > MAX_LOGO_DATA_URL_LENGTH) {
      return { ok: false, error: "L'immagine elaborata è troppo grande." };
    }
    if (!LOGO_DATA_URL_PATTERN.test(trimmed)) {
      return { ok: false, error: "Usa un'immagine PNG, JPG o WebP valida." };
    }
    return { ok: true, value: trimmed };
  }

  if (trimmed.length > MAX_LOGO_URL_LENGTH) {
    return { ok: false, error: "L'indirizzo dell'immagine è troppo lungo." };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, error: "L'indirizzo deve iniziare con https:// o http://." };
    }
    return { ok: true, value: parsed.toString() };
  } catch {
    return { ok: false, error: "Inserisci un indirizzo immagine completo e valido." };
  }
}
