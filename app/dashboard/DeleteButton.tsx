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
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    try {
      const noCache = Date.now();
      let res = await fetch(`/api/actions/delete?id=${appointmentId}&t=${noCache}`);
      if (!res.ok) {
        res = await fetch(`/api/action/delete?id=${appointmentId}&t=${noCache}`);
      }

      if (!isSpecial && phone && phone !== "0000000000") {
        
        const wantsWhatsApp = window.confirm(`L'appuntamento è stato rimosso e il posto è libero.\nVuoi avvisare ${customerName} su WhatsApp?`);

        if (wantsWhatsApp) {
          const cleanPhone = phone.replace(/\D/g, "");
          
          // 🛡️ MESSAGGIO BULLETPROOF CON LINK
          const text = encodeURIComponent(
            `[!] *APPUNTAMENTO ANNULLATO*\n\n` +
            `Ciao *${customerName}*, ti informiamo che il tuo appuntamento da Messaggio Demo NeatX del *${date}* alle ore *${time}* è stato annullato.\n\n` +
            `Per prenotare un nuovo orario, clicca sul link qui sotto e scegli il posto in autonomia:\n` +
            `-> https://neatx-mito.vercel.app \n\n` +
            `_(Per favore, usa solo il link per prenotare. Non rispondere a questo messaggio automatizzato)_`
          );
          
          window.location.href = `https://wa.me/39${cleanPhone}?text=${text}`;
        } else {
          window.location.reload();
        }

      } else {
        window.location.reload();
      }
    } catch (error) {
      alert("Errore di rete durante l'eliminazione. Riprova!");
      setLoading(false);
    }
  };

  return (
    <button 
      type="button" 
      onClick={handleClick}
      disabled={loading}
      className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-lg transition text-sm disabled:opacity-50"
    >
      {loading ? "⏳..." : (isSpecial ? "Sblocca" : "Elimina")}
    </button>
  );
}