const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'app', 't', '[slug]', 'admin', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

const agendaTetrisComment = content.indexOf('{/* AGENDA SETTIMANALE TETRIS */}');
const servicesTabStart = content.indexOf('data-tab="gestione"');

console.log("agendaTetrisComment:", agendaTetrisComment);
console.log("servicesTabStart:", servicesTabStart);
