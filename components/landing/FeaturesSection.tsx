// Server Component — nessun hook o stato, riduce il bundle JS client

import { MousePointerClick, Globe2, WalletCards, CalendarSync, FileSpreadsheet, MapPin, BellRing, UserRoundCheck } from "lucide-react";

const FEATURE_CARDS = [
  {
    icon: MousePointerClick,
    title: "I clienti prenotano da soli",
    description:
      "Il cliente apre il link, sceglie servizio, giorno e orario. Tu non devi interrompere il lavoro per rispondere a ogni richiesta.",
    accent: "text-cyan-400",
    border: "border-cyan-400/25 hover:border-cyan-400/55",
  },
  {
    icon: Globe2,
    title: "Una pagina con il tuo nome",
    description:
      "Servizi, disponibilità e identità della tua attività in un unico link da condividere dove vuoi.",
    accent: "text-emerald-400",
    border: "border-emerald-400/25 hover:border-emerald-400/55",
  },
  {
    icon: WalletCards,
    title: "Acconti quando servono",
    description:
      "Per i servizi importanti puoi richiedere caparra o pagamento completo con Stripe prima della conferma.",
    accent: "text-purple-400",
    border: "border-purple-400/25 hover:border-purple-400/55",
  },
  {
    icon: CalendarSync,
    title: "Un'area per ogni persona del team",
    description:
      "Imposti i turni. Ogni collaboratore apre il suo link dal telefono, vede solo la propria agenda e richiede ferie o permessi. Tu approvi e gli slot si aggiornano subito.",
    accent: "text-blue-400",
    border: "border-blue-400/25 hover:border-blue-400/55",
  },
  {
    icon: UserRoundCheck,
    title: "I buchi si riempiono da soli",
    description:
      "Se un cliente disdice, NeatX avvisa automaticamente il primo cliente in lista d'attesa per quel giorno. Il messaggio parte solo quando c'è davvero un posto libero.",
    accent: "text-cyan-400",
    border: "border-cyan-400/25 hover:border-cyan-400/55",
  },
  {
    icon: MapPin,
    title: "Più sedi, una sola visione",
    description:
      "Hai più di un salone? Gestisci tutte le sedi da un unico account. Il sistema blocca i dipendenti condivisi per evitare doppie prenotazioni impossibili.",
    accent: "text-amber-400",
    border: "border-amber-400/25 hover:border-amber-400/55",
  },
  {
    icon: FileSpreadsheet,
    title: "Ore pronte per il commercialista",
    description:
      "Un clic e NeatX genera un CSV con lo spaccato giornaliero di ogni dipendente: ore teoriche, ferie, permessi e totale mensile.",
    accent: "text-rose-400",
    border: "border-rose-400/25 hover:border-rose-400/55",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative z-10 bg-[#0b1221] py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-cyan-300 mb-5">
            <span className="text-[14px]">⚡</span>
            Più di una semplice agenda
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Meno no-show. Più appuntamenti pieni.</h2>
          <p className="text-slate-400 font-medium max-w-2xl mx-auto">NeatX collega prenotazioni, promemoria, lista d&apos;attesa e report: tutto quello che serve per lavorare meglio, in un unico posto.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURE_CARDS.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className={`glow-card bg-[#050814] p-8 rounded-3xl border shadow-2xl group ${feature.border} transition-all duration-500 hover:-translate-y-2 hover:shadow-cyan-900/20`}>
                <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 ${feature.accent} group-hover:scale-110 transition-transform`}>
                  <Icon size={26} />
                </div>
                <h3 className="text-xl font-extrabold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl items-start gap-4 rounded-2xl border border-slate-700 bg-[#050814] p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-400/15 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.28)]">
            <BellRing size={23} strokeWidth={2.4} />
          </div>
          <div>
            <h3 className="font-extrabold text-white">La tua agenda lavora anche quando tu lavori</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              I promemoria automatici aiutano a ridurre i no-show. Se si libera un posto, NeatX avvisa il primo cliente in lista d&apos;attesa: tu non devi controllare la lista e puoi concentrarti sul lavoro.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
