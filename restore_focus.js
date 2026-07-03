const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 't', '[slug]', 'admin', 'page.tsx');
let content = fs.readFileSync(p, 'utf8');

const targetStr = `<div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-cyan-900/10 border border-[#1a2642] h-full flex flex-col relative overflow-hidden">
              <div className="mb-6 pb-6 border-b border-[#1e2b4a]">`;

const replacement = `<div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-cyan-900/10 border border-[#1a2642] h-full flex flex-col relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-8xl opacity-[0.02] pointer-events-none">
              🎯
            </div>

            <h2 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2">
              <span>🎯</span>
              Focus di Oggi
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#131c31] border border-[#1e2b4a] p-4 rounded-2xl shadow-inner">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                  Clienti Oggi
                </p>

                <p className="text-3xl font-extrabold text-white">
                  {todayAppointmentsList.length}
                </p>
              </div>

              <div className="bg-[#131c31] border border-[#1e2b4a] p-4 rounded-2xl shadow-inner">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                  Già Pagati
                </p>

                <p className="text-3xl font-extrabold text-emerald-400">
                  {todayPaid}
                </p>
              </div>
            </div>

            <div className="bg-[#131c31] border border-[#1e2b4a] p-5 rounded-2xl flex items-center justify-between shadow-inner mb-6">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                  Incasso Stimato Oggi
                </p>

                <p className="text-4xl font-extrabold text-[#00b4ff]">
                  {isPremium ? \`€\${todayTotalRevenue}\` : '🔒'}
                </p>
              </div>

              <div className="text-4xl opacity-20">💰</div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-red-900/5 border border-[#1a2642] h-fit flex flex-col">
              <div className="mb-6 pb-6 border-b border-[#1e2b4a]">`;

content = content.replace(targetStr, replacement);
fs.writeFileSync(p, content);
console.log("Focus di oggi restored!");
