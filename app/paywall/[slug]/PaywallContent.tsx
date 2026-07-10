'use client';

import { useState } from 'react';
import StripeCheckoutButton from './StripeCheckoutButton';

export default function PaywallContent({ tenantId, slug, publicUrl }: { tenantId: string; slug: string; publicUrl: string }) {
  const [annual, setAnnual] = useState(false);

  return (
    <main className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-6 text-white selection:bg-cyan-500/30">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-3xl shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          🔒
        </div>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-300">
          Il tuo periodo di prova e terminato
        </p>
        <h1 className="text-3xl font-extrabold sm:text-5xl mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Scegli il piano per il tuo Salone
        </h1>
        <p className="text-slate-400 font-medium">L&apos;investimento piu intelligente per la tua attivita.</p>
      </div>

      {/* Toggle mensile/annuale */}
      <div className="flex items-center gap-3 mb-10 bg-[#0b1221] border border-[#1e2b4a] rounded-full p-1">
        <button onClick={() => setAnnual(false)} className={`px-6 py-2 rounded-full text-sm font-bold transition ${!annual ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}>Mensile</button>
        <button onClick={() => setAnnual(true)} className={`px-6 py-2 rounded-full text-sm font-bold transition ${annual ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}>Annuale <span className="text-emerald-400 text-xs">-17%</span></button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 max-w-4xl w-full">
        {/* CARD PRO */}
        <div className="flex-1 relative bg-[#0b1221] border border-cyan-500/50 rounded-3xl p-8 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            PIU SCELTO
          </div>
          <h2 className="text-cyan-400 font-bold text-xl mb-4">Pro</h2>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-5xl font-black text-white">{annual ? '290' : '29'}&euro;</span>
            <span className="text-slate-400 mb-1">/ {annual ? 'anno' : 'mese'}</span>
          </div>
          {annual && <div className="text-emerald-400 text-sm font-semibold mb-8">Risparmi 58&euro; (~24&euro;/mese)</div>}
          {!annual && <div className="text-slate-500 text-sm font-semibold mb-8">290&euro;/anno (risparmi 58&euro;)</div>}

          <div className="space-y-4 mb-8 flex-1">
            {['Appuntamenti Illimitati', 'Promemoria WhatsApp Automatici', 'Blocco orari e ferie', 'Link brandizzato prenotazione', 'Acconti e pagamenti Stripe', 'Esportazione timesheet CSV'].map((f, i) => (
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
          {annual && <div className="text-emerald-400 text-sm font-semibold mb-8">Risparmi 118&euro; (~49&euro;/mese)</div>}
          {!annual && <div className="text-slate-500 text-sm font-semibold mb-8">590&euro;/anno (risparmi 118&euro;)</div>}

          <div className="space-y-4 mb-8 flex-1">
            {['Tutto del piano Pro', 'Mini-Marketing (Recupero Clienti)', 'Autopilota Recensioni Google', 'Multi-Staff illimitato', 'Statistiche ed Esportazione Dati', 'Onboarding VIP dedicato'].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-emerald-400">&#10003;</span>
                <span className="text-slate-300 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>

          <StripeCheckoutButton tenantId={tenantId} slug={slug} plan="elite" interval={annual ? 'year' : 'month'} label={`Attiva Elite ${annual ? 'Annuale' : 'Mensile'}`} color="pink" />
        </div>
      </div>

      <div className="mt-12 text-center">
        <a href={publicUrl} className="text-slate-500 text-sm font-medium hover:text-cyan-400 transition-colors">
          Visualizza il sito del tuo salone (Modalita Cliente)
        </a>
      </div>
    </main>
  );
}
