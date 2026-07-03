"use client";

import { useState } from "react";

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApplicationModal({ isOpen, onClose }: ApplicationModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0b1221] border border-purple-500/40 p-6 sm:p-8 rounded-3xl shadow-2xl shadow-purple-900/30 max-w-lg w-full relative animate-in zoom-in-95 duration-300">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white bg-[#131c31] w-8 h-8 rounded-full flex items-center justify-center font-bold"
        >
          ✕
        </button>

        {!isSuccess ? (
          <>
            <div className="mb-8 text-center">
              <div className="text-purple-400 text-xs font-extrabold tracking-widest uppercase mb-2">Piano Elite</div>
              <h3 className="text-2xl font-extrabold text-white mb-2">Candidatura Ufficiale</h3>
              <p className="text-slate-400 text-sm">Il piano Elite richiede un setup manuale dal nostro team. Rispondi a 3 brevi domande per verificare i requisiti.</p>
            </div>

            <div className="w-full bg-[#131c31] h-1.5 rounded-full mb-8 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>

            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h4 className="text-lg font-bold text-white text-center">Quanti membri dello staff gestisci?</h4>
                <div className="space-y-3">
                  {['Sono da solo (1)', 'Piccolo Team (2-3)', 'Salone Strutturato (4-7)', 'Impero (8+)'].map((opt) => (
                    <button key={opt} onClick={nextStep} className="w-full p-4 rounded-xl border border-[#1a2642] bg-[#050814] hover:border-purple-500/50 hover:bg-purple-900/10 text-white font-medium transition-all text-left flex justify-between items-center group">
                      {opt} <span className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h4 className="text-lg font-bold text-white text-center">Qual è il tuo più grande problema oggi?</h4>
                <div className="space-y-3">
                  {['Troppi No-Show (Assenze)', 'Telefono che squilla sempre', 'Agenda cartacea caotica', 'Voglio solo incassare di più'].map((opt) => (
                    <button key={opt} onClick={nextStep} className="w-full p-4 rounded-xl border border-[#1a2642] bg-[#050814] hover:border-purple-500/50 hover:bg-purple-900/10 text-white font-medium transition-all text-left flex justify-between items-center group">
                      {opt} <span className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </button>
                  ))}
                </div>
                <button onClick={prevStep} className="text-xs text-slate-500 hover:text-white w-full text-center mt-4">Torna indietro</button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h4 className="text-lg font-bold text-white text-center">Lascia i tuoi recapiti</h4>
                <p className="text-xs text-slate-400 text-center mb-4">Se supererai la selezione, verrai ricontattato in 24h.</p>
                <div className="space-y-4">
                  <input type="text" placeholder="Nome del Salone" className="w-full p-4 rounded-xl bg-[#050814] border border-[#1a2642] text-white focus:border-purple-500 outline-none" />
                  <input type="tel" placeholder="Numero di Telefono (WhatsApp)" className="w-full p-4 rounded-xl bg-[#050814] border border-[#1a2642] text-white focus:border-purple-500 outline-none" />
                </div>
                <div className="flex gap-4 mt-6">
                  <button onClick={prevStep} className="px-6 py-4 rounded-xl text-slate-400 hover:text-white font-medium">Indietro</button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-500 hover:to-purple-300 text-white font-bold rounded-xl py-4 shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all flex justify-center items-center">
                    {isSubmitting ? <span className="animate-pulse">Analisi in corso...</span> : 'Invia Candidatura'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 animate-in zoom-in-95 duration-500">
            <div className="text-6xl mb-4">👑</div>
            <h3 className="text-2xl font-extrabold text-white mb-2">Candidatura Ricevuta</h3>
            <p className="text-slate-400 mb-8">Abbiamo ricevuto la tua richiesta. Il nostro team sta analizzando i dati del tuo salone. Se il tuo profilo è idoneo, riceverai un messaggio WhatsApp entro 24 ore.</p>
            <button onClick={onClose} className="w-full bg-[#131c31] border border-[#1a2642] hover:bg-[#1a2642] text-white font-bold rounded-xl py-4 transition-all">
              Torna alla Home
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
