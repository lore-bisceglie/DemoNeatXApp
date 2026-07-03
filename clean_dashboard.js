const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 't', '[slug]', 'admin', 'page.tsx');

let content = fs.readFileSync(p, 'utf8');

// 1. Remove ResetDemoButton
content = content.replace('<ResetDemoButton />', '');

// 2. Remove the Demo text block
const demoCondivisibileStart = content.indexOf('<div className="bg-cyan-500/10 border border-cyan-500/20 rounded-3xl p-5 mb-6 shadow-xl shadow-cyan-900/10">');
const tourBlockEnd = content.indexOf('{/* I 3 KPI */}');

if (demoCondivisibileStart !== -1 && tourBlockEnd !== -1) {
  content = content.slice(0, demoCondivisibileStart) + content.slice(tourBlockEnd);
}

// 3. Remove WaitlistDashboard
content = content.replace('<WaitlistDashboard />', '');

fs.writeFileSync(p, content);
console.log("Cleaned!");
