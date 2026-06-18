"use client";

import { useState } from "react";

export default function ReminderButton({ name, date, time, phone }: { name: string, date: string, time: string, phone: string }) {
  const [showModal, setShowModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleConfirm = () => {
    // 🛡️ Nessun redirect. Chiudiamo il modale di conferma e apriamo quello di simulazione.
    setShowModal(false);
    setShowDemoModal(true);
  };

  return (
    <>
      <button 
        type="button"
        onClick={() => setShowModal(true)}
        className="text-purple-400 hover:text-purple-300 text-xs font-bold px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition border border-purple-500/20 hover:border-purple-500/40 ml-2"
      >
        Promemoria
      </button>

      {/* 1. MODALE DI CONFERMA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
          <div className="bg-[#0b1221] border border-[#00b4ff]/30 p-8 rounded-3xl shadow-2xl shadow-cyan-900/20 max-w-sm w-full text-center transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Invia Promemoria</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Vuoi avvisare <strong>{name}</strong> su WhatsApp per l'appuntamento del {date} alle {time}?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowModal(false)} 
                className="w-full bg-[#131c31] hover:bg-[#1a2642] text-white border border-[#1e2b4a] font-bold py-3 rounded-xl transition"
              >
                Annulla
              </button>
              <button 
                onClick={handleConfirm} 
                className="w-full bg-[#00b4ff] hover:bg-cyan-400 text-[#050814] font-bold py-3 rounded-xl transition shadow-lg shadow-cyan-500/20"
              >
                Invia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 🚀 MODALE DI SIMULAZIONE DEMO (UX PREMIUM) */}
      {showDemoModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
          <div className="bg-[#0b1221] border border-[#00b4ff]/30 p-8 rounded-3xl shadow-2xl shadow-cyan-900/20 max-w-sm w-full text-center transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Simulazione Promemoria</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Nella versione reale, si aprirebbe automaticamente WhatsApp con questo messaggio pronto da inviare a <strong>{name}</strong>:<br/><br/>
              <span className="italic text-slate-300">"Ciao {name}, ti confermo l'appuntamento presso il salone il {date} alle {time}. Ti aspetto!"</span>
            </p>
            <button 
              onClick={() => setShowDemoModal(false)} 
              className="w-full bg-[#131c31] hover:bg-[#1a2642] text-white border border-[#1e2b4a] hover:border-[#00b4ff]/50 font-bold py-3 rounded-xl transition shadow-lg"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}
    </>
  );
}