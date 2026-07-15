"use client";

import { MousePointerClick, BellRing, WalletCards, CalendarSync, FileSpreadsheet, MapPin } from "lucide-react";

const FEATURE_CARDS = [
  {
    icon: MousePointerClick,
    title: "Prenotazione in pochi tocchi",
    description:
      "Il cliente apre il link, sceglie servizio, giorno e orario. Tu non devi rispondere ogni volta su WhatsApp.",
    accent: "text-cyan-400",
    border: "hover:border-cyan-400/50",
  },
  {
    icon: BellRing,
    title: "Promemoria WhatsApp automatici",
    description:
      "NeatX invia i promemoria direttamente su WhatsApp alle 18:00 del giorno prima. Se WhatsApp non funziona, scatta l'SMS di backup.",
    accent: "text-emerald-400",
    border: "hover:border-emerald-400/50",
  },
  {
    icon: WalletCards,
    title: "Acconti prima del servizio",
    description:
      "Per i servizi importanti puoi richiedere caparra o pagamento completo con Stripe prima della conferma.",
    accent: "text-purple-400",
    border: "hover:border-purple-400/50",
  },
  {
    icon: CalendarSync,
    title: "Gestione Staff 360°",
    description:
      "Sincronizza i turni da Google Sheets o imposta ferie e pause pranzo direttamente nel pannello. L'agenda mostrerà solo gli slot realmente liberi.",
    accent: "text-blue-400",
    border: "hover:border-blue-400/50",
  },
  {
    icon: MapPin,
    title: "Gestione Sedi Multiple",
    description:
      "Hai più di un salone? Gestisci tutte le sedi da un unico account. Il sistema blocca i dipendenti condivisi per evitare doppie prenotazioni impossibili.",
    accent: "text-amber-400",
    border: "hover:border-amber-400/50",
  },
  {
    icon: FileSpreadsheet,
    title: "Foglio presenze per il commercialista",
    description:
      "Un click e NeatX genera un CSV con lo spaccato giornaliero di ogni dipendente: ore teoriche, ferie, permessi e totale mensile.",
    accent: "text-rose-400",
    border: "hover:border-rose-400/50",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative z-10 bg-[#0b1221] py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-cyan-300 mb-5">
            <span className="text-[14px]">⚡</span>
            Il sistema operativo dell&apos;agenda
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Meno messaggi. Più slot pieni.</h2>
          <p className="text-slate-400 font-medium max-w-2xl mx-auto">NeatX non è solo una pagina di prenotazione: è un gestionale completo che copre dal primo click del cliente fino alla busta paga dei dipendenti.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURE_CARDS.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className={`glow-card bg-[#050814] p-8 rounded-3xl border border-[#1a2642] shadow-2xl group ${feature.border} transition-all duration-300`}>
                <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 ${feature.accent} group-hover:scale-110 transition-transform`}>
                  <Icon size={26} />
                </div>
                <h3 className="text-xl font-extrabold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
