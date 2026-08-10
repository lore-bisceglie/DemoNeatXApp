"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_GROUPS = [
  {
    title: "Per iniziare",
    items: [
      {
        q: "Come faccio a iniziare?",
        a: "Clicca su 'Crea la tua pagina gratis', inserisci i dati della tua attività e in pochi minuti la tua agenda è pronta da configurare. Hai 14 giorni gratuiti per testare tutto senza inserire la carta di credito.",
      },
      {
        q: "I clienti devono scaricare un'app?",
        a: "No. I tuoi clienti prenotano direttamente dal browser cliccando sul tuo link da Instagram, Google, WhatsApp o dal sito. Niente app da installare, niente account da creare.",
      },
      {
        q: "Chi può usare NeatX?",
        a: "NeatX è pensato per chi lavora su appuntamento: barbieri, parrucchieri, estetiste, Tattoo Studio, psicologi, personal trainer e studi medici.",
      },
    ],
  },
  {
    title: "Pagina e organizzazione",
    items: [
      {
        q: "Come gestisco turni e report?",
        a: "Imposti gli orari fissi e registri ferie o permessi nel calendario del collaboratore. L'agenda aggiorna gli slot in tempo reale e puoi scaricare un export ordinato delle ore e degli appuntamenti.",
      },
      {
        q: "Posso usare il mio dominio?",
        a: "Sì, tramite la dashboard puoi collegare il tuo dominio personalizzato (es. prenota.tuosalone.it) per rendere la tua pagina ancora più professionale.",
      },
      {
        q: "Come gestisco pagamenti e acconti?",
        a: "Puoi richiedere acconti parziali o pagamenti completi al momento della prenotazione. I fondi finiscono direttamente sul tuo conto Stripe in tempo reale — nessuna trattenuta extra da parte nostra.",
      },
    ],
  },
  {
    title: "Costi e abbonamento",
    items: [
      {
        q: "Quanto costa il setup iniziale?",
        a: "Il setup è gratuito se configuri NeatX in autonomia. Se preferisci delegarlo, puoi richiedere la configurazione assistita. In ogni caso NeatX non trattiene percentuali sulle prenotazioni.",
      },
      {
        q: "Come funzionano prova e piani?",
        a: "Hai 14 giorni gratuiti per configurare e provare agenda, prenotazioni e pagamenti. Poi puoi scegliere Pro (29€/mese o 290€/anno) oppure Elite (59€/mese o 590€/anno). La configurazione assistita è un servizio opzionale. I promemoria WhatsApp sono temporaneamente disattivati e non consumano crediti.",
      },
      {
        q: "Posso cancellare quando voglio?",
        a: "Sì. Non ci sono vincoli nascosti. Puoi gestire o disdire l'abbonamento dalla tua area; dal periodo successivo non ti verrà addebitato altro.",
      },
    ],
  },
];

export default function FAQSection() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <section className="relative z-10 border-t border-[#1a2642] bg-[#050814] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-extrabold text-white md:text-5xl">
            Le risposte, senza giri di parole.
          </h2>
          <p className="mx-auto max-w-2xl font-medium text-slate-400">
            Prova, prezzi, pagamenti e funzionamento: scegli l&apos;argomento che ti interessa.
          </p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-3">
          {FAQ_GROUPS.map((group, groupIndex) => (
            <div key={group.title} className="rounded-3xl border border-[#1a2642] bg-[#0b1221]/50 p-3">
              <h3 className="px-3 pb-4 pt-3 text-sm font-extrabold uppercase tracking-[0.18em] text-cyan-300">
                {group.title}
              </h3>

              <div className="space-y-2">
                {group.items.map((faq, itemIndex) => {
                  const itemId = [groupIndex, itemIndex].join("-");
                  const isOpen = openItem === itemId;

                  return (
                    <div
                      key={faq.q}
                      className="overflow-hidden rounded-2xl border border-[#1a2642] bg-[#050814]/70 transition-colors hover:border-cyan-500/30"
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenItem(isOpen ? null : itemId)}
                        className="flex w-full items-center justify-between p-4 text-left"
                      >
                        <span className="pr-3 text-sm font-bold leading-snug text-white">{faq.q}</span>
                        <ChevronDown
                          size={18}
                          className={
                            "flex-shrink-0 text-slate-500 transition-transform duration-300 " +
                            (isOpen ? "rotate-180" : "")
                          }
                        />
                      </button>
                      <div
                        className={
                          "overflow-hidden transition-all duration-300 " +
                          (isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0")
                        }
                      >
                        <div className="border-t border-[#1a2642] px-4 pb-4 pt-3 text-sm leading-relaxed text-slate-400">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
