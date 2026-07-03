const fs = require('fs');
const p = 'app/page.tsx';
let c = fs.readFileSync(p, 'utf8');

// 1. Add hover:scale-105 to Starter and Elite cards
c = c.replace(/className="glow-card bg-\[#0b1221\] p-8 rounded-3xl border border-\[#1a2642\] flex flex-col h-\[450px\]"/g, 'className="glow-card bg-[#0b1221] p-8 rounded-3xl border border-[#1a2642] flex flex-col h-[450px] transform transition-transform hover:scale-105"');

// 2. Replace the Elite button with two buttons (Email and IG)
const eliteBtnTarget = `<button onClick={() => setShowAppModal(true)} className="mt-8 w-full py-4 border border-purple-500/50 hover:bg-purple-900/20 text-white font-bold rounded-xl transition-all text-center shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:scale-105">
                Invia Candidatura
              </button>`;

const eliteBtnReplacement = `<div className="mt-8 flex flex-col gap-3">
                <a href="mailto:info@neatx.it" className="w-full py-3 bg-[#131c31] hover:bg-[#1a2642] border border-[#1e2b4a] text-white font-bold rounded-xl transition-all text-center flex items-center justify-center gap-2">
                  ✉️ Email
                </a>
                <a href="https://instagram.com/tuoprofilo" target="_blank" className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold rounded-xl transition-all text-center shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2">
                  📸 Instagram
                </a>
              </div>`;
c = c.replace(eliteBtnTarget, eliteBtnReplacement);

// 3. Remove ApplicationModal component and state
c = c.replace(`import ApplicationModal from "@/components/landing/ApplicationModal";\n`, '');
c = c.replace(`const [showAppModal, setShowAppModal] = useState(false);`, '');
c = c.replace(`<ApplicationModal isOpen={showAppModal} onClose={() => setShowAppModal(false)} />\n      {/* FOOTER */}`, `{/* FOOTER */}`);

fs.writeFileSync(p, c);
console.log('Apportate modifiche ai piani');
