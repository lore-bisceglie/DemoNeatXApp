const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'app', 't', '[slug]', 'admin', 'page.tsx');

let content = fs.readFileSync(p, 'utf8');

const importStatement = 'import WaitlistDashboard from "../../../dashboard/WaitlistDashboard";\n';
if (!content.includes('import WaitlistDashboard')) {
  content = importStatement + content;
}

const dataFetchLogic = `
  // WAITLIST FETCH
  const waitlistData = await prisma.waitlist.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  });
`;

content = content.replace('// 🌟 CALCOLO INCASSI DINAMICI PREMIUM', dataFetchLogic + '\n\n  // 🌟 CALCOLO INCASSI DINAMICI PREMIUM');

const uiComponent = `
        <WaitlistDashboard initialData={waitlistData} tenantId={tenantId} />
        
        {freeGapReports.length > 0 && (
`;

content = content.replace('{freeGapReports.length > 0 && (', uiComponent);

fs.writeFileSync(p, content);
console.log("Done");
