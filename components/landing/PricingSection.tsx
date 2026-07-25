"use client";

import { Check, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function PricingSection() {
  return (
    <section id="pricing" className="relative z-10 bg-[#050814] py-24 border-y border-[#1a2642]">
      <div className="max-w-6xl mx-auto px-6">
        
        <div className="mb-20 max-w-3xl mx-auto bg-gradient-to-r from-emerald-500/10 to-emerald-900/20 border border-emerald-500/30 rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 blur-[60px]"></div>
          <h2 className="text-3xl font-extrabold text-white mb-3 relative z-10">0% Commissioni. <span className="text-emerald-400">Zero trattenute.</span></h2>
          <p className="text-emerald-100/70 font-medium relative z-10 text-lg">
            A differenza delle altre piattaforme che si tengono il 20-30% sui tuoi incassi, con NeatX i soldi sono tutti tuoi. Paghi solo l&apos;abbonamento mensile, e basta.
          </p>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Scegli il piano per il tuo Salone</h2>
          <p className="text-slate-400 font-medium">L&apos;investimento più intelligente per la tua attività.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {/* PIANO PRO */}
          <div className="bg-[#0b1221] p-8 rounded-3xl border border-[#1e2b4a] flex flex-col transform transition-transform hover:scale-105 z-10 mt-0 md:mt-4">
            <h3 className="text-xl font-bold text-[#00b4ff] mb-2">Pro</h3>
            <div className="text-4xl font-extrabold text-white mb-1">29€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>
            <div className="text-emerald-400 font-bold text-sm mb-6">290€/anno <span className="text-slate-500 font-medium text-xs">(risparmi 58€)</span></div>
            <ul className="space-y-4 mb-auto text-sm text-slate-400 font-medium">
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Appuntamenti Illimitati</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-slate-500" /> <strong className="text-slate-500">Promemoria WhatsApp: temporaneamente disattivati*</strong></li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Gestione turni, orari e ferie</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Export presenze per commercialista</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Link brandizzato prenotazione</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Acconti e pagamenti Stripe</li>
            </ul>
            <Link
              href="/registrazione"
              className="mt-8 w-full block py-4 bg-transparent border border-[#00b4ff]/50 hover:bg-[#00b4ff]/10 text-[#00b4ff] font-extrabold rounded-xl transition-all text-center hover:scale-105"
            >
              Inizia Prova Gratuita
            </Link>
          </div>

          {/* PIANO ELITE (EVIDENZIATO - L'ESCA CHE VOGLIAMO VENDERE DI PIU') */}
          <div className="glow-card bg-[#0b1221] p-8 rounded-3xl border-2 border-purple-500 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] flex flex-col md:-mt-4 transform transition-transform hover:scale-105 relative z-20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              Il Più Scelto
            </div>
            <h3 className="text-xl font-bold text-purple-400 mb-2">Elite</h3>
            <div className="text-5xl font-extrabold text-white mb-1">59€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>
            <div className="text-purple-400 font-bold text-sm mb-6">590€/anno <span className="text-slate-500 font-medium text-xs">(risparmi 118€)</span></div>
            <ul className="space-y-4 mb-auto text-sm text-slate-200 font-medium">
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Tutto del piano Pro</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> <strong className="text-purple-300">Mini-Marketing (Recupero Clienti)</strong></li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Autopilota Recensioni Google</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Multi-Staff illimitato</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Statistiche e analytics avanzati</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Onboarding dedicato</li>
            </ul>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/registrazione"
                className="w-full py-4 block bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-extrabold rounded-xl transition-all text-center shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-105"
              >
                Inizia Prova Gratuita
              </Link>
            </div>
          </div>

          {/* PIANO VIP (DONE-FOR-YOU) - L'ACCHIAPPA BOOMER / DECOY */}
          <div className="bg-gradient-to-b from-amber-500/10 to-[#0b1221] p-8 rounded-3xl border border-amber-500/30 flex flex-col transform transition-transform hover:scale-105 z-10 mt-0 md:mt-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-[50px] pointer-events-none"></div>
            <h3 className="text-xl font-bold text-amber-500 mb-2 flex items-center gap-2">Senza Pensieri <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] uppercase tracking-wider border border-amber-500/30">VIP</span></h3>
            <div className="text-4xl font-extrabold text-white mb-1">149€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>
            <div className="text-amber-500 font-bold text-sm mb-6">1490€/anno <span className="text-slate-500 font-medium text-xs">(risparmi 298€)</span></div>
            <ul className="space-y-4 mb-auto text-sm text-slate-300 font-medium relative z-10">
              <li className="flex items-center gap-2"><Check size={16} className="text-amber-500" /> Tutto del piano Elite</li>
              <li className="flex items-start gap-2"><Check size={16} className="text-amber-500 shrink-0 mt-0.5" /> <span><strong className="text-amber-300">Configurazione 100% "Done-For-You"</strong> (carichiamo noi il tuo listino e i tuoi servizi)</span></li>
              <li className="flex items-center gap-2"><Check size={16} className="text-amber-500" /> Ottimizzazione profilo Google (MyBusiness)</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-amber-500" /> Assistenza telefonica diretta dedicata</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-amber-500" /> Consulente personale sempre a disposizione</li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 relative z-10">
              <Link
                href="/vip"
                className="w-full py-4 block bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-900 font-extrabold rounded-xl transition-all text-center shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105"
              >
                Voglio il pacchetto VIP
              </Link>
              <p className="text-center text-xs text-amber-500/80 font-bold uppercase tracking-widest mt-2 animate-pulse">
                ⏳ Solo 5 posti al mese disponibili
              </p>
            </div>
          </div>
        </div>
        
        {/* BANNER TRASPARENZA SMS */}
        <div className="mt-12 max-w-4xl mx-auto bg-[#0a0f1c] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={26} />
          </div>
          <div className="text-left flex-1">
            <h4 className="text-white font-bold text-lg mb-1">* Stato promemoria WhatsApp</h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-3">
              Gli invii automatici sono temporaneamente disattivati. Finché la funzione resta disattivata non parte alcun messaggio e non viene consumato alcun credito. I pacchetti torneranno acquistabili solo dopo la riattivazione verificata del servizio.
            </p>
            <div className="hidden flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                <span className="text-emerald-400">500</span> messaggi = 29€
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                <span className="text-emerald-400">1000</span> messaggi = 55€
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                <span className="text-emerald-400">2000</span> messaggi = 99€
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
