"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import FloatingPhone from "./FloatingPhone";

const HERO_METRICS = [
  { value: "24/7", label: "prenotazioni attive" },
  { value: "0%", label: "commissioni sui clienti" },
  { value: "1 click", label: "export commercialista" },
];

const TRUST_POINTS = [
  "Pagina prenotazioni generata in automatico",
  "Turni staff sincronizzati da Google Sheet",
  "Ore scaricabili per il commercialista",
];

export default function HeroSection() {
  return (
    <main className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-10 md:pt-20 pb-20 flex flex-col items-center text-center">
      
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-extrabold tracking-widest uppercase mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:bg-cyan-500/20 transition-all cursor-default">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        Prova gratis con negozio demo funzionante
      </div>

      <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight max-w-5xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
        Vedi il tuo negozio online <br className="hidden md:block" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b4ff] to-purple-500 animate-pulse">
          già funzionante
        </span>
      </h1>

      <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-3xl leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        NeatX è la tua agenda online brandizzata: i clienti prenotano in totale autonomia, pagano l&apos;acconto se serve e ricevono promemoria senza farti perdere tempo al telefono.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        {TRUST_POINTS.map((point) => (
          <div key={point} className="flex items-center justify-center gap-2 rounded-2xl border border-[#1a2642] bg-[#0b1221]/70 px-4 py-3 text-sm font-semibold text-slate-300">
            <BadgeCheck size={16} className="text-emerald-400 flex-shrink-0" />
            <span>{point}</span>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 relative z-20">
        <Link 
          href="/registrazione"
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-extrabold rounded-2xl shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] transition-all text-lg flex items-center justify-center gap-2 hover:scale-105 hover:-translate-y-1"
        >
          Registrati gratis in 60 secondi
          <ArrowRight size={20} />
        </Link>
        <Link
          href="/demo"
          className="w-full sm:w-auto px-8 py-4 bg-[#131c31]/80 backdrop-blur-md hover:bg-[#1a2642] border border-[#1e2b4a] text-white font-extrabold rounded-2xl transition-all text-lg flex items-center justify-center gap-2 hover:border-[#00b4ff]/50 shadow-lg shadow-cyan-900/10"
        >
          Esplora la demo
          <ArrowRight size={20} />
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-3 gap-3 w-full max-w-2xl">
        {HERO_METRICS.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5">
            <div className="text-2xl md:text-3xl font-extrabold text-white">{metric.value}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">{metric.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-16 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-8 relative z-20">
        
        {/* 3D FLOATING IPHONE */}
        <div className="w-full lg:w-1/3 flex justify-center lg:justify-end">
          <FloatingPhone />
        </div>
        
        {/* 3D GLASSMORPHISM MOCKUP */}
        <div className="w-full lg:w-2/3 relative animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 delay-500 perspective-1000">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00b4ff] to-purple-600 rounded-3xl blur-[80px] opacity-20 animate-pulse"></div>
        <div className="relative w-full aspect-video bg-[#0b1221]/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col transform hover:rotate-x-12 hover:scale-[1.02] transition-all duration-700 ease-out group cursor-crosshair">
          
          {/* Header Mockup */}
          <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-black/20">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="mx-auto bg-black/40 px-32 py-1 rounded-md text-[10px] text-slate-500 font-mono tracking-widest border border-white/5">
              www.neatx.store/admin
            </div>
          </div>

          {/* Body Mockup */}
          <div className="flex-1 p-6 flex flex-col gap-6 relative">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Incassi Mese</div>
                <div className="text-4xl font-extrabold text-white">€ 4.250,00 <span className="text-[#00b4ff] text-xl">↑ 24%</span></div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div> Live
              </div>
            </div>
            
            <div className="flex-1 flex items-end gap-2 px-4 h-full relative">
              <div className="absolute inset-0 flex flex-col justify-between opacity-10">
                <div className="border-b border-white w-full h-0"></div>
                <div className="border-b border-white w-full h-0"></div>
                <div className="border-b border-white w-full h-0"></div>
              </div>
              {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-[#00b4ff]/20 to-[#00b4ff]/80 rounded-t-md border-t border-[#00b4ff] relative group-hover:bg-[#00b4ff] transition-all duration-500 ease-in-out" style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }}>
                </div>
              ))}
            </div>
          </div>

        </div>
        </div>
      </div>
    </main>
  );
}
