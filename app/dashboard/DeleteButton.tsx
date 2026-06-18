"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({ 
  appointmentId, 
  customerName, 
  phone, 
  date, 
  time, 
  isSpecial 
}: { 
  appointmentId: string; 
  customerName: string; 
  phone: string; 
  date: string; 
  time: string; 
  isSpecial: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter(); 

  const handleConfirm = async () => {
    setLoading(true);

    try {
      // 1. Elimina fisicamente dal database
      const noCache = Date.now();
      let res = await fetch(`/api/actions/delete?id=${appointmentId}&t=${noCache}`);
      if (!res.ok) {
        res = await fetch(`/api/action/delete?id=${appointmentId}&t=${noCache}`);
      }

      // 2. Selezioniamo cosa fare: Modal Premium o Refresh Diretto
      if (!isSpecial && phone && phone !== "0000000000") {
        setShowModal(false);
        setLoading(false);
        setShowDemoModal(true); // Apriamo la simulazione
      } else {
        setShowModal(false);
        setLoading(false);
        router.refresh(); // Se è una pausa, si aggiorna e scompare subito
      }

    } catch (error) {
      alert("Errore di rete durante l'eliminazione. Riprova!");
      setLoading(false);
      setShowModal(false);
    }
  };

  return (
    <>
      <button 
        type="button" 
        onClick={() => setShowModal(true)}
        className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-lg transition text-sm disabled:opacity-50"
      >
        {isSpecial ? "Sblocca" : "Elimina"}
      </button>

      {/* 1. MODALE DI CONFERMA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
          <div className="bg-[#0b1221] border border-red-500/30 p-8 rounded-3xl shadow-2xl shadow-red-900/20 max-w-sm w-full text-center transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="text-4xl mb-4">{isSpecial ? "🔓" : "🗑️"}</div>
            
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
              {isSpecial ? "Sblocca Orario" : "Elimina Appuntamento"}
            </h3>
            
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {isSpecial 
                ? "Vuoi rimuovere questo blocco? L'orario tornerà disponibile." 
                : <>Vuoi annullare l'appuntamento di <strong>{customerName}</strong> del {date} alle {time}?</>
              }
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowModal(false)} 
                disabled={loading}
                className="w-full bg-[#131c31] hover:bg-[#1a2642] text-white border border-[#1e2b4a] font-bold py-3 rounded-xl transition"
              >
                Annulla
              </button>
              
              <button 
                onClick={handleConfirm} 
                disabled={loading} 
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-red-900/20 disabled:opacity-50"
              >
                {loading ? "Attendere..." : (isSpecial ? "Sblocca" : "Elimina")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 🚀 MODALE DI SIMULAZIONE DEMO (UX PREMIUM) */}
      {showDemoModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
          <div className="bg-[#0b1221] border border-red-500/30 p-8 rounded-3xl shadow-2xl shadow-red-900/20 max-w-sm w-full text-center transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Simulazione Annullamento</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              L'appuntamento è stato rimosso dal database. Nella versione reale, si aprirebbe automaticamente WhatsApp con questo messaggio pronto per <strong>{customerName}</strong>:<br/><br/>
              <span className="italic text-slate-300">"[!] APPUNTAMENTO ANNULLATO - Ciao {customerName}, ti informiamo che il tuo appuntamento del {date} alle {time} è stato annullato..."</span>
            </p>
            <button 
              onClick={() => {
                setShowDemoModal(false);
                router.refresh(); // Il ricaricamento della pagina avviene solo DOPO aver chiuso il modale!
              }} 
              className="w-full bg-[#131c31] hover:bg-[#1a2642] text-white border border-[#1e2b4a] hover:border-red-500/50 font-bold py-3 rounded-xl transition shadow-lg"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}
    </>
  );
}