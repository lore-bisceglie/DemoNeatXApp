'use client';

import { useState } from 'react';
import Link from 'next/link';
import StripeCheckoutButton from './StripeCheckoutButton';

interface PaywallContentProps {
  tenantId: string;
  slug: string;
  publicUrl: string;
  currentPlan?: string;
  isTrial?: boolean;
}

export default function PaywallContent({ tenantId, slug, publicUrl, currentPlan, isTrial }: PaywallContentProps) {
  const [annual, setAnnual] = useState(false);

  return (
    <main className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-6 text-white selection:bg-cyan-500/30">

      {/* Bottone torna alla dashboard */}
      <div className="w-full max-w-4xl mb-6">
        <Link
          href={`/t/${slug}/admin`}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors font-medium group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          Torna alla Dashboard
        </Link>
      </div>

      <div className="mb-10 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-3xl shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          🔒
        </div>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-300">
          {currentPlan === 'pro'
            ? 'Passa al piano Elite per sbloccare tutte le funzionalità'
            : isTrial
              ? 'Il tuo periodo di prova sta per scadere'
              : 'Il tuo periodo di prova è terminato'}
        </p>
        <h1 className="text-3xl font-extrabold sm:text-5xl mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          {currentPlan === 'pro' ? 'Potenzia il tuo piano' : 'Scegli il piano per il tuo Salone'}
        </h1>
        <p className="text-slate-400 font-medium">L&apos;investimento più intelligente per la tua attività.</p>
      </div>

      {/* Banner valore: visibilità Google + zero commissioni */}
      <div className="mb-8 w-full max-w-4xl rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-[#0b1221] to-cyan-500/10 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-2xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">🌍</div>
          <div>
            <p className="mb-1 text-sm font-black uppercase tracking-widest text-emerald-400">I clienti ti trovano su Google</p>
            <p className="text-slate-300 text-sm font-medium leading-relaxed">
              Il tuo salone è visibile su Google: chi cerca un professionista nella tua città può trovare la tua
              pagina di prenotazione. E su quello che incassi: <span className="font-bold text-emerald-400">zero commissioni</span>. Il cliente è tuo, i soldi sono tuoi.
            </p>
          </div>
        </div>
      </div>

      {/* Toggle mensile/annuale */}
      <div className="flex items-center gap-3 mb-10 bg-[#0b1221] border border-[#1e2b4a] rounded-full p-1">
        <button onClick={() => setAnnual(false)} className={`px-6 py-2 rounded-full text-sm font-bold transition ${!annual ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}>Mensile</button>
        <button onClick={() => setAnnual(true)} className={`px-6 py-2 rounded-full text-sm font-bold transition ${annual ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}>Annuale <span className="text-emerald-400 text-xs">-17%</span></button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 max-w-5xl w-full">
        {/* CARD PRO */}
        <div className="flex-1 relative bg-[#0b1221] border border-cyan-500/50 rounded-3xl p-8 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            PIÙ SCELTO
          </div>
          <h2 className="text-cyan-400 font-bold text-xl mb-4">Pro</h2>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-5xl font-black text-white">{annual ? '290' : '29'}&euro;</span>
            <span className="text-slate-400 mb-1">/ {annual ? 'anno' : 'mese'}</span>
          </div>
          {annual && <div className="text-emerald-400 text-sm font-semibold mb-8">Risparmi 58&euro;/anno (~24&euro;/mese)</div>}

          <div className="space-y-4 mb-8 flex-1">
            {['Appuntamenti Illimitati', 'Promemoria WhatsApp temporaneamente disattivati', 'Blocco orari e ferie', 'Link brandizzato prenotazione', 'Acconti e pagamenti Stripe', 'Esportazione timesheet CSV'].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-emerald-400">&#10003;</span>
                <span className="text-slate-300 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>

          <StripeCheckoutButton tenantId={tenantId} slug={slug} plan="pro" interval={annual ? 'year' : 'month'} label={`Attiva Pro ${annual ? 'Annuale' : 'Mensile'}`} color="blue" />
        </div>

        {/* CARD ELITE */}
        <div className="flex-1 bg-[#0b1221] border border-fuchsia-500/20 rounded-3xl p-8 flex flex-col hover:border-fuchsia-500/40 transition-all">
          <h2 className="text-fuchsia-400 font-bold text-xl mb-4">Elite</h2>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-5xl font-black text-white">{annual ? '590' : '59'}&euro;</span>
            <span className="text-slate-400 mb-1">/ {annual ? 'anno' : 'mese'}</span>
          </div>
          {annual && <div className="text-emerald-400 text-sm font-semibold mb-8">Risparmi 118&euro;/anno (~49&euro;/mese)</div>}

          <div className="space-y-4 mb-8 flex-1">
            {['Tutto del piano Pro', 'Mini-Marketing (Recupero Clienti)', 'Autopilota Recensioni Google', 'Multi-Staff illimitato', 'Doppie Sedi / Multi-Location', 'Statistiche ed Esportazione Dati', 'Onboarding VIP dedicato'].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-emerald-400">&#10003;</span>
                <span className="text-slate-300 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>

          <StripeCheckoutButton tenantId={tenantId} slug={slug} plan="elite" interval={annual ? 'year' : 'month'} label={`Attiva Elite ${annual ? 'Annuale' : 'Mensile'}`} color="pink" />
        </div>

        {/* CARD VIP (Done-For-You) — upsell: si richiede via contatto, non Stripe */}
        <div className="flex-1 relative bg-[#0b1221] border border-amber-500/30 rounded-3xl p-8 flex flex-col hover:border-amber-500/50 transition-all">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            SENZA PENSIERI
          </div>
          <h2 className="text-amber-500 font-bold text-xl mb-4 flex items-center gap-2">VIP <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider">Fatto per te</span></h2>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-5xl font-black text-white">149&euro;</span>
            <span className="text-slate-400 mb-1">/ mese</span>
          </div>
          <div className="text-amber-500 font-bold text-sm mb-8">1490&euro;/anno <span className="text-slate-500 font-medium text-xs">(risparmi 298&euro;)</span></div>

          <div className="space-y-4 mb-8 flex-1">
            {['Tutto del piano Elite', 'Configurazione 100% fatta da noi (listino + servizi)', 'Ottimizzazione profilo Google (MyBusiness)', 'Assistenza telefonica dedicata', 'Consulente personale sempre disponibile'].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-amber-400">&#10003;</span>
                <span className="text-slate-300 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>

          <Link
            href="/vip"
            className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-500 px-5 py-4 text-center text-sm font-extrabold text-slate-900 transition hover:from-amber-500 hover:to-yellow-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            Voglio il pacchetto VIP
          </Link>
        </div>
      </div>

      <div className="mt-12 text-center">
        <a href={publicUrl} className="text-slate-500 text-sm font-medium hover:text-cyan-400 transition-colors">
          Visualizza il sito del tuo salone (Modalità Cliente)
        </a>
      </div>
    </main>
  );
}
