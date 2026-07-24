"use client";
import { useState } from "react";
import { HelpCircle, X, ChevronRight, ChevronLeft } from "lucide-react";

const steps = [
  {
    title: "👋 Benvenuto nella tua Dashboard",
    content: "Questa è la tua centrale operativa. Da qui gestisci prenotazioni, clienti, staff e impostazioni del tuo salone.",
  },
  {
    title: "📋 Team",
    content: "Clicca su 'Team' per aggiungere i tuoi collaboratori, assegnare servizi e gestire i turni tramite Google Sheets.",
  },
  {
    title: "📖 Rubrica",
    content: "La 'Rubrica' mostra tutti i tuoi clienti con le loro note e preferenze. Puoi cercare per nome o numero di telefono.",
  },
  {
    title: "⚙️ Gestione",
    content: "Dal menu 'Gestione' puoi modificare i servizi, gli orari di apertura, collegare Stripe per i pagamenti online e gestire le sedi.",
  },
  {
    title: "📎 Link Prenotazione",
    content: "Copia il link pubblico del tuo salone (es. tuonome.neatx.store) e condividilo con i clienti su WhatsApp, Instagram e social. È il TUO link personalizzato!",
  },
  {
    title: "⏰ Consiglio: Intervalli di 15 minuti",
    content: "Imposta la durata dei servizi in multipli di 15 minuti (15, 30, 45, 60...) per massimizzare gli slot disponibili ed evitare 'buchi' nell'agenda.",
  },
  {
    title: "🚀 Sei pronto!",
    content: "Puoi riaprire questa guida quando vuoi cliccando sul bottone '?' in alto. Buon lavoro!",
  },
];

export default function TutorialButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setStep(0); }}
        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 text-sm font-bold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap"
        title="Guida rapida"
      >
        <HelpCircle size={16} /> Tutorial
      </button>
    );
  }

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={() => setOpen(false)} />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[440px] bg-[#0b1221] border border-[#1a2642] rounded-2xl p-6 z-[101] shadow-2xl">
        {/* Close */}
        <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors">
          <X size={18} />
        </button>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-[#00b4ff]" : "bg-[#1a2642]"}`}
            />
          ))}
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-white mb-3">{current.title}</h3>
        <p className="text-sm text-slate-300 leading-relaxed mb-6">{current.content}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={isFirst}
            className={`flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${isFirst ? "text-slate-600 cursor-not-allowed" : "text-slate-300 hover:text-white hover:bg-white/5"}`}
          >
            <ChevronLeft size={14} /> Indietro
          </button>

          {isLast ? (
            <button
              onClick={() => setOpen(false)}
              className="bg-[#00b4ff] text-[#050814] font-bold text-sm px-5 py-2 rounded-xl hover:bg-cyan-400 transition-colors"
            >
              Ho capito! ✨
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-1 bg-[#00b4ff]/10 text-[#00b4ff] font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#00b4ff]/20 transition-colors"
            >
              Avanti <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
