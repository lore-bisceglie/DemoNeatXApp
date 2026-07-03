const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'prisma', 'schema.prisma');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(
  'trialEndsAt   DateTime?     // Scadenza del periodo di prova di 7 giorni',
  'trialEndsAt   DateTime?     // Scadenza del periodo di prova di 7 giorni\n  plan          String        @default("basic") // "basic" (29€) o "premium" (59€)'
);

fs.writeFileSync(p, content);
console.log("Plan field added to Tenant!");
