import { parseDaySchedule } from "@/lib/opening-hours";
import { normalizeInstagramUrl, normalizeTikTokUrl, normalizeOptionalUrl } from "@/lib/contact";

// ─── Tipi per il JSON-LD ──────────────────────────────────────────────────────

type SeoBusinessInput = {
  name: string;
  category?: string | null;
  city?: string | null;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  facebookUrl?: string | null;
  websiteUrl?: string | null;
  mapsLink?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  breakStart?: string | null;
  breakEnd?: string | null;
  closedDays?: string | null;
  url: string;
  locationName?: string | null; // nome della sede, se presente
};

// ─── Categoria → tipo Schema.org ──────────────────────────────────────────────

const CATEGORY_SCHEMA_MAP: Record<string, string> = {
  barbiere: "HairSalon",
  barbieri: "HairSalon",
  barbershop: "HairSalon",
  parrucchiere: "HairSalon",
  parrucchieri: "HairSalon",
  hairdresser: "HairSalon",
  hair_salon: "HairSalon",
  estetista: "BeautySalon",
  estetica: "BeautySalon",
  beauty: "BeautySalon",
  beauty_salon: "BeautySalon",
  centro_estetico: "BeautySalon",
  onicotecnica: "NailSalon",
  nail: "NailSalon",
  nails: "NailSalon",
  manicure: "NailSalon",
  tattoo: "TattooParlor",
  tatuaggi: "TattooParlor",
  tatuatore: "TattooParlor",
  piercings: "TattooParlor",
  barbieria: "BarberShop",
  barber: "BarberShop",
};

export function mapCategoryToSchemaType(category: string | null | undefined): string {
  if (!category) return "HealthAndBeautyBusiness";
  const key = category.trim().toLowerCase();
  return CATEGORY_SCHEMA_MAP[key] || "HealthAndBeautyBusiness";
}

// ─── Titoli ottimizzati per ricerca locale ────────────────────────────────────

/**
 * Produce un title SEO-friendly, es. "Barbiere a Milano — Nome Salone".
 * Se mancano categoria o città, ripiega su "Prenota da Nome".
 */
export function formatLocalTitle(
  name: string,
  category?: string | null,
  city?: string | null,
  locationName?: string | null,
): string {
  const parts: string[] = [];

  if (category) {
    parts.push(category.trim());
  }

  if (city) {
    parts.push(`a ${city.trim()}`);
  }

  if (parts.length > 0) {
    const prefix = parts.join(" ");
    if (locationName && locationName !== name) {
      return `${prefix} — ${name} (${locationName})`;
    }
    return `${prefix} — ${name}`;
  }

  return `Prenota da ${name}`;
}

// ─── Orari → OpeningHoursSpecification ────────────────────────────────────────

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Genera il JSON-LD `openingHoursSpecification` da openTime/closeTime/closedDays.
 * Usa `parseDaySchedule` di lib/opening-hours.ts per gestire entrambi i formati
 * (vecchio `[0,6]` e nuovo WeekSchedule).
 */
export function buildOpeningHours(
  openTime: string | null | undefined,
  closeTime: string | null | undefined,
  closedDays: string | null | undefined,
  breakStart?: string | null,
  breakEnd?: string | null,
): Array<Record<string, unknown>> {
  const specs: Array<Record<string, unknown>> = [];

  for (let day = 0; day <= 6; day++) {
    const schedule = parseDaySchedule(
      closedDays,
      day,
      openTime || "09:00",
      closeTime || "19:00",
      breakStart,
      breakEnd,
    );

    if (schedule.isClosed) continue;

    const open = schedule.open || "09:00";
    const close = schedule.close || "19:00";

    // Se c'è una pausa, generiamo due intervalli per la giornata
    if (schedule.breakStart && schedule.breakEnd) {
      specs.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: WEEKDAY_NAMES[day],
        opens: open,
        closes: schedule.breakStart,
      });
      specs.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: WEEKDAY_NAMES[day],
        opens: schedule.breakEnd,
        closes: close,
      });
    } else {
      specs.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: WEEKDAY_NAMES[day],
        opens: open,
        closes: close,
      });
    }
  }

  return specs;
}

// ─── JSON-LD LocalBusiness ────────────────────────────────────────────────────

/**
 * Costruisce il JSON-LD LocalBusiness per un negozio (o una sua sede).
 * Riusa le utility di lib/contact.ts per normalizzare i link social.
 */
export function buildBusinessJsonLd(business: SeoBusinessInput): Record<string, unknown> {
  const schemaType = mapCategoryToSchemaType(business.category);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: business.name,
    description: business.description || undefined,
    url: business.url,
    telephone: business.phone || undefined,
  };

  if (business.logoUrl) {
    jsonLd.image = business.logoUrl;
    jsonLd.logo = business.logoUrl;
  }

  // Indirizzo
  if (business.address || business.city) {
    jsonLd.address = {
      "@type": "PostalAddress",
      streetAddress: business.address || undefined,
      addressLocality: business.city || undefined,
      addressCountry: "IT",
    };
  }

  // Geolocalizzazione se c'è una mappa Google
  if (business.mapsLink) {
    jsonLd.hasMap = business.mapsLink;
  }

  // Orari
  const hours = buildOpeningHours(
    business.openTime,
    business.closeTime,
    business.closedDays,
    business.breakStart,
    business.breakEnd,
  );
  if (hours.length > 0) {
    jsonLd.openingHoursSpecification = hours;
  }

  // Profili social (sameAs)
  const sameAs: string[] = [];
  const instagram = normalizeInstagramUrl(business.instagramUrl);
  if (instagram) sameAs.push(instagram);
  const tiktok = normalizeTikTokUrl(business.tiktokUrl);
  if (tiktok) sameAs.push(tiktok);
  const facebook = normalizeOptionalUrl(business.facebookUrl);
  if (facebook) sameAs.push(facebook);
  const website = normalizeOptionalUrl(business.websiteUrl);
  if (website) sameAs.push(website);
  if (sameAs.length > 0) {
    jsonLd.sameAs = sameAs;
  }

  // Nome della sede nel titolo
  if (business.locationName && business.locationName !== business.name) {
    jsonLd.branchOf = {
      "@type": "HealthAndBeautyBusiness",
      name: business.locationName,
    };
  }

  return jsonLd;
}
