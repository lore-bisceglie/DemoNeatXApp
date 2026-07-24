import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function IntegrationsSection() {
  return (
    <section className="py-20 bg-[#030610] border-y border-[#1a2642] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-[#00b4ff]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Si integra con gli strumenti che già ami</h2>
        <p className="text-slate-400 max-w-2xl mx-auto mb-10 text-sm">
          NeatX non ti chiude in un recinto. Lavoriamo in perfetta sinergia con i migliori servizi al mondo per offrirti un'esperienza senza attriti.
        </p>

        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          
          {/* Stripe */}
          <div className="bg-[#0b1221] border border-[#1a2642] rounded-2xl p-6 flex flex-col items-center justify-center min-w-[160px] hover:border-indigo-500/30 transition-colors shadow-lg">
            <div className="text-indigo-400 font-black text-2xl tracking-tighter mb-2">Stripe</div>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Pagamenti</span>
          </div>

          {/* WhatsApp */}
          <div className="bg-[#0b1221] border border-[#1a2642] rounded-2xl p-6 flex flex-col items-center justify-center min-w-[160px] hover:border-emerald-500/30 transition-colors shadow-lg">
            <div className="text-emerald-400 font-bold text-2xl tracking-tight mb-2">WhatsApp</div>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Promemoria in manutenzione</span>
          </div>

          {/* Revolut Pro (Referral) */}
          <a 
            href="https://revolut.com/referral/?referral-code=lorebisceglie!JUL2-26-AR-RPB&geo-redirect" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group bg-[#0b1221] border border-[#1a2642] hover:border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[160px] transition-all hover:bg-[#0f172a] shadow-lg relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="text-white font-black text-[22px] tracking-tighter mb-2 flex items-center gap-1.5">
                Revolut <ExternalLink size={14} className="text-slate-500 group-hover:text-white transition-colors" />
              </div>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider group-hover:text-slate-300 transition-colors">Conto Pro</span>
            </div>
          </a>

        </div>
      </div>
    </section>
  );
}
