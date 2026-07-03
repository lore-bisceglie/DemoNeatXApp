const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 't', '[slug]', 'admin', 'page.tsx');
let content = fs.readFileSync(p, 'utf8');

// Norm
content = content.replace(/\r\n/g, '\n');

// Import
if (!content.includes('import MarketingWidget')) {
  content = content.replace('import TeamDrawer from "./TeamDrawer";', 'import TeamDrawer from "./TeamDrawer";\nimport MarketingWidget from "./MarketingWidget";');
}

// Inserimento
const insertTarget = `        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[2fr_1fr] gap-6 sm:gap-10">`;

const replacement = `        </div>
        
        <MarketingWidget tenantId={tenantId} isPremium={isPremium} />

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[2fr_1fr] gap-6 sm:gap-10">`;

if (content.includes(insertTarget)) {
  content = content.replace(insertTarget, replacement);
  fs.writeFileSync(p, content);
  console.log("MarketingWidget inserito!");
} else {
  console.log("TARGET NON TROVATO!");
}
