import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTenantPublicUrl } from "@/lib/domains";
import StripeCheckoutButton from "./StripeCheckoutButton";

export const dynamic = "force-dynamic";

export default async function PaywallPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });

  if (!tenant) {
    return (
      <main className="min-h-screen bg-[#050814] flex items-center justify-center p-6 text-white">
        <div className="max-w-md rounded-3xl border border-[#1a2642] bg-[#0b1221] p-8 text-center">
          <h1 className="text-2xl font-extrabold">Negozio non trovato</h1>
          <Link href="/" className="mt-6 inline-flex rounded-2xl bg-cyan-400 px-5 py-3 font-extrabold text-black">
            Torna a NeatX
          </Link>
        </div>
      </main>
    );
  }

  const publicUrl = getTenantPublicUrl(tenant.slug);

  return (
    <main className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-6 text-white selection:bg-cyan-500/30">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-3xl shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          🔒
        </div>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-300">
          Il tuo periodo di prova è terminato
        </p>
        <h1 className="text-3xl font-extrabold sm:text-5xl mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Scegli il piano per il tuo Salone
        </h1>
        <p className="text-slate-400 font-medium">L'investimento più intelligente per la tua attività.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 max-w-4xl w-full">
        {/* CARD PRO */}
        <div className="flex-1 relative bg-[#0b1221] border border-cyan-500/50 rounded-3xl p-8 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            PIÙ SCELTO
          </div>
          
          <h2 className="text-cyan-400 font-bold text-xl mb-4">Pro</h2>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-5xl font-black text-white">29€</span>
            <span className="text-slate-400 mb-1">/ mese</span>
          </div>
          <div className="text-emerald-400 text-sm font-semibold mb-8">
            290€/anno (risparmi 58€)
          </div>

          <div className="space-y-4 mb-8 flex-1">
            {['Appuntamenti Illimitati', 'Promemoria WhatsApp Automatici*', 'Blocco orari e ferie', 'Link brandizzato prenotazione', 'Acconti e pagamenti Stripe'].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-emerald-400">✓</span>
                <span className="text-slate-300 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>

          <StripeCheckoutButton tenantId={tenant.id} slug={tenant.slug} plan="pro" priceId="price_placeholder_pro" label="Attiva Piano Pro" color="blue" />
        </div>

        {/* CARD ELITE */}
        <div className="flex-1 bg-[#0b1221] border border-fuchsia-500/20 rounded-3xl p-8 flex flex-col hover:border-fuchsia-500/40 transition-all">
          <h2 className="text-fuchsia-400 font-bold text-xl mb-4">Elite</h2>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-5xl font-black text-white">59€</span>
            <span className="text-slate-400 mb-1">/ mese</span>
          </div>
          <div className="text-emerald-400 text-sm font-semibold mb-8">
            590€/anno (risparmi 118€)
          </div>

          <div className="space-y-4 mb-8 flex-1">
            {[
              <><span className="text-slate-400">Tutto del piano Pro</span></>,
              'Mini-Marketing (Recupero Clienti)', 
              'Autopilota Recensioni Google', 
              'Multi-Staff illimitato', 
              'Statistiche ed Esportazione Dati', 
              'Onboarding VIP dedicato'
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-emerald-400">✓</span>
                <span className="text-slate-300 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>

          <StripeCheckoutButton tenantId={tenant.id} slug={tenant.slug} plan="elite" priceId="price_placeholder_elite" label="Attiva Piano Elite" color="pink" />
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <Link
          href={publicUrl}
          className="text-slate-500 text-sm font-medium hover:text-cyan-400 transition-colors"
        >
          Visualizza il sito del tuo salone (Modalità Cliente)
        </Link>
      </div>
    </main>
  );
}
