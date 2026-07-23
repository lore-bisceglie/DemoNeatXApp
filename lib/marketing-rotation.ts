export type MarketingAsset = {
  category: string;
  hashtags: string;
  image: string;
};

// Le immagini sono intercalate per alternare anche il settore di riferimento.
// La rotazione e deterministica: un eventuale retry nello stesso giorno usa lo
// stesso contenuto, mentre due giorni consecutivi non usano mai la stessa foto.
const MARKETING_ASSETS: readonly MarketingAsset[] = [
  {
    category: "Barbieri e Parrucchieri Uomo",
    hashtags: "#NeatX #AgendaBarbiere #BarbiereItalia #ParrucchiereItalia #GestioneSalone",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop",
  },
  {
    category: "Estetica e Centri Benessere",
    hashtags: "#NeatX #CentroEstetico #EstetistaItalia #AgendaEstetica #GestioneCentroEstetico",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200&auto=format&fit=crop",
  },
  {
    category: "Parrucchieri Donna e Saloni di Bellezza",
    hashtags: "#NeatX #ParrucchieraItalia #SaloneDiBellezza #AgendaParrucchiere #HairStylistItalia",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop",
  },
  {
    category: "Tatuatori e Studi di Tattoo",
    hashtags: "#NeatX #TattooItalia #TatuatoreItaliano #AgendaTattoo #TattooStudioItalia",
    image: "https://images.unsplash.com/photo-1775565845581-3a8fc841da66?q=80&w=1200&auto=format&fit=crop",
  },
  {
    category: "Barbieri e Parrucchieri Uomo",
    hashtags: "#NeatX #AgendaBarbiere #BarbiereItalia #ParrucchiereItalia #GestioneSalone",
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop",
  },
  {
    category: "Estetica e Centri Benessere",
    hashtags: "#NeatX #CentroEstetico #EstetistaItalia #AgendaEstetica #GestioneCentroEstetico",
    image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1200&auto=format&fit=crop",
  },
  {
    category: "Parrucchieri Donna e Saloni di Bellezza",
    hashtags: "#NeatX #ParrucchieraItalia #SaloneDiBellezza #AgendaParrucchiere #HairStylistItalia",
    image: "https://images.unsplash.com/photo-1746723375184-5f537d2e6f31?q=80&w=1200&auto=format&fit=crop",
  },
  {
    category: "Tatuatori e Studi di Tattoo",
    hashtags: "#NeatX #TattooItalia #TatuatoreItaliano #AgendaTattoo #TattooStudioItalia",
    image: "https://images.unsplash.com/photo-1764605512907-4c31068a7ccc?q=80&w=1200&auto=format&fit=crop",
  },
  {
    category: "Estetica e Centri Benessere",
    hashtags: "#NeatX #CentroEstetico #EstetistaItalia #AgendaEstetica #GestioneCentroEstetico",
    image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=1200&auto=format&fit=crop",
  },
  {
    category: "Barbieri e Parrucchieri Uomo",
    hashtags: "#NeatX #AgendaBarbiere #BarbiereItalia #ParrucchiereItalia #GestioneSalone",
    image: "https://images.unsplash.com/photo-1520338661084-680395057c93?q=80&w=1200&auto=format&fit=crop",
  },
  {
    category: "Parrucchieri Donna e Saloni di Bellezza",
    hashtags: "#NeatX #ParrucchieraItalia #SaloneDiBellezza #AgendaParrucchiere #HairStylistItalia",
    image: "https://images.unsplash.com/photo-1761839256840-7780a45b85dc?q=80&w=1200&auto=format&fit=crop",
  },
  {
    category: "Estetica e Centri Benessere",
    hashtags: "#NeatX #CentroEstetico #EstetistaItalia #AgendaEstetica #GestioneCentroEstetico",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=1200&auto=format&fit=crop",
  },
  {
    category: "Tatuatori e Studi di Tattoo",
    hashtags: "#NeatX #TattooItalia #TatuatoreItaliano #AgendaTattoo #TattooStudioItalia",
    image: "https://images.unsplash.com/photo-1753260937548-94b93659d889?q=80&w=1200&auto=format&fit=crop",
  },
  {
    category: "Barbieri e Parrucchieri Uomo",
    hashtags: "#NeatX #AgendaBarbiere #BarbiereItalia #ParrucchiereItalia #GestioneSalone",
    image: "https://images.unsplash.com/photo-1747830280502-f33d7305a714?q=80&w=1200&auto=format&fit=crop",
  },
  {
    category: "Estetica e Centri Benessere",
    hashtags: "#NeatX #CentroEstetico #EstetistaItalia #AgendaEstetica #GestioneCentroEstetico",
    image: "https://images.unsplash.com/photo-1761718210089-ba3bb5ccb54f?q=80&w=1200&auto=format&fit=crop",
  },
  {
    category: "Tatuatori e Studi di Tattoo",
    hashtags: "#NeatX #TattooItalia #TatuatoreItaliano #AgendaTattoo #TattooStudioItalia",
    image: "https://images.unsplash.com/photo-1745777723328-6228e34ed2aa?q=80&w=1200&auto=format&fit=crop",
  },
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ROME_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Rome",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function getRomeCalendarDay(date: Date) {
  const parts = ROME_DATE_FORMATTER.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return Math.floor(Date.UTC(year, month - 1, day) / DAY_IN_MS);
}

export function selectDailyMarketingAsset(date = new Date()): MarketingAsset {
  const index = positiveModulo(getRomeCalendarDay(date), MARKETING_ASSETS.length);
  return MARKETING_ASSETS[index];
}

export function getMarketingRotationLength() {
  return MARKETING_ASSETS.length;
}
