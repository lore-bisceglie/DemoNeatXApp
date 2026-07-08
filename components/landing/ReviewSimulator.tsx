"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Star, X } from "lucide-react";
import IPhone17Pro from "./IPhone17Pro";

export default function ReviewSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0); // 0: hidden, 1: SMS arriving, 2: Rating screen, 3: Google Maps simulated, 4: Private feedback

  const triggerSimulation = () => {
    setIsOpen(true);
    setStep(0);
    // Simulate SMS arriving after 1 second
    setTimeout(() => setStep(1), 800);
  };

  const handleRating = (stars: number) => {
    if (stars >= 4) {
      setStep(3); // Go to Google Maps
    } else {
      setStep(4); // Go to Private Feedback
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-12">
      
      <div className="text-center mb-8 max-w-2xl px-4">
        <h2 className="text-3xl font-extrabold text-white mb-4">
          Autopilot <span className="text-yellow-400">Recensioni 5 Stelle</span> ⭐
        </h2>
        <p className="text-slate-400">
          Il 90% dei tuoi clienti è felice, ma si dimentica di lasciarti una recensione. 
          NeatX invia un SMS automatico 2 ore dopo l'appuntamento. 
          Se il cliente dà 5 stelle, finisce su Google. Se ne dà 2, il feedback resta privato. Questa funzione è opzionale e disattivabile in qualsiasi momento dal pannello impostazioni.
        </p>
      </div>

      <button 
        onClick={triggerSimulation}
        className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all transform hover:scale-105 flex items-center gap-2"
      >
        <MessageSquare size={20} />
        Prova l'Esperienza Post-Taglio
      </button>

      {/* MODAL / OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <IPhone17Pro>
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-20 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>

            {/* STEP 1: Fake SMS Notification */}
            {step === 1 && (
              <div className="flex-1 bg-gradient-to-br from-slate-100 to-slate-200 flex items-start pt-16 px-4 w-full h-full">
                <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-lg animate-in slide-in-from-top-10 duration-500 cursor-pointer" onClick={() => setStep(2)}>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-[#00b4ff] rounded-full flex items-center justify-center text-white">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 flex justify-between">
                        MESSAGGI <span className="font-normal text-slate-500">adesso</span>
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-1">Acconciature Demo</p>
                      <p className="text-sm text-slate-700 leading-snug mt-0.5">
                        Grazie per esserci venuto a trovare! Come ti sei trovato oggi? Clicca qui per farcelo sapere: ntx.io/rev ✂️
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Rating Screen */}
            {step === 2 && (
              <div className="flex-1 bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 w-full h-full">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl mb-6">
                  💈
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Acconciature Demo</h3>
                <p className="text-slate-500 mb-8">Come valuti la tua esperienza di oggi?</p>
                
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      onClick={() => handleRating(star)}
                      className="text-slate-300 hover:text-yellow-400 hover:scale-110 transition-all"
                    >
                      <Star size={40} className="fill-current" />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-12">Powered by NeatX</p>
              </div>
            )}

            {/* STEP 3: Google Maps Success */}
            {step === 3 && (
              <div className="flex-1 bg-white flex flex-col items-center justify-center p-6 text-center animate-in slide-in-from-bottom-10 duration-500 w-full h-full">
                <svg viewBox="0 0 48 48" className="w-16 mb-6"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.97-5.97z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/></svg>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Sei fantastico!</h3>
                <p className="text-slate-600 mb-8">Siamo felici che ti sia piaciuto! Condividi questa tua recensione a 5 stelle su Google per aiutarci a crescere.</p>
                <div className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  Pubblica su Google
                </div>
                <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm font-semibold border border-green-200">
                  ✅ Vantaggio Salone: La recensione 5 stelle va pubblica.
                </div>
              </div>
            )}

            {/* STEP 4: Private Feedback */}
            {step === 4 && (
              <div className="flex-1 bg-white flex flex-col p-6 animate-in slide-in-from-bottom-10 duration-500 w-full h-full">
                <h3 className="text-xl font-bold text-slate-900 mb-2 mt-8">Ci dispiace!</h3>
                <p className="text-slate-600 mb-6 text-sm">Cosa è andato storto? Scrivici un messaggio per aiutarci a migliorare.</p>
                <textarea 
                  className="w-full h-32 border border-slate-300 rounded-xl p-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Scrivi qui il tuo problema..."
                ></textarea>
                <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold mt-4">
                  Invia Feedback Privato
                </button>
                <div className="mt-8 p-4 bg-orange-50 text-orange-700 rounded-lg text-sm font-semibold border border-orange-200">
                  🛡️ Vantaggio Salone: Il cliente sfoga la rabbia qui. Questa recensione NON finisce su Google.
                </div>
              </div>
            )}
    </IPhone17Pro>
        </div>
      )}

    </div>
  );
}
