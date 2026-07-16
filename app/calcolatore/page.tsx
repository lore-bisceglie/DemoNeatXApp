"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, AlertTriangle, TrendingDown, DollarSign } from "lucide-react";

export default function CalcolatorePage() {
  const [appointments, setAppointments] = useState(150);
  const [ticket, setTicket] = useState(25);
  const [email, setEmail] = useState("");
  
  const commissionRate = 0.25; // 25% Treatwell / Fresha media
  const monthlyRevenue = appointments * ticket;
  const monthlyLoss = monthlyRevenue * commissionRate;
  const yearlyLoss = monthlyLoss * 12;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Inoltra l'utente alla registrazione passando l'email (se supportato, altrimenti lo reindirizza e basta)
      window.location.href = `/registrazione?email=${encodeURIComponent(email)}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] text-slate-200 font-sans selection:bg-[#00b4ff]/30 flex flex-col items-center justify-center p-4">
      
      <div className="max-w-xl w-full">
        {/* Intestazione */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 mb-6">
            <Calculator className="text-rose-400" size={32} />
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Il Calcolatore di <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-500">Sprechi</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Scopri quanto stai letteralmente regalando ogni anno ai portali a commissione.
          </p>
        </div>

        {/* Card Calcolatore */}
        <div className="bg-[#0b1221] border border-[#1a2642] rounded-3xl p-6 sm:p-10 shadow-2xl shadow-rose-900/10 relative overflow-hidden">
          {/* Effetto sfondo */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-rose-500/10 blur-[80px] pointer-events-none"></div>

          <div className="space-y-8 relative z-10">
            
            {/* Slider Appuntamenti */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-bold text-white flex items-center gap-2">
                  <TrendingDown size={18} className="text-slate-400" />
                  Appuntamenti dai portali (al mese)
                </label>
                <span className="font-black text-xl text-[#00b4ff]">{appointments}</span>
              </div>
              <input 
                type="range" 
                min="10" max="500" step="10"
                value={appointments} 
                onChange={(e) => setAppointments(parseInt(e.target.value))}
                className="w-full h-2 bg-[#131c31] rounded-lg appearance-none cursor-pointer accent-[#00b4ff]"
              />
            </div>

            {/* Slider Ticket Medio */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-bold text-white flex items-center gap-2">
                  <DollarSign size={18} className="text-slate-400" />
                  Scontrino medio a cliente (€)
                </label>
                <span className="font-black text-xl text-emerald-400">{ticket}€</span>
              </div>
              <input 
                type="range" 
                min="10" max="150" step="5"
                value={ticket} 
                onChange={(e) => setTicket(parseInt(e.target.value))}
                className="w-full h-2 bg-[#131c31] rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            <div className="pt-8 border-t border-[#1a2642]">
              <p className="text-center text-slate-400 font-bold mb-2 uppercase tracking-widest text-xs">I soldi che ti stanno rubando in un anno</p>
              <div className="text-center">
                <span className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-rose-400 to-red-600 drop-shadow-sm">
                  {yearlyLoss.toLocaleString('it-IT')}€
                </span>
              </div>
              
              <div className="mt-4 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="text-rose-400 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-rose-300 font-medium">
                  Questo calcolo si basa su una commissione media del 25%. Questi sono soldi che fatturi TU, ma che incassano LORO.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Lead Capture */}
        <div className="mt-8 bg-gradient-to-br from-[#131c31] to-[#0f192b] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-cyan-900/20">
          <h3 className="text-xl font-extrabold text-white mb-2">Smetti di finanziare la concorrenza.</h3>
          <p className="text-slate-400 mb-6 text-sm">
            Passa a NeatX: l'agenda online definitiva a Zero Commissioni sui tuoi clienti. Riprenditi i tuoi {yearlyLoss.toLocaleString('it-IT')}€.
          </p>

          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              placeholder="La tua email professionale" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-[#050814] border border-[#1a2642] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            />
            <button 
              type="submit"
              className="bg-cyan-400 hover:bg-cyan-300 text-[#050814] font-extrabold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Azzera gli sprechi <ArrowRight size={18} />
            </button>
          </form>
          <div className="mt-4 text-xs font-bold text-slate-500">
            Nessuna carta di credito richiesta. 14 giorni gratis.
          </div>
        </div>

      </div>
    </div>
  );
}
