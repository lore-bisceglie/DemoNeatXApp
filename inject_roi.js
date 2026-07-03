const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 'page.tsx');
let content = fs.readFileSync(p, 'utf8');

// Normalize newlines
content = content.replace(/\r\n/g, '\n');

// 1. Add state variables for the ROI Calculator
if (!content.includes('showRoiModal')) {
  const stateTarget = `  const [notification, setNotification] = useState("");
  const [showNotification, setShowNotification] = useState(false);`;
  const stateReplacement = `  const [notification, setNotification] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  
  // ROI Calculator State
  const [showRoiModal, setShowRoiModal] = useState(false);
  const [clientsPerMonth, setClientsPerMonth] = useState(300);
  const [avgTicket, setAvgTicket] = useState(35);
  
  // Math: 15% average no-show rate in the industry
  const noShowRate = 0.15;
  const lostRevenue = Math.round(clientsPerMonth * avgTicket * noShowRate);
  // NeatX saves about 90% of those no-shows
  const recoveredRevenue = Math.round(lostRevenue * 0.90);
`;
  content = content.replace(stateTarget, stateReplacement);
}

// 2. Change the second hero button
const heroButtonTarget = `<Link 
            href="/demo"
            className="w-full sm:w-auto px-8 py-4 bg-[#131c31]/80 backdrop-blur-md hover:bg-[#1a2642] border border-[#1e2b4a] text-white font-extrabold rounded-2xl transition-all text-lg flex items-center justify-center gap-2 hover:border-[#00b4ff]/50"
          >
            Vedi Vetrina Cliente
          </Link>`;
const heroButtonReplacement = `<button 
            onClick={() => setShowRoiModal(true)}
            className="w-full sm:w-auto px-8 py-4 bg-[#131c31]/80 backdrop-blur-md hover:bg-[#1a2642] border border-[#1e2b4a] text-white font-extrabold rounded-2xl transition-all text-lg flex items-center justify-center gap-2 hover:border-[#00b4ff]/50 shadow-lg shadow-cyan-900/10"
          >
            Simula i tuoi incassi 💸
          </button>`;
if (content.includes(heroButtonTarget)) {
  content = content.replace(heroButtonTarget, heroButtonReplacement);
}

// 3. Inject the ROI Modal at the bottom of the component, just before the closing </div> of the main page
const modalHtml = `
      {/* ROI CALCULATOR MODAL */}
      {showRoiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0b1221] border border-[#00b4ff]/40 p-6 sm:p-8 rounded-3xl shadow-2xl shadow-cyan-900/30 max-w-lg w-full relative animate-in zoom-in-95 duration-300">
            
            <button 
              onClick={() => setShowRoiModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white bg-[#131c31] w-8 h-8 rounded-full flex items-center justify-center font-bold"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">💸</div>
              <h3 className="text-2xl font-extrabold text-white mb-2">Quanti soldi perdi per i No-Show?</h3>
              <p className="text-slate-400 text-sm">Scopri quanto incasso extra genererai attivando i promemoria automatici NeatX.</p>
            </div>

            <div className="space-y-6 mb-8">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-sm font-bold text-slate-300">Clienti al mese</label>
                  <span className="text-xl font-extrabold text-[#00b4ff]">{clientsPerMonth}</span>
                </div>
                <input 
                  type="range" 
                  min="50" max="1000" step="50"
                  value={clientsPerMonth}
                  onChange={(e) => setClientsPerMonth(Number(e.target.value))}
                  className="w-full accent-[#00b4ff] h-2 bg-[#131c31] rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-sm font-bold text-slate-300">Scontrino medio</label>
                  <span className="text-xl font-extrabold text-emerald-400">{avgTicket} €</span>
                </div>
                <input 
                  type="range" 
                  min="10" max="150" step="5"
                  value={avgTicket}
                  onChange={(e) => setAvgTicket(Number(e.target.value))}
                  className="w-full accent-emerald-400 h-2 bg-[#131c31] rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-[#050814] rounded-2xl border border-[#1a2642] p-5 mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-400 text-sm font-medium">Perdita attuale stimata (15% assenze):</span>
                <span className="text-red-400 font-bold line-through">-{lostRevenue} €/mese</span>
              </div>
              
              <div className="h-px w-full bg-[#1a2642] my-4"></div>
              
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-500 mb-1">IL TUO RECUPERO CON NEATX</div>
                  <div className="text-slate-300 text-xs">Ricavi extra stimati 🚀</div>
                </div>
                <div className="text-3xl font-extrabold text-white">
                  +{recoveredRevenue} <span className="text-lg text-slate-500">€/m</span>
                </div>
              </div>
            </div>

            <Link 
              href="#pricing"
              onClick={() => setShowRoiModal(false)}
              className="w-full block text-center py-4 bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-emerald-900/40 hover:scale-105"
            >
              Voglio questi {recoveredRevenue}€ in più
            </Link>
          </div>
        </div>
      )}

      {/* FOOTER */}`;
const modalTarget = `      {/* FOOTER */}`;
if (content.includes(modalTarget)) {
  content = content.replace(modalTarget, modalHtml);
}

fs.writeFileSync(p, content);
console.log("ROI Modal Injected Successfully");
