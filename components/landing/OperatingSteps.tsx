"use client";

import { Sparkles, CalendarCheck2, LineChart, LockKeyhole, Clock3, ShieldCheck, Star, UsersRound } from "lucide-react";

const OPERATING_STEPS = [
  {
    icon: Sparkles,
    title: "Metti in ordine servizi e orari",
    text: "Inserisci servizi e orari base. Se hai uno staff, gestisci turni, riposi e ferie direttamente nel calendario nativo: NeatX costruisce l'agenda reale.",
  },
  {
    icon: UsersRound,
    title: "Dai a ciascuno la sua agenda",
    text: "Dal suo link personale vede turni e clienti assegnati, poi chiede ferie o permessi dal telefono. Tu approvi con un tocco: gli orari si bloccano subito per i clienti.",
  },
  {
    icon: CalendarCheck2,
    title: "Condividi il tuo link",
    text: "Mettilo nella bio di Instagram, su Google o mandalo su WhatsApp. I clienti vedranno solo gli orari che tu decidi di lasciare liberi.",
  },
  {
    icon: LineChart,
    title: "Le prenotazioni arrivano in agenda",
    text: "I clienti scelgono servizio e orario, poi pagano l'acconto quando serve. Tu ritrovi l'agenda piena senza aver mai risposto al telefono.",
  },
];

const PROOF_ITEMS = [
  { icon: Clock3, title: "Meno interruzioni", text: "Le richieste diventano appuntamenti senza obbligarti a rispondere mentre lavori." },
  { icon: ShieldCheck, title: "Orari sempre coerenti", text: "NeatX mostra ai clienti soltanto le disponibilità compatibili con le tue regole." },
  { icon: Star, title: "Acconti quando servono", text: "Per i servizi che lo richiedono, puoi proteggere il tuo tempo con un acconto online." },
];

export default function OperatingSteps() {
  return (
    <section className="relative z-10 bg-[#050814] py-24 border-t border-[#1a2642]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-purple-300 mb-6">
              <LockKeyhole size={14} />
              LE TUE REGOLE, GIÀ APPLICATE
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
              I clienti prenotano. Tu resti sul lavoro.
            </h2>
            <p className="text-slate-400 leading-relaxed text-lg mb-8">
              Il tuo link mostra servizi e orari disponibili, raccoglie la scelta del cliente e aggiorna l&apos;agenda. Tu continui a occuparti del tuo lavoro.
            </p>
            <div className="grid sm:grid-cols-3 lg:grid-cols-1 gap-4">
              {PROOF_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-4 rounded-2xl border border-[#1a2642] bg-[#0b1221]/70 p-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300 flex-shrink-0">
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="font-extrabold text-white">{item.title}</div>
                      <div className="text-sm text-slate-400 leading-relaxed">{item.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent blur-3xl"></div>
            <div className="relative rounded-3xl border border-white/10 bg-[#0b1221]/80 backdrop-blur-xl p-5 md:p-8 shadow-2xl">
              <div className="grid gap-4">
                {OPERATING_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="relative rounded-2xl border border-[#1a2642] bg-[#050814]/80 p-5 md:p-6">
                      <div className="flex gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-[#00b4ff]/10 border border-[#00b4ff]/20 text-[#00b4ff] flex items-center justify-center flex-shrink-0">
                          <Icon size={23} />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Step {index + 1}</div>
                          <h3 className="text-xl font-extrabold text-white mb-2">{step.title}</h3>
                          <p className="text-slate-400 leading-relaxed">{step.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
