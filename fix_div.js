const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 't', '[slug]', 'admin', 'page.tsx');
let content = fs.readFileSync(p, 'utf8');

const target = `        {/* ALTRE FUNZIONI DASHBOARD */}
        <div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-cyan-900/10 border border-[#1a2642] h-full flex flex-col relative overflow-hidden">`;

const replacement = `        {/* ALTRE FUNZIONI DASHBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-cyan-900/10 border border-[#1a2642] h-full flex flex-col relative overflow-hidden">`;

content = content.replace(target, replacement);
fs.writeFileSync(p, content);
console.log("Restored grid container!");
