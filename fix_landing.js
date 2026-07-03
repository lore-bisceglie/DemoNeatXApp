const fs = require('fs');
const p = 'app/page.tsx';
let c = fs.readFileSync(p, 'utf8');

// 1. Navbar: Demo Live -> Calcola ROI
const navTarget = `<Link href="/demo" className="hover:text-white transition-colors">Demo Live</Link>`;
const navReplacement = `<button onClick={() => setShowRoiModal(true)} className="hover:text-white transition-colors font-extrabold text-[#00b4ff]">Calcola ROI</button>`;
c = c.replace(navTarget, navReplacement);

// 2. Navbar: Area Partner -> Accesso Clienti
const btnTarget = `<Link 
          href="/superadmin"
          className="text-xs font-bold bg-[#131c31] hover:bg-[#1a2642] px-4 py-2 rounded-lg border border-[#1e2b4a] transition-all shadow-lg shadow-cyan-900/20"
        >
          Area Partner
        </Link>`;
const btnReplacement = `<Link 
          href="/login"
          className="text-xs font-bold bg-[#131c31] hover:bg-[#1a2642] px-4 py-2 rounded-lg border border-[#1e2b4a] transition-all shadow-lg shadow-cyan-900/20"
        >
          Accesso Clienti
        </Link>`;
c = c.replace(btnTarget, btnReplacement);

// 3. Add 0% Commissioni banner before pricing
const pricingHeaderTarget = `<section id="pricing" className="relative z-10 bg-[#050814] py-24 border-y border-[#1a2642]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Scegli il piano per il tuo Salone</h2>
            <p className="text-slate-400 font-medium">Inizia gratis per 7 giorni. Cancella quando vuoi.</p>
          </div>`;

const pricingHeaderReplacement = `<section id="pricing" className="relative z-10 bg-[#050814] py-24 border-y border-[#1a2642]">
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="mb-20 max-w-3xl mx-auto bg-gradient-to-r from-emerald-500/10 to-emerald-900/20 border border-emerald-500/30 rounded-3xl p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 blur-[60px]"></div>
            <h2 className="text-3xl font-extrabold text-white mb-3 relative z-10">0% Commissioni. <span className="text-emerald-400">Zero trattenute.</span></h2>
            <p className="text-emerald-100/70 font-medium relative z-10 text-lg">
              A differenza delle altre piattaforme che si tengono il 20-30% sui tuoi incassi, con NeatX i soldi sono tutti tuoi. Paghi solo l'abbonamento mensile, e basta.
            </p>
          </div>

          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Scegli il piano per il tuo Salone</h2>
            <p className="text-slate-400 font-medium">L'investimento più intelligente per la tua attività.</p>
          </div>`;

c = c.replace(pricingHeaderTarget, pricingHeaderReplacement);

fs.writeFileSync(p, c);
console.log('Fatto modifiche landing');
