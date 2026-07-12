export type DemoCategory =
  | "hair_women"
  | "barber"
  | "beauty_center"
  | "nail_salon"
  | "massage"
  | "personal_trainer"
  | "private_studio"
  | "medico"
  | "nutrizionista"
  | "tatuatore"
  | "toelettatura"
  | "psicologo"
  | "consulente";

export type DemoServiceTemplate = {
  name: string;
  duration: number;
  price: number;
};

export type DemoStaffTemplate = {
  name: string;
  services?: string[];
};

export type DemoBookingSeed = {
  customerName: string;
  customerPhone: string;
  dayOffset: number;
  time: string;
  serviceName: string;
  staffName?: string;
  isPaid?: boolean;
};

export type DemoShopTemplate = {
  id: DemoCategory;
  label: string;
  shortLabel: string;
  description: string;
  openTime: string;
  closeTime: string;
  breakStart?: string;
  breakEnd?: string;
  closedDays: number[];
  services: DemoServiceTemplate[];
  staff: DemoStaffTemplate[];
  bookings: DemoBookingSeed[];
  reviews: { name: string; text: string; rating: number }[];
};

const demoReviews = [
  {
    name: "Cliente demo",
    text: "Esempio recensione: prenotazione chiara e conferma immediata.",
    rating: 5,
  },
  {
    name: "Cliente test",
    text: "Esempio recensione: ho trovato subito un orario libero.",
    rating: 5,
  },
];

export const demoShopTemplates: Record<DemoCategory, DemoShopTemplate> = {
  hair_women: {
    id: "hair_women",
    label: "Parrucchiere donna",
    shortLabel: "Parrucchiere",
    description:
      "Salone parrucchiere con taglio, colore, piega e trattamenti. I clienti scelgono servizio, orario e professionista senza telefonare.",
    openTime: "09:00",
    closeTime: "19:00",
    breakStart: "13:00",
    breakEnd: "14:00",
    closedDays: [0, 1],
    services: [
      { name: "Piega", duration: 30, price: 25 },
      { name: "Taglio donna", duration: 45, price: 38 },
      { name: "Taglio + piega", duration: 60, price: 55 },
      { name: "Colore ricrescita", duration: 90, price: 65 },
      { name: "Colore completo", duration: 120, price: 85 },
      { name: "Balayage", duration: 150, price: 130 },
      { name: "Trattamento ristrutturante", duration: 45, price: 45 },
      { name: "Consulenza cambio look", duration: 30, price: 20 },
    ],
    staff: [
      { name: "Giulia", services: ["Piega", "Taglio donna", "Taglio + piega"] },
      { name: "Martina", services: ["Colore ricrescita", "Colore completo", "Balayage"] },
      { name: "Elena" },
    ],
    bookings: [
      { customerName: "Sara Bianchi", customerPhone: "3330001001", dayOffset: 1, time: "09:30", serviceName: "Piega", staffName: "Giulia" },
      { customerName: "Marta Rossi", customerPhone: "3330001002", dayOffset: 1, time: "11:00", serviceName: "Colore ricrescita", staffName: "Martina" },
      { customerName: "Claudia Test", customerPhone: "3330001003", dayOffset: 2, time: "15:00", serviceName: "Taglio + piega", staffName: "Elena" },
      { customerName: "Laura Demo", customerPhone: "3330001004", dayOffset: 3, time: "10:00", serviceName: "Balayage", staffName: "Martina" },
      { customerName: "Irene Neri", customerPhone: "3330001005", dayOffset: 4, time: "16:30", serviceName: "Trattamento ristrutturante", staffName: "Giulia" },
    ],
    reviews: demoReviews,
  },
  barber: {
    id: "barber",
    label: "Barbiere",
    shortLabel: "Barbiere",
    description:
      "Barber shop con taglio, barba e servizi rapidi. La pagina mostra disponibilità reali e riduce i messaggi avanti e indietro.",
    openTime: "09:00",
    closeTime: "20:00",
    breakStart: "13:00",
    breakEnd: "14:30",
    closedDays: [0, 1],
    services: [
      { name: "Taglio uomo", duration: 30, price: 25 },
      { name: "Barba", duration: 20, price: 15 },
      { name: "Taglio + barba", duration: 50, price: 35 },
      { name: "Sfumatura", duration: 30, price: 22 },
      { name: "Trattamento barba", duration: 25, price: 20 },
      { name: "Rasatura completa", duration: 30, price: 28 },
      { name: "Taglio bambino", duration: 25, price: 18 },
    ],
    staff: [
      { name: "Marco", services: ["Taglio uomo", "Sfumatura", "Taglio bambino"] },
      { name: "Luca", services: ["Barba", "Taglio + barba", "Trattamento barba"] },
      { name: "Andrea" },
    ],
    bookings: [
      { customerName: "Davide Prova", customerPhone: "3330002001", dayOffset: 1, time: "10:00", serviceName: "Taglio uomo", staffName: "Marco" },
      { customerName: "Alessio Demo", customerPhone: "3330002002", dayOffset: 1, time: "11:00", serviceName: "Taglio + barba", staffName: "Luca" },
      { customerName: "Matteo Verdi", customerPhone: "3330002003", dayOffset: 2, time: "15:30", serviceName: "Sfumatura", staffName: "Marco" },
      { customerName: "Francesco Blu", customerPhone: "3330002004", dayOffset: 3, time: "18:00", serviceName: "Barba", staffName: "Luca" },
      { customerName: "Cliente Test", customerPhone: "3330002005", dayOffset: 4, time: "12:00", serviceName: "Taglio bambino", staffName: "Andrea" },
    ],
    reviews: demoReviews,
  },
  beauty_center: {
    id: "beauty_center",
    label: "Centro estetico",
    shortLabel: "Beauty",
    description:
      "Centro estetico con trattamenti viso, corpo ed epilazione. Il cliente prenota in autonomia e il titolare vede tutto in agenda.",
    openTime: "09:30",
    closeTime: "19:30",
    breakStart: "13:00",
    breakEnd: "14:00",
    closedDays: [0],
    services: [
      { name: "Pulizia viso", duration: 50, price: 55 },
      { name: "Epilazione gambe", duration: 45, price: 35 },
      { name: "Epilazione sopracciglia", duration: 20, price: 12 },
      { name: "Trattamento viso anti-age", duration: 60, price: 75 },
      { name: "Linfodrenaggio", duration: 60, price: 65 },
      { name: "Pressoterapia", duration: 45, price: 40 },
      { name: "Pacchetto corpo", duration: 90, price: 95 },
      { name: "Consulenza estetica", duration: 30, price: 25 },
    ],
    staff: [
      { name: "Alessia", services: ["Pulizia viso", "Trattamento viso anti-age", "Consulenza estetica"] },
      { name: "Noemi", services: ["Epilazione gambe", "Epilazione sopracciglia"] },
      { name: "Chiara" },
    ],
    bookings: [
      { customerName: "Elisa Demo", customerPhone: "3330003001", dayOffset: 1, time: "10:00", serviceName: "Pulizia viso", staffName: "Alessia" },
      { customerName: "Federica Test", customerPhone: "3330003002", dayOffset: 1, time: "12:00", serviceName: "Epilazione gambe", staffName: "Noemi" },
      { customerName: "Anna Gialli", customerPhone: "3330003003", dayOffset: 2, time: "16:00", serviceName: "Pressoterapia", staffName: "Chiara" },
      { customerName: "Silvia Rosa", customerPhone: "3330003004", dayOffset: 3, time: "09:30", serviceName: "Trattamento viso anti-age", staffName: "Alessia" },
      { customerName: "Paola Demo", customerPhone: "3330003005", dayOffset: 4, time: "17:00", serviceName: "Linfodrenaggio", staffName: "Chiara" },
    ],
    reviews: demoReviews,
  },
  nail_salon: {
    id: "nail_salon",
    label: "Nail salon",
    shortLabel: "Nails",
    description:
      "Nail salon con semipermanente, refill e ricostruzione. La prenotazione online aiuta a riempire slot e richiami periodici.",
    openTime: "09:00",
    closeTime: "19:00",
    closedDays: [0, 1],
    services: [
      { name: "Manicure", duration: 30, price: 22 },
      { name: "Semipermanente mani", duration: 50, price: 35 },
      { name: "Refill gel", duration: 75, price: 50 },
      { name: "Ricostruzione unghie", duration: 120, price: 75 },
      { name: "Nail art semplice", duration: 20, price: 12 },
      { name: "Pedicure estetico", duration: 45, price: 35 },
      { name: "Rimozione gel", duration: 30, price: 18 },
    ],
    staff: [
      { name: "Sara", services: ["Semipermanente mani", "Refill gel", "Nail art semplice"] },
      { name: "Michela", services: ["Manicure", "Pedicure estetico", "Rimozione gel"] },
    ],
    bookings: [
      { customerName: "Greta Demo", customerPhone: "3330004001", dayOffset: 1, time: "09:00", serviceName: "Semipermanente mani", staffName: "Sara" },
      { customerName: "Valeria Test", customerPhone: "3330004002", dayOffset: 1, time: "14:30", serviceName: "Refill gel", staffName: "Sara" },
      { customerName: "Sofia Viola", customerPhone: "3330004003", dayOffset: 2, time: "11:00", serviceName: "Pedicure estetico", staffName: "Michela" },
      { customerName: "Giorgia Demo", customerPhone: "3330004004", dayOffset: 3, time: "16:00", serviceName: "Ricostruzione unghie", staffName: "Sara" },
      { customerName: "Noemi Blu", customerPhone: "3330004005", dayOffset: 4, time: "10:30", serviceName: "Manicure", staffName: "Michela" },
    ],
    reviews: demoReviews,
  },
  massage: {
    id: "massage",
    label: "Massaggiatore",
    shortLabel: "Massaggi",
    description:
      "Studio massaggi con trattamenti relax, decontratturanti e sportivi. Ogni prenotazione blocca il tempo corretto in agenda.",
    openTime: "10:00",
    closeTime: "20:00",
    breakStart: "14:00",
    breakEnd: "15:00",
    closedDays: [0],
    services: [
      { name: "Massaggio relax", duration: 60, price: 60 },
      { name: "Massaggio decontratturante", duration: 50, price: 65 },
      { name: "Massaggio sportivo", duration: 60, price: 70 },
      { name: "Linfodrenaggio", duration: 60, price: 65 },
      { name: "Trattamento cervicale", duration: 40, price: 45 },
      { name: "Massaggio coppia demo", duration: 90, price: 120 },
    ],
    staff: [
      { name: "Riccardo", services: ["Massaggio sportivo", "Massaggio decontratturante"] },
      { name: "Ilaria", services: ["Massaggio relax", "Linfodrenaggio", "Trattamento cervicale"] },
    ],
    bookings: [
      { customerName: "Nadia Demo", customerPhone: "3330005001", dayOffset: 1, time: "10:00", serviceName: "Massaggio relax", staffName: "Ilaria" },
      { customerName: "Roberto Test", customerPhone: "3330005002", dayOffset: 1, time: "17:30", serviceName: "Massaggio sportivo", staffName: "Riccardo" },
      { customerName: "Marco Verde", customerPhone: "3330005003", dayOffset: 2, time: "12:00", serviceName: "Trattamento cervicale", staffName: "Ilaria" },
      { customerName: "Laura Demo", customerPhone: "3330005004", dayOffset: 3, time: "16:00", serviceName: "Linfodrenaggio", staffName: "Ilaria" },
      { customerName: "Claudio Blu", customerPhone: "3330005005", dayOffset: 4, time: "18:00", serviceName: "Massaggio decontratturante", staffName: "Riccardo" },
    ],
    reviews: demoReviews,
  },
  personal_trainer: {
    id: "personal_trainer",
    label: "Personal trainer",
    shortLabel: "Trainer",
    description:
      "Agenda per personal trainer con sessioni singole, valutazioni e pacchetti. Il cliente sceglie lo slot e arriva già confermato.",
    openTime: "07:00",
    closeTime: "21:00",
    closedDays: [0],
    services: [
      { name: "Sessione personal training", duration: 60, price: 50 },
      { name: "Valutazione iniziale", duration: 45, price: 35 },
      { name: "Programma dimagrimento", duration: 60, price: 60 },
      { name: "Allenamento coppia", duration: 60, price: 75 },
      { name: "Check progressi", duration: 30, price: 25 },
      { name: "Consulenza nutrizione base", duration: 45, price: 40 },
    ],
    staff: [
      { name: "Davide", services: ["Sessione personal training", "Valutazione iniziale", "Check progressi"] },
      { name: "Francesca", services: ["Programma dimagrimento", "Allenamento coppia", "Consulenza nutrizione base"] },
    ],
    bookings: [
      { customerName: "Lorenzo Demo", customerPhone: "3330006001", dayOffset: 1, time: "08:00", serviceName: "Sessione personal training", staffName: "Davide" },
      { customerName: "Giada Test", customerPhone: "3330006002", dayOffset: 1, time: "18:00", serviceName: "Valutazione iniziale", staffName: "Davide" },
      { customerName: "Mauro Gialli", customerPhone: "3330006003", dayOffset: 2, time: "19:00", serviceName: "Allenamento coppia", staffName: "Francesca" },
      { customerName: "Silvia Demo", customerPhone: "3330006004", dayOffset: 3, time: "07:30", serviceName: "Check progressi", staffName: "Davide" },
      { customerName: "Carlo Verde", customerPhone: "3330006005", dayOffset: 4, time: "17:00", serviceName: "Programma dimagrimento", staffName: "Francesca" },
    ],
    reviews: demoReviews,
  },
  private_studio: {
    id: "private_studio",
    label: "Studio privato / consulenza",
    shortLabel: "Studio",
    description:
      "Studio su appuntamento per consulenze, sedute e incontri privati. Il proprietario vede subito calendario, clienti e storico.",
    openTime: "09:00",
    closeTime: "18:30",
    breakStart: "13:00",
    breakEnd: "14:00",
    closedDays: [0, 6],
    services: [
      { name: "Prima consulenza", duration: 60, price: 80 },
      { name: "Consulenza di follow-up", duration: 45, price: 60 },
      { name: "Sessione individuale", duration: 60, price: 70 },
      { name: "Pacchetto revisione", duration: 90, price: 110 },
      { name: "Check rapido", duration: 30, price: 35 },
      { name: "Incontro online", duration: 45, price: 55 },
    ],
    staff: [
      { name: "Dott. Ferri", services: ["Prima consulenza", "Consulenza di follow-up", "Sessione individuale"] },
      { name: "Silvia", services: ["Check rapido", "Incontro online", "Pacchetto revisione"] },
    ],
    bookings: [
      { customerName: "Paolo Demo", customerPhone: "3330007001", dayOffset: 1, time: "09:00", serviceName: "Prima consulenza", staffName: "Dott. Ferri" },
      { customerName: "Elena Test", customerPhone: "3330007002", dayOffset: 1, time: "11:30", serviceName: "Check rapido", staffName: "Silvia" },
      { customerName: "Gabriele Blu", customerPhone: "3330007003", dayOffset: 2, time: "15:00", serviceName: "Sessione individuale", staffName: "Dott. Ferri" },
      { customerName: "Marta Demo", customerPhone: "3330007004", dayOffset: 3, time: "10:00", serviceName: "Incontro online", staffName: "Silvia" },
      { customerName: "Nicola Test", customerPhone: "3330007005", dayOffset: 4, time: "16:00", serviceName: "Pacchetto revisione", staffName: "Silvia" },
    ],
    reviews: demoReviews,
  },
  medico: {
    id: "medico",
    label: "Studio medico",
    shortLabel: "Medico",
    description: "Studio medico con prenotazione visite specialistiche, di controllo ed esami. Meno chiamate, agenda sempre piena e organizzata.",
    openTime: "08:30",
    closeTime: "19:00",
    breakStart: "13:00",
    breakEnd: "14:30",
    closedDays: [0, 6],
    services: [
      { name: "Prima Visita Specialistica", duration: 45, price: 120 },
      { name: "Visita di Controllo", duration: 20, price: 80 },
      { name: "Visione Esami / Referti", duration: 15, price: 40 },
      { name: "Elettrocardiogramma (ECG)", duration: 30, price: 50 },
      { name: "Ecografia", duration: 30, price: 90 },
      { name: "Check-up Completo", duration: 60, price: 150 },
    ],
    staff: [{ name: "Dott. Demo" }],
    bookings: [],
    reviews: demoReviews,
  },
  nutrizionista: {
    id: "nutrizionista",
    label: "Nutrizionista",
    shortLabel: "Nutrizione",
    description: "Agenda per nutrizionista. Visite di controllo, prime visite e creazione piani alimentari. Prenota in pochi secondi.",
    openTime: "09:00",
    closeTime: "19:30",
    closedDays: [0, 6],
    services: [
      { name: "Prima Visita e Consegna Dieta", duration: 60, price: 100 },
      { name: "Controllo Mensile e Misure", duration: 30, price: 50 },
      { name: "Valutazione Bioimpedenziometrica", duration: 30, price: 40 },
      { name: "Dieta per Sportivi", duration: 60, price: 120 },
      { name: "Colloquio Conoscitivo Gratuito", duration: 15, price: 0 },
    ],
    staff: [{ name: "Dott.ssa Test" }],
    bookings: [],
    reviews: demoReviews,
  },
  tatuatore: {
    id: "tatuatore",
    label: "Studio tatuaggi",
    shortLabel: "Tattoo",
    description: "Tattoo studio con prenotazione consulenze, lavori piccoli e sedute intere. Riduce le richieste a vuoto su Instagram.",
    openTime: "11:00",
    closeTime: "20:00",
    closedDays: [0, 1],
    services: [
      { name: "Consulenza e Preventivo", duration: 30, price: 0 },
      { name: "Tatuaggio Piccolo (Minimal)", duration: 60, price: 80 },
      { name: "Tatuaggio Medio (Mezza Seduta)", duration: 120, price: 150 },
      { name: "Tatuaggio Grande (Seduta Intera)", duration: 240, price: 300 },
      { name: "Piercing", duration: 30, price: 40 },
    ],
    staff: [{ name: "Tatuatore Demo" }],
    bookings: [],
    reviews: demoReviews,
  },
  toelettatura: {
    id: "toelettatura",
    label: "Toelettatura cani",
    shortLabel: "Toelettatura",
    description: "Servizio di toelettatura cani e gatti. Appuntamenti automatizzati per taglia piccola, media e grande.",
    openTime: "09:00",
    closeTime: "18:00",
    closedDays: [0, 1],
    services: [
      { name: "Bagno e Taglio (Taglia Piccola)", duration: 60, price: 45 },
      { name: "Bagno e Taglio (Taglia Media)", duration: 75, price: 55 },
      { name: "Bagno e Taglio (Taglia Grande)", duration: 90, price: 75 },
      { name: "Solo Bagno", duration: 45, price: 30 },
      { name: "Taglio Unghie e Pulizia", duration: 15, price: 15 },
    ],
    staff: [{ name: "Toelettatore Test" }],
    bookings: [],
    reviews: demoReviews,
  },
  psicologo: {
    id: "psicologo",
    label: "Psicologo / Psicoterapeuta",
    shortLabel: "Psicologo",
    description: "Prenotazione facile e privata per percorsi terapeutici, sedute di coppia o individuali. Semplifica la gestione dello studio.",
    openTime: "09:00",
    closeTime: "20:00",
    closedDays: [0, 6],
    services: [
      { name: "Primo Colloquio Conoscitivo", duration: 60, price: 70 },
      { name: "Seduta di Supporto Psicologico", duration: 60, price: 70 },
      { name: "Psicoterapia Individuale", duration: 60, price: 80 },
      { name: "Terapia di Coppia", duration: 90, price: 120 },
    ],
    staff: [{ name: "Dott. Psicologo" }],
    bookings: [],
    reviews: demoReviews,
  },
  consulente: {
    id: "consulente",
    label: "Consulente / Freelance",
    shortLabel: "Consulente",
    description: "Gestione appuntamenti per liberi professionisti. Le call e i meeting si incastrano perfettamente nell'agenda.",
    openTime: "09:00",
    closeTime: "18:00",
    closedDays: [0, 6],
    services: [
      { name: "Consulenza Breve / Call", duration: 30, price: 60 },
      { name: "Consulenza Strategica Completa", duration: 60, price: 120 },
      { name: "Revisione Progetto", duration: 90, price: 150 },
      { name: "Affiancamento Tecnico", duration: 60, price: 100 },
    ],
    staff: [{ name: "Consulente Demo" }],
    bookings: [],
    reviews: demoReviews,
  },
};

export const demoCategoryOptions = Object.values(demoShopTemplates).map((template) => ({
  value: template.id,
  label: template.label,
  shortLabel: template.shortLabel,
}));

export function getDemoShopTemplate(category: string | null | undefined): DemoShopTemplate {
  if (category && category in demoShopTemplates) {
    return demoShopTemplates[category as DemoCategory];
  }

  return demoShopTemplates.barber;
}

export function sanitizeSlug(value: string) {
  const cleaned = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return cleaned || "negozio";
}

export function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  const nextHour = Math.floor(total / 60).toString().padStart(2, "0");
  const nextMinute = (total % 60).toString().padStart(2, "0");
  return `${nextHour}:${nextMinute}`;
}

export function dateFromOffset(dayOffset: number, closedDays: number[]) {
  const date = new Date();
  let remaining = Math.max(1, dayOffset);

  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    if (!closedDays.includes(date.getDay())) {
      remaining -= 1;
    }
  }

  return date.toISOString().split("T")[0];
}
