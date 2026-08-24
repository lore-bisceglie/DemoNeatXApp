"use client";

import { Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import ScrollReveal from "@/components/landing/ScrollReveal";

export default function PricingSection() {
  return (
    <section id="pricing" className="relative z-10 bg-[#050814] py-24 border-y border-[#1a2642]">
      <div className="max-w-6xl mx-auto px-6">
        
        <ScrollReveal direction="up">
          <div className="glow-card mb-20 max-w-3xl mx-auto bg-gradient-to-r from-emerald-500/10 to-emerald-900/20 border border-emerald-500/30 rounded-3xl p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 blur-[60px] animate-pulse-slow"></div>
            <h2 className="text-3xl font-extrabold text-white mb-3 relative z-10">I tuoi incassi <span className="text-emerald-400">restano tuoi.</span></h2>
            <p className="text-emerald-100/70 font-medium relative z-10 text-lg">
              NeatX non trattiene percentuali sulle prenotazioni. Paghi l&apos;abbonamento scelto; gli incassi dei clienti restano alla tua attività.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Due piani. Nessuna commissione. Nessuna sorpresa.</h2>
            <p className="text-slate-400 font-medium">Pro per partire con tutto in ordine. Elite per team, più sedi e strumenti avanzati.</p>
            <p className="mt-4 text-sm font-semibold text-emerald-300">14 giorni gratis · nessuna carta richiesta · cancelli quando vuoi</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 max-w-4xl mx-auto items-start md:grid-cols-2">
          {/* PIANO PRO */}
          <ScrollReveal direction="left">
          <div className="glow-card bg-[#0b1221] p-8 rounded-3xl border border-[#1e2b4a] flex flex-col transform transition-transform hover:scale-105 z-10 mt-0 md:mt-4 h-full">
            <h3 className="text-xl font-bold text-[#00b4ff] mb-2">Pro</h3>
            <div className="text-4xl font-extrabold text-white mb-1">29€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>
            <div className="text-emerald-400 font-bold text-sm mb-6">290€/anno <span className="text-slate-500 font-medium text-xs">(risparmi 58€)</span></div>
            <ul className="space-y-4 mb-auto text-sm text-slate-400 font-medium">
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Appuntamenti illimitati</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Promemoria WhatsApp automatici</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Gestione turni, orari e ferie</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Export presenze per commercialista</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Link brandizzato prenotazione</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Acconti e pagamenti Stripe</li>
            </ul>
            <Link
              href="/registrazione"
              className="mt-8 w-full block py-4 bg-transparent border border-[#00b4ff]/50 hover:bg-[#00b4ff]/10 text-[#00b4ff] font-extrabold rounded-xl transition-all text-center hover:scale-105"
            >
              Crea la tua pagina gratis
            </Link>
          </div>
          </ScrollReveal>

          {/* PIANO ELITE (EVIDENZIATO - L'ESCA CHE VOGLIAMO VENDERE DI PIU') */}
          <ScrollReveal direction="up" className="z-20 md:-mt-4">
          <div className="glow-card bg-[#0b1221] p-8 rounded-3xl border-2 border-purple-500 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] flex flex-col md:-mt-4 transform transition-all duration-500 hover:scale-[1.07] hover:shadow-[0_0_50px_-10px_rgba(168,85,247,0.5)] relative z-20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(168,85,247,0.8)] hover:scale-105 transition-all">
              Per team e più sedi
            </div>
            <h3 className="text-xl font-bold text-purple-400 mb-2">Elite</h3>
            <div className="text-5xl font-extrabold text-white mb-1">59€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>
            <div className="text-purple-400 font-bold text-sm mb-6">590€/anno <span className="text-slate-500 font-medium text-xs">(risparmi 118€)</span></div>
            <ul className="space-y-4 mb-auto text-sm text-slate-200 font-medium">
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Tutto del piano Pro</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> <strong className="text-purple-300">Mini-marketing (recupero clienti)</strong></li>
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
                Crea la tua pagina gratis
              </Link>
            </div>
          </div>
          </ScrollReveal>
        </div>

        {/* COSTI MESSAGGI WHATSAPP */}
        <ScrollReveal direction="up">
          <div className="glow-card mt-12 max-w-4xl mx-auto bg-[#0a0f1c] border border-emerald-500/25 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500 animate-pulse-slow"></div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={26} />
            </div>
            <div className="text-left flex-1">
              <h4 className="text-white font-bold text-lg mb-1">Trasparenza 100% sui costi di WhatsApp</h4>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">
                I promemoria WhatsApp partono automaticamente prima dell&apos;appuntamento e usano i crediti messaggio del tuo negozio. Paghi solo a consumo, tramite pacchetti ricaricabili: nessun costo nascosto.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300"><span className="text-emerald-400">500</span> messaggi = 29€</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300"><span className="text-emerald-400">1000</span> messaggi = 55€</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-300"><span className="text-emerald-400">2000</span> messaggi = 99€</span>
              </div>
              <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] px-4 py-3 text-xs leading-relaxed text-slate-400">
                <span className="font-bold text-emerald-300">Quanto durano?</span>{" "}
                Con circa 10 appuntamenti al giorno e un messaggio per appuntamento: <span className="text-slate-300">500 crediti ≈ 2 mesi</span>, <span className="text-slate-300">1000 ≈ 3 mesi</span>, <span className="text-slate-300">2000 ≈ 6 mesi</span>. La durata varia in base agli appuntamenti effettivi.
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up">
          <div className="mx-auto mt-20 max-w-3xl text-center">
            <div className="mb-4 text-xs font-extrabold uppercase tracking-[0.25em] text-amber-400">
              Vuoi delegare anche la configurazione?
            </div>
            <h3 className="text-3xl font-extrabold text-white">NeatX configurato insieme a noi.</h3>
            <p className="mt-4 font-medium text-slate-400">
              Un servizio opzionale per chi preferisce partire con listino, impostazioni e profilo già configurati.
            </p>
          </div>
        </ScrollReveal>

        <div className="mx-auto mt-8 max-w-4xl">
          {/* SERVIZIO OPZIONALE DI CONFIGURAZIONE */}
          <ScrollReveal direction="right">
          <div className="glow-card bg-gradient-to-b from-amber-500/10 to-[#0b1221] p-8 rounded-3xl border border-amber-500/30 flex flex-col transform transition-transform hover:scale-105 z-10 mt-0 md:mt-4 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-[50px] pointer-events-none animate-pulse-slow"></div>
            <h3 className="text-xl font-bold text-amber-500 mb-2 flex items-center gap-2">Configurazione assistita <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] uppercase tracking-wider border border-amber-500/30">Servizio opzionale</span></h3>
            <div className="text-4xl font-extrabold text-white mb-1">149€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>
            <div className="text-amber-500 font-bold text-sm mb-6">1490€/anno <span className="text-slate-500 font-medium text-xs">(risparmi 298€)</span></div>
            <ul className="space-y-4 mb-auto text-sm text-slate-300 font-medium relative z-10">
              <li className="flex items-center gap-2"><Check size={16} className="text-amber-500" /> Tutto del piano Elite</li>
              <li className="flex items-start gap-2"><Check size={16} className="text-amber-500 shrink-0 mt-0.5" /> <span><strong className="text-amber-300">Configuriamo noi listino, servizi e impostazioni iniziali</strong></span></li>
              <li className="flex items-center gap-2"><Check size={16} className="text-amber-500" /> Ottimizzazione profilo Google (MyBusiness)</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-amber-500" /> Assistenza telefonica diretta dedicata</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-amber-500" /> Consulente personale sempre a disposizione</li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 relative z-10">
              <Link
                href="/vip"
                className="w-full py-4 block bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-900 font-extrabold rounded-xl transition-all text-center shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105"
              >
                Richiedi la configurazione assistita
              </Link>
              <p className="text-center text-xs text-amber-500/80 font-bold uppercase tracking-widest mt-2">
                Supporto dedicato su richiesta
              </p>
            </div>
          </div>
          </ScrollReveal>
        </div>
        
      </div>
    </section>
  );
}
