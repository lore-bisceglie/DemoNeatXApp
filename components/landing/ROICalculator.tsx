"use client";

import { useState } from "react";
import Link from "next/link";
import { LineChart } from "lucide-react";

type ROICalculatorProps = {
  show: boolean;
  onClose: () => void;
};

export default function ROICalculator({ show, onClose }: ROICalculatorProps) {
  const [clientsPerMonth, setClientsPerMonth] = useState(300);
  const [avgTicket, setAvgTicket] = useState(35);

  const noShowRate = 0.15;
  const lostRevenue = Math.round(clientsPerMonth * avgTicket * noShowRate);
  const recoveredRevenue = Math.round(lostRevenue * 0.90);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0b1221] border border-[#00b4ff]/40 p-6 sm:p-8 rounded-3xl shadow-2xl shadow-cyan-900/30 max-w-lg w-full relative animate-in zoom-in-95 duration-300">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white bg-[#131c31] w-8 h-8 rounded-full flex items-center justify-center font-bold"
        >
          ✕
        </button>
        
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center mb-4">
            <LineChart size={27} />
          </div>
          <h3 className="text-2xl font-extrabold text-white mb-2">Quanti soldi perdi per i No-Show?</h3>
          <p className="text-slate-400 text-sm">Scopri quanto incasso extra genererai attivando i promemoria automatici NeatX.</p>
        </div>

        <div className="space-y-6 mb-8">
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="text-sm font-bold text-slate-300">Clienti al mese</label>
              <span className="text-xl font-extrabold text-[#00b4ff]">{clientsPerMonth}</span>
            </div>
            <input 
              type="range" 
              min="50" max="1000" step="50"
              value={clientsPerMonth}
              onChange={(e) => setClientsPerMonth(Number(e.target.value))}
              className="w-full accent-[#00b4ff] h-2 bg-[#131c31] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="text-sm font-bold text-slate-300">Scontrino medio</label>
              <span className="text-xl font-extrabold text-emerald-400">{avgTicket} €</span>
            </div>
            <input 
              type="range" 
              min="10" max="150" step="5"
              value={avgTicket}
              onChange={(e) => setAvgTicket(Number(e.target.value))}
              className="w-full accent-emerald-400 h-2 bg-[#131c31] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="bg-[#050814] rounded-2xl border border-[#1a2642] p-5 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-400 text-sm font-medium">Perdita attuale stimata (15% assenze):</span>
            <span className="text-red-400 font-bold line-through">-{lostRevenue} €/mese</span>
          </div>
          
          <div className="h-px w-full bg-[#1a2642] my-4"></div>
          
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-500 mb-1">IL TUO RECUPERO CON NEATX</div>
              <div className="text-slate-300 text-xs">Ricavi extra stimati</div>
            </div>
            <div className="text-3xl font-extrabold text-white">
              +{recoveredRevenue} <span className="text-lg text-slate-500">€/m</span>
            </div>
          </div>
        </div>

        <Link 
          href="#pricing"
          onClick={onClose}
          className="w-full block text-center py-4 bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-emerald-900/40 hover:scale-105"
        >
          Voglio questi {recoveredRevenue}€ in più
        </Link>
      </div>
    </div>
  );
}
