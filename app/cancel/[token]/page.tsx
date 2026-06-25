"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function CancelPage() {
  const params = useParams();
  const token = params.token as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (token) {
      fetch(`/api/cancel?token=${token}`)
        .then(res => res.json())
        .then(data => {
          setAppointment(data.appointment);
          setLoading(false);
        });
    }
  }, [token]);

  const handleCancel = async () => {
    setCanceling(true);
    const res = await fetch("/api/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });

    if (res.ok) {
      const [year, month, day] = appointment.date.split("-");
      const displayDate = `${day}/${month}/${year}`;
      
      const text = encodeURIComponent(
        `Ciao Demo NeatX, ti avviso che ho appena annullato il mio appuntamento del *${displayDate}* alle *${appointment.time}* tramite l'app.`
      );
      
      // 🚨 HACK iOS: Forza l'apertura automatica di WhatsApp ignorando i blocchi
      const whatsappUrl = `https://wa.me/393480480942?text=${text}`;
      const link = document.createElement("a");
      link.href = whatsappUrl;
      link.target = "_top";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Rimanda il browser in background alla home page con il banner verde
      setTimeout(() => {
        window.location.href = "/?canceled=true";
      }, 500);

    } else {
      alert("Si è verificato un errore di connessione.");
      setCanceling(false);
    }
  };

  // 1. CARICAMENTO
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4">
        <span className="text-4xl animate-spin mb-4">🌿</span>
        <p className="text-slate-400 font-medium animate-pulse">Ricerca appuntamento...</p>
      </div>
    );
  }

  // 2. APPUNTAMENTO GIÀ ANNULLATO O NON TROVATO
  if (!appointment) {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4">
        <div className="bg-[#0b1221] border border-[#1e2b4a] p-8 rounded-3xl shadow-xl max-w-sm w-full text-center">
          <span className="text-5xl block mb-4">👻</span>
          <h2 className="text-white font-extrabold text-xl mb-2">Appuntamento non trovato</h2>
          <p className="text-slate-400 text-sm mb-6">Questo appuntamento non esiste più. Probabilmente è già stato annullato in precedenza.</p>
          <Link href="/" className="bg-[#131c31] border border-[#1e2b4a] text-white font-bold py-3 px-6 rounded-xl transition hover:bg-[#1e2b4a] block w-full">
            Torna alla Home
          </Link>
        </div>
      </div>
    );
  }

  const [year, month, day] = appointment.date.split("-");
  const displayDate = `${day}/${month}/${year}`;

  // 3. SCHERMATA DI CONFERMA INIZIALE (Tema Demo NeatX)
  return (
    <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4 text-slate-200 selection:bg-emerald-500/30">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-500 opacity-[0.03] blur-[100px] pointer-events-none rounded-full"></div>

      <div className="bg-[#0b1221] border border-red-900/30 p-8 rounded-3xl shadow-2xl shadow-red-900/10 max-w-sm w-full text-center relative z-10">
        
        <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <span className="text-2xl">⚠️</span>
        </div>

        <h2 className="text-white font-extrabold text-xl mb-2">Sei sicuro di voler annullare?</h2>
        
        <div className="bg-[#131c31] border border-[#1e2b4a] rounded-xl p-4 my-6 text-left shadow-inner">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Dettagli Appuntamento</p>
          <p className="text-white font-bold capitalize">{appointment.customerName}</p>
          <p className="text-emerald-400 font-bold text-lg mt-1">{appointment.time} <span className="text-sm font-medium text-slate-400">({displayDate})</span></p>
        </div>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Annullando perderai questo posto e il sistema aprirà WhatsApp per avvisare Demo NeatX.
        </p>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleCancel}
            disabled={canceling}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {canceling ? "Annullamento in corso..." : "Sì, Annulla Appuntamento"}
          </button>
          
          <Link 
            href="/"
            className="w-full bg-[#131c31] border border-[#1e2b4a] text-white hover:bg-[#1e2b4a] font-bold py-3 rounded-xl transition block"
          >
            No, ci ho ripensato
          </Link>
        </div>

      </div>
    </div>
  );
}