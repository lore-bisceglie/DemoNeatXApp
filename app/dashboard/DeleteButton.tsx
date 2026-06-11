"use client";

import { useState } from "react";

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
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);

    try {
      // 1. Elimina dal database (Svuota lo slot)
      const noCache = Date.now();
      let res = await fetch(`/api/actions/delete?id=${appointmentId}&t=${noCache}`);
      if (!res.ok) {
        res = await fetch(`/api/action/delete?id=${appointmentId}&t=${noCache}`);
      }

      // 2. Controllo: Manda il messaggio solo se è un cliente reale
      if (!isSpecial && phone && phone !== "0000000000") {
        const cleanPhone = phone.replace(/\D/g, "");
        
        const text = encodeURIComponent(
          `[!] *APPUNTAMENTO ANNULLATO*\n\n` +
          `Ciao *${customerName}*, ti informiamo che il tuo appuntamento presso la *Demo NeatX* del *${date}* alle ore *${time}* è stato annullato.\n\n` +
          `Per prenotare un nuovo orario, clicca sul link qui sotto e scegli il posto in autonomia:\n` +
          `-> https://demo-neatx-app.vercel.app \n\n` +
          `_(Per favore, usa solo il link per prenotare. Non rispondere a questo messaggio automatizzato)_`
        );
        
        window.location.href = `https://wa.me/39${cleanPhone}?text=${text}`;
      } else {
        window.location.reload();
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

      {/* POPUP STILE NEATX IDENTICO AL PROMEMORIA MA ROSSO */}
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
    </>
  );
}