const fs = require('fs');
const p = 'app/page.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.split('"/onboarding"').join('"/demo"');
c = c.split('Inizia Prova Gratis').join('Visualizza Demo Live');
c = c.split('Contatta le Vendite').join('Parla con noi');
fs.writeFileSync(p, c);
console.log('Fatto');
