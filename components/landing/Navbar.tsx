"use client";

import Link from "next/link";
import { LogIn, Menu, X } from "lucide-react";
import { useState } from "react";

type NavbarProps = {
  onOpenRoi?: () => void;
};

export default function Navbar({ onOpenRoi }: NavbarProps = {}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="w-full md:w-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-extrabold tracking-tight notranslate">
          <span className="text-white">Neat</span>
          <span className="text-[#00b4ff]">X</span>
        </Link>
        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/registrazione"
            className="rounded-full border border-[#00b4ff]/30 bg-[#00b4ff]/10 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-cyan-300"
          >
            Prova
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-slate-300 hover:text-white p-1 ml-1"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      <div className="hidden md:flex gap-8 text-sm font-bold text-slate-400">
        <a href="#features" className="hover:text-white transition-colors">Funzionalità</a>
        {onOpenRoi ? (
          <button onClick={onOpenRoi} className="hover:text-white transition-colors font-extrabold text-[#00b4ff]">Calcola ROI</button>
        ) : (
          <Link href="/?showRoi=true" className="hover:text-white transition-colors font-extrabold text-[#00b4ff]">Calcola ROI</Link>
        )}
        <a href="#pricing" className="hover:text-white transition-colors">Prezzi</a>
        <Link href="/blog" className="hover:text-white transition-colors text-purple-400">Blog</Link>
      </div>

      <div className="hidden md:flex items-center gap-3">
        <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-[#1e2b4a] px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-slate-300 hover:border-[#00b4ff]/40 hover:text-white transition-colors">
          <LogIn size={14} />
          Accedi
        </Link>
        <Link href="/registrazione" className="rounded-full bg-[#00b4ff] px-5 py-2 text-xs font-extrabold uppercase tracking-widest text-[#03111f] hover:bg-cyan-300 transition-colors">
          Prova gratis
        </Link>
      </div>

      {isMobileMenuOpen && (
        <div className="grid grid-cols-2 gap-2 w-full md:hidden text-xs font-extrabold animate-in slide-in-from-top-4 fade-in duration-200 mt-2">
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="rounded-2xl border border-[#1a2642] bg-[#0b1221]/80 px-4 py-3 text-center text-slate-300">
            Funzionalità
          </a>
          {onOpenRoi ? (
            <button
              type="button"
              onClick={() => { onOpenRoi(); setIsMobileMenuOpen(false); }}
              className="rounded-2xl border border-[#00b4ff]/25 bg-[#00b4ff]/10 px-4 py-3 text-center text-cyan-300"
            >
              Calcola ROI
            </button>
          ) : (
            <Link href="/?showRoi=true" onClick={() => setIsMobileMenuOpen(false)} className="rounded-2xl border border-[#00b4ff]/25 bg-[#00b4ff]/10 px-4 py-3 text-center text-cyan-300">
              Calcola ROI
            </Link>
          )}
          <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="rounded-2xl border border-[#1a2642] bg-[#0b1221]/80 px-4 py-3 text-center text-slate-300">
            Prezzi
          </a>
          <Link href="/blog" onClick={() => setIsMobileMenuOpen(false)} className="rounded-2xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-center text-purple-300">
            Blog
          </Link>
          <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="rounded-2xl border border-[#1a2642] bg-[#0b1221]/80 px-4 py-3 text-center text-slate-300">
            Accedi
          </Link>
          <Link href="/registrazione" onClick={() => setIsMobileMenuOpen(false)} className="rounded-2xl border border-[#00b4ff]/25 bg-[#00b4ff]/10 px-4 py-3 text-center text-cyan-300">
            Prova gratis
          </Link>
        </div>
      )}
    </nav>
  );
}
