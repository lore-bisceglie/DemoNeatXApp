import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Audit Costi Commissioni | NeatX',
  description: 'Report personalizzato sui costi nascosti e le commissioni pagate a piattaforme esterne.',
  robots: { index: false, follow: false } // Nascondiamo questa pagina da Google per renderla esclusiva
};

function formatName(slug: string) {
  // Converte "barberia-rossi" in "Barberia Rossi"
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function AuditPage({ params }: { params: { slug: string } }) {
  const salonName = formatName(params.slug);
  
  // Dati finti ad alto impatto emotivo (Calcolati su 10 appuntamenti/giorno a ~25€ = 250€ * 25gg = 6250€/mese -> 20% = 1250€/mese)
  const monthlyLost = 1250;
  const yearlyLost = monthlyLost * 12;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-cyan-500/30">
      {/* Sfondo Grid + Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-red-500 opacity-[0.15] blur-[100px]"></div>
        <div className="absolute top-[40%] right-[10%] -z-10 h-[400px] w-[400px] rounded-full bg-cyan-500 opacity-[0.05] blur-[120px]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 md:py-20 max-w-4xl">
        
        {/* Header Piccolo */}
        <div className="flex justify-between items-center mb-16 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white">N</div>
            <span className="font-bold text-xl tracking-tight">NEAT<span className="text-cyan-500">X</span></span>
          </div>
          <div className="text-xs font-mono text-red-400 uppercase tracking-widest px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
            PRIVATE AUDIT REPORT
          </div>
        </div>

        {/* Titolo Shock */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            <span className="text-red-500">{salonName}</span> sta regalando<br/>
            <span className="text-white">€{yearlyLost.toLocaleString('it-IT')} all'anno</span><br/>
            in commissioni.
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Abbiamo analizzato i costi medi di Treatwell per un salone con il vostro volume di affari. Questi sono i soldi che state letteralmente perdendo ogni mese.
          </p>
        </div>

        {/* Card Dati (Tabella/Grafico) */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 mb-16 shadow-2xl relative overflow-hidden">
          {/* Decorative slash */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl"></div>
          
          <div className="grid md:grid-cols-2 gap-12 relative z-10">
            
            {/* Treatwell Stats */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <h3 className="text-lg font-semibold text-slate-300">Con Treatwell (Commissioni ~20%)</h3>
              </div>
              <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
                <div className="text-sm text-red-400/80 mb-1 font-medium uppercase tracking-wider">Costo Mensile Stimato</div>
                <div className="text-4xl font-bold text-red-500 mb-4">- €{monthlyLost.toLocaleString('it-IT')}</div>
                <div className="text-sm text-red-400/80 mb-1 font-medium uppercase tracking-wider">Costo a 5 anni</div>
                <div className="text-2xl font-bold text-red-500/80">- €{(yearlyLost * 5).toLocaleString('it-IT')}</div>
              </div>
            </div>

            {/* NeatX Stats */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                <h3 className="text-lg font-semibold text-white">Con NeatX (0% Commissioni)</h3>
              </div>
              <div className="p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="text-sm text-cyan-400/80 mb-1 font-medium uppercase tracking-wider relative z-10">Costo Mensile</div>
                <div className="text-4xl font-bold text-white mb-4 relative z-10">€0</div>
                <div className="text-sm text-cyan-400/80 mb-1 font-medium uppercase tracking-wider relative z-10">Soldi Risparmiati in 5 anni</div>
                <div className="text-2xl font-bold text-cyan-400 relative z-10">+ €{(yearlyLost * 5).toLocaleString('it-IT')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA (Call To Action) */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-8">Riprenditi i tuoi soldi e i dati dei tuoi clienti.</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="px-8 py-4 bg-white text-black font-bold rounded-xl text-lg hover:bg-slate-200 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transform hover:-translate-y-1"
            >
              Crea Agenda Gratis
            </Link>
            <Link 
              href="/" 
              className="px-8 py-4 bg-transparent text-white font-medium rounded-xl text-lg border border-white/20 hover:bg-white/5 transition-all duration-300"
            >
              Scopri NeatX
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-500">Nessuna carta di credito richiesta. Zero commissioni, per sempre.</p>
        </div>

      </div>
    </div>
  );
}
