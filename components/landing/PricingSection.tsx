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

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto items-start">
          {/* PIANO PRO (EVIDENZIATO) */}
          <div className="bg-[#0b1221] p-8 rounded-3xl border border-[#00b4ff] shadow-[0_0_30px_-5px_rgba(0,180,255,0.3)] relative flex flex-col md:-mt-8 transform transition-transform hover:scale-105 z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#00b4ff] to-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg">
              Più Scelto
            </div>
            <h3 className="text-xl font-bold text-[#00b4ff] mb-2">Pro</h3>
            <div className="text-5xl font-extrabold text-white mb-1">29€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>
            <div className="text-emerald-400 font-bold text-sm mb-6">290€/anno <span className="text-slate-500 font-medium text-xs">(risparmi 58€)</span></div>
            <ul className="space-y-4 mb-auto text-sm text-slate-200 font-medium">
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Appuntamenti Illimitati</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> <strong className="text-white">Promemoria WhatsApp Automatici*</strong></li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Gestione turni, orari e ferie</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Export presenze per commercialista</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Link brandizzato prenotazione</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Acconti e pagamenti Stripe</li>
            </ul>
            <Link
              href="/registrazione"
              className="mt-8 w-full block py-4 bg-gradient-to-r from-[#00b4ff] to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-xl transition-all text-center shadow-lg shadow-cyan-500/25 hover:scale-105"
            >
              Inizia Prova Gratuita
            </Link>
          </div>

          {/* PIANO ELITE */}
          <div className="glow-card bg-[#0b1221] p-8 rounded-3xl border border-purple-500/50 shadow-[0_0_20px_-5px_rgba(168,85,247,0.2)] flex flex-col transform transition-transform hover:scale-105">
            <h3 className="text-xl font-bold text-purple-400 mb-2">Elite</h3>
            <div className="text-4xl font-extrabold text-white mb-1">59€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>
            <div className="text-purple-400 font-bold text-sm mb-6">590€/anno <span className="text-slate-500 font-medium text-xs">(risparmi 118€)</span></div>
            <ul className="space-y-4 mb-auto text-sm text-slate-400 font-medium">
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Tutto del piano Pro</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> <strong className="text-purple-300">Mini-Marketing (Recupero Clienti)</strong></li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Autopilota Recensioni Google</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Multi-Staff illimitato</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Statistiche e analytics avanzati</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Onboarding VIP dedicato</li>
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
        </div>
        
        {/* BANNER TRASPARENZA SMS */}
        <div className="mt-12 max-w-4xl mx-auto bg-[#0a0f1c] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={26} />
          </div>
          <div className="text-left flex-1">
            <h4 className="text-white font-bold text-lg mb-1">* Trasparenza 100% sui costi di WhatsApp</h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-3">
              Noi non inviamo email inutili o vecchi SMS. Usiamo solo la via più diretta: <strong>WhatsApp</strong>. 
              Per azzerare i no-show inviamo messaggi veri sul telefono del cliente. Il servizio si paga <em>esclusivamente a consumo</em> tramite pacchetti ricaricabili. Non applichiamo margini nascosti.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                <span className="text-emerald-400">500</span> messaggi = 39€
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                <span className="text-emerald-400">1000</span> messaggi = 69€
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                <span className="text-emerald-400">2500</span> messaggi = 149€
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
