"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Phone, Store, ArrowRight, ShieldCheck, ChevronLeft } from "lucide-react";

export default function VipWaitingRoom() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    salone: "",
    telefono: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Invio la notifica al Syslog (che inoltra al bot Telegram)
      await fetch("/api/syslog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `🚨 NUOVO LEAD VIP! (Piano Acchiappa-Boomer)\n\nIl salone "${formData.salone}" ha appena richiesto il piano Done-For-You da 149€.\n\nTelefono: ${formData.telefono}\n\nChiamalo appena puoi per chiudere il contratto!`,
          url: "Pagina VIP",
        }),
      });

      setIsSuccess(true);
    } catch (error) {
      console.error("Errore durante l'invio:", error);
      alert("Si è verificato un errore. Riprova più tardi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col font-sans text-slate-300">
      {/* Header Semplice */}
      <header className="p-6 md:p-8 flex items-center justify-between">
        <Link href="/" className="text-white font-extrabold text-2xl tracking-tight flex items-center gap-2 hover:text-amber-400 transition-colors">
          <ChevronLeft size={24} />
          NeatX <span className="text-amber-500 text-sm font-bold bg-amber-500/20 px-2 py-0.5 rounded ml-1">VIP</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative">
        {/* Sfondo Astratto */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-xl w-full bg-[#0b1221] border border-[#1e2b4a] p-8 md:p-12 rounded-3xl shadow-2xl relative z-10 overflow-hidden">
          {/* Elemento Decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-[50px] pointer-events-none"></div>

          {isSuccess ? (
            <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-4">Richiesta Ricevuta!</h2>
              <p className="text-lg text-slate-400 mb-8">
                Hai fatto la scelta giusta per il tuo Salone. 
                Un nostro specialista VIP ti contatterà al numero <span className="text-amber-400 font-bold">{formData.telefono}</span> 
                il prima possibile durante l'orario lavorativo per configurare tutto il tuo account.
              </p>
              <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium">
                <ChevronLeft size={18} /> Torna alla Home
              </Link>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <ShieldCheck size={14} /> Servizio Esclusivo Done-For-You
              </div>
              
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
                Entra nel piano <span className="text-amber-500">Senza Pensieri</span>.
              </h1>
              
              <p className="text-slate-400 mb-8 text-lg">
                Lascia i tuoi recapiti. Noi facciamo il lavoro sporco, tu goditi i nuovi clienti. Ti chiamiamo noi per configurare tutto.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="salone" className="block text-sm font-bold text-slate-300 mb-2">Nome del tuo Salone</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Store size={18} className="text-slate-500" />
                    </div>
                    <input
                      type="text"
                      id="salone"
                      required
                      value={formData.salone}
                      onChange={(e) => setFormData({ ...formData, salone: e.target.value })}
                      className="w-full bg-[#050814] border border-[#1e2b4a] text-white rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                      placeholder="Es. Barberia Milano"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="telefono" className="block text-sm font-bold text-slate-300 mb-2">Numero di Telefono (Cellulare)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone size={18} className="text-slate-500" />
                    </div>
                    <input
                      type="tel"
                      id="telefono"
                      required
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full bg-[#050814] border border-[#1e2b4a] text-white rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                      placeholder="Es. 333 1234567"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-900 font-extrabold rounded-xl py-4 px-6 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    "Invio in corso..."
                  ) : (
                    <>
                      Richiedi Chiamata Prioritaria <ArrowRight size={20} />
                    </>
                  )}
                </button>
                
                <p className="text-center text-xs text-slate-500 mt-4">
                  I tuoi dati sono al sicuro. Ti contatteremo solo per configurare il tuo account NeatX.
                </p>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
