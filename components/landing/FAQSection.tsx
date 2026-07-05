"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Quanto costa il setup iniziale?",
    a: "Il setup è una tantum di 300€ e include la configurazione completa della tua agenda: servizi, prezzi, orari, staff, link brandizzato e integrazione pagamenti. Dopo il setup paghi solo l'abbonamento mensile — zero commissioni.",
  },
  {
    q: "Come faccio a iniziare?",
    a: "Clicca su 'Prova Gratis 7 Giorni', inserisci il nome della tua attività e scegli la categoria. In 30 secondi hai la tua agenda pronta con servizi pre-caricati. Nessuna carta di credito richiesta.",
  },
  {
    q: "I clienti devono scaricare un'app?",
    a: "No. I tuoi clienti prenotano direttamente dal browser cliccando sul tuo link da Instagram, Google, WhatsApp o dal sito. Niente app da installare, niente account da creare.",
  },
  {
    q: "Posso usare il mio dominio?",
    a: "Sì, tramite dashboard puoi configurare un dominio personalizzato (es. prenota.tuosalone.it) così il link è ancora più professionale.",
  },
  {
    q: "Come gestisco pagamenti e acconti?",
    a: "Puoi richiedere acconti o pagamenti completi prima della prenotazione tramite Stripe. I soldi vanno direttamente sul tuo conto corrente — nessuna trattenuta, zero commissioni.",
  },
  {
    q: "Funziona per barbieri, estetiste, psicologi...?",
    a: "Sì, NeatX è progettato per qualsiasi professionista che lavora su appuntamento: barbieri, parrucchieri, estetiste, centri beauty, tattoo studio, psicologi, consulenti, fisioterapisti, studi medici e molto altro.",
  },
  {
    q: "Posso cancellare quando voglio?",
    a: "Sì, non ci sono vincoli né contratti annuali. Paghi solo il mese in corso. Se vuoi sospendere, lo fai in un click dalla dashboard.",
  },
  {
    q: "Come funziona il periodo di prova?",
    a: "Attivi la prova gratuita di 7 giorni senza carta di credito. Hai accesso completo a tutte le funzionalità del piano Pro. Alla scadenza, se vuoi continuare, paghi l'abbonamento. Se non fa per te, il tuo link e i tuoi dati restano al sicuro per 30 giorni.",
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
              className="rounded-2xl border border-[#1a2642] bg-[#0b1221]/60 overflow-hidden transition-all duration-300 hover:border-[#1e2b4a]"
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
