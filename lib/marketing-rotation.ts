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
  {
    category: "Barbieri e Parrucchieri Uomo",
    hashtags: "#NeatX #AgendaBarbiere #BarbiereItalia #ParrucchiereItalia #GestioneSalone",
    image: "https://demo-neatx-app.vercel.app/marketing/barbershop_promo_1.jpg",
  },
  {
    category: "Estetica e Centri Benessere",
    hashtags: "#NeatX #CentroEstetico #EstetistaItalia #AgendaEstetica #GestioneCentroEstetico",
    image: "https://demo-neatx-app.vercel.app/marketing/beauty_salon_promo_1.jpg",
  },
  {
    category: "Tatuatori e Studi di Tattoo",
    hashtags: "#NeatX #TattooItalia #TatuatoreItaliano #AgendaTattoo #TattooStudioItalia",
    image: "https://demo-neatx-app.vercel.app/marketing/tattoo_studio_promo_1.jpg",
  },
  {
    category: "Parrucchieri Donna e Saloni di Bellezza",
    hashtags: "#NeatX #ParrucchieraItalia #SaloneDiBellezza #AgendaParrucchiere #HairStylistItalia",
    image: "https://demo-neatx-app.vercel.app/marketing/hairsalon_promo_1.jpg",
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

function getDynamicImagePrompt(category: string, seed: number): string {
  const uniqueSuffix = ` hyperrealistic 8k resolution highly detailed photography (unique seed: ${seed})`;
  if (category.includes("Barbier")) return "modern stylish luxury barber shop interior, moody lighting, professional aesthetic, elegant, no people" + uniqueSuffix;
  if (category.includes("Estetica")) return "bright clean luxurious beauty salon and spa interior, minimalist, highly aesthetic, no people" + uniqueSuffix;
  if (category.includes("Tattoo")) return "professional tattoo studio interior, modern industrial style, clean, artistic, no people" + uniqueSuffix;
  if (category.includes("Donna")) return "high-end luxury hair salon interior, elegant mirrors, warm lighting, luxurious, no people" + uniqueSuffix;
  return "beautiful modern professional interior, clean, aesthetic, no people" + uniqueSuffix;
}

function getRotationIndex(date: Date) {
  // Cambia indice ogni 12 ore
  return Math.floor(date.getTime() / (12 * 60 * 60 * 1000));
}

export function selectDailyMarketingAsset(date = new Date()): MarketingAsset {
  const index = positiveModulo(getRotationIndex(date), MARKETING_ASSETS.length);
  const asset = { ...MARKETING_ASSETS[index] };
  
  // Generazione AI GRATUITA "on the fly" con Pollinations.ai
  // Usiamo l'indice o il timestamp come seed per avere una foto unica ogni mezza giornata
  const seed = getRotationIndex(date);
  const prompt = getDynamicImagePrompt(asset.category, seed);
  
  asset.image = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1080&nologo=true&seed=${seed}`;
  
  return asset;
}

export function getMarketingRotationLength() {
  return MARKETING_ASSETS.length;
}
