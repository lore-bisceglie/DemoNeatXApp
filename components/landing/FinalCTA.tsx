"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="relative z-10 bg-[#0b1221] py-24 border-y border-[#1a2642] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 relative z-10">
        Pronto a riempire la tua agenda?
      </h2>
      <p className="text-slate-400 text-lg mb-10 max-w-2xl relative z-10">
        Tocca con mano l&apos;esperienza che vedranno i tuoi clienti: prenotazione veloce, agenda ordinata e meno tempo perso in chat.
      </p>
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
        <Link 
          href="/registrazione"
          className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-extrabold rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all text-xl flex items-center justify-center gap-3 hover:scale-105 hover:-translate-y-1 group"
        >
          Prova Gratis 7 Giorni
          <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link 
          href="/demo"
          className="px-8 py-4 bg-[#131c31]/80 hover:bg-[#1a2642] border border-[#1e2b4a] text-white font-extrabold rounded-2xl transition-all text-lg flex items-center justify-center gap-2 hover:border-[#00b4ff]/50"
        >
          Esplora la demo
        </Link>
      </div>
    </section>
  );
}
