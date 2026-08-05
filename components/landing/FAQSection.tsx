"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Quanto costa il setup iniziale?",
    a: "Il setup è completamente gratuito se configuri il negozio in autonomia. Se invece preferisci che il nostro team faccia il lavoro per te (Setup Chiavi in Mano), puoi richiedere il servizio dedicato. In ogni caso non tratteniamo mai percentuali sulle prenotazioni.",
  },
  {
    q: "Come faccio a iniziare?",
    a: "Clicca su 'Inizia la Prova', inserisci i dati del tuo salone e in pochi minuti la tua agenda è pronta da configurare. Hai 14 giorni gratuiti per testare tutto senza inserire la carta di credito.",
  },
  {
    q: "I clienti devono scaricare un'app?",
    a: "No. I tuoi clienti prenotano direttamente dal browser cliccando sul tuo link da Instagram, Google, WhatsApp o dal sito. Niente app da installare, niente account da creare.",
  },
  {
    q: "Come gestisco turni e report per il commercialista?",
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
  {
    q: "Chi può usare questa agenda?",
    a: "NeatX è perfetto per qualsiasi professionista su appuntamento: barbieri, parrucchieri, estetiste, tattoo studio, psicologi, personal trainer e studi medici.",
  },
  {
    q: "Posso cancellare quando voglio?",
    a: "Assolutamente sì. Non ci sono contratti annuali o vincoli nascosti. Paghi l'abbonamento mensile e, se vuoi disdire, lo fai con un clic. Dal mese successivo non ti verrà addebitato nulla.",
  },
  {
    q: "Come funzionano prova gratuita, piani e servizio VIP?",
    a: "Hai 14 giorni gratuiti per configurare e provare agenda, prenotazioni e pagamenti. Poi puoi scegliere Pro (29€/mese o 290€/anno) o Elite (59€/mese o 590€/anno). Il servizio VIP (149€/mese o 1490€/anno) include anche configurazione e supporto dedicato. I promemoria WhatsApp sono temporaneamente disattivati e non consumano crediti.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="relative z-10 bg-[#050814] py-24 border-t border-[#1a2642]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Domande frequenti
          </h2>
          <p className="text-slate-400 font-medium max-w-2xl mx-auto">
            Tutto quello che devi sapere prima di iniziare.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="glow-card rounded-2xl border border-[#1a2642] bg-[#0b1221]/60 overflow-hidden transition-all duration-500 hover:border-cyan-500/30 hover:shadow-[0_4px_20px_-5px_rgba(0,180,255,0.1)] hover:-translate-y-1"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left"
              >
                <span className="text-base md:text-lg font-bold text-white pr-4">{faq.q}</span>
                <ChevronDown
                  size={20}
                  className={`text-slate-500 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-5 md:px-6 pb-5 md:pb-6 text-slate-400 leading-relaxed text-sm md:text-base border-t border-[#1a2642] pt-4">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
