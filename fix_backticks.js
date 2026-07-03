const fs = require('fs');
const p = 'app/t/[slug]/admin/TeamDrawer.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/\\`/g, '`');
fs.writeFileSync(p, c);
console.log("Fixed backticks!");
