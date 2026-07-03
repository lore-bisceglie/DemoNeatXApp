const fs = require('fs');
const p = 'app/page.tsx';
let c = fs.readFileSync(p, 'utf8');

// 1. Remove the Accesso Clienti button
const btnTarget = `<Link 
          href="/login"
          className="text-xs font-bold bg-[#131c31] hover:bg-[#1a2642] px-4 py-2 rounded-lg border border-[#1e2b4a] transition-all shadow-lg shadow-cyan-900/20"
        >
          Accesso Clienti
        </Link>`;
c = c.replace(btnTarget, '');

// 2. Add "Una tantum" to pricing plans
const starterTarget = `<div className="text-4xl font-extrabold text-white mb-6">19€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>`;
const starterReplacement = `<div className="text-4xl font-extrabold text-white mb-1">19€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>
              <div className="text-xs text-slate-500 font-medium mb-6">+ Setup Una Tantum iniziale</div>`;
c = c.replace(starterTarget, starterReplacement);

const proTarget = `<div className="text-5xl font-extrabold text-white mb-6">29€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>`;
const proReplacement = `<div className="text-5xl font-extrabold text-white mb-1">29€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>
              <div className="text-xs text-slate-500 font-medium mb-6">+ Setup Una Tantum iniziale</div>`;
c = c.replace(proTarget, proReplacement);

const eliteTarget = `<div className="text-4xl font-extrabold text-white mb-6">59€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>`;
const eliteReplacement = `<div className="text-4xl font-extrabold text-white mb-1">59€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>
              <div className="text-xs text-slate-500 font-medium mb-6">+ Setup Una Tantum iniziale</div>`;
c = c.replace(eliteTarget, eliteReplacement);

fs.writeFileSync(p, c);
console.log('Fatto');
