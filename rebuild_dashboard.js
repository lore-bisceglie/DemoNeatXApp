const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'app', 'dashboard', 'page.tsx');
const dest = path.join(process.cwd(), 'app', 't', '[slug]', 'admin', 'page.tsx');

let content = fs.readFileSync(p, 'utf8');

// Fix imports
content = content.replace(/from "\.\//g, 'from "../../../dashboard/');

// Insert AnalyticsChart import
content = content.replace('import ResetDemoButton from "../../../dashboard/ResetDemoButton";', 'import ResetDemoButton from "../../../dashboard/ResetDemoButton";\nimport AnalyticsChart from "../../../dashboard/AnalyticsChart";');

// Modify function signature
content = content.replace(
  /export default async function Dashboard\(props: \{[\s\S]*?\}\) \{/,
  'import { cookies } from "next/headers";\nimport LoginScreen from "./LoginScreen";\n\nexport default async function Dashboard(props: { searchParams: Promise<{ [key: string]: string | undefined }>; params: Promise<{ slug: string }> }) {'
);

// Replace DEMO_TENANT_ID logic with auth logic + PAYWALL
const authLogic = `
  const { slug } = await props.params;
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('admin_auth_' + slug)?.value;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { services: true }
  });

  if (!tenant) return <div className="p-10 text-white">Attività non trovata.</div>;

  if (tenant.adminPassword && authCookie !== tenant.adminPassword) {
    return <LoginScreen slug={slug} correctPassword={tenant.adminPassword} tenantName={tenant.name} />;
  }

  const tenantId = tenant.id;
  const tenantName = tenant.name;
  const tenantServices = tenant.services;

  // Logica PAYWALL
  const todayDate = new Date();
  const trialEndsAt = tenant.trialEndsAt;
  const isTrialExpired = trialEndsAt && todayDate > trialEndsAt;
  if (isTrialExpired) {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4 selection:bg-[#00b4ff]/30 text-center">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center text-4xl mb-6 border border-red-500/20">⚠️</div>
        <h1 className="text-4xl font-extrabold text-white mb-4">Periodo di Prova Scaduto</h1>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          I tuoi 7 giorni di prova per <strong>{tenantName}</strong> sono terminati. Attiva il piano Pro (29€/mese) per sbloccare la tua agenda.
        </p>
        <a href={\`https://wa.me/393333333333?text=Ciao,%20voglio%20attivare%20il%20piano%20Pro%20per%20\${tenantName}!\`} target="_blank" className="py-4 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-green-500/25 text-lg">Attiva Abbonamento Pro</a>
      </div>
    );
  }
`;

content = content.replace(
  /const DEMO_TENANT_ID = "cmqtds1840000yyqbd23x1jdj";[\s\S]*?const tenantServices = tenant\.services;/m,
  authLogic
);

// Analytics logic
const analyticsLogic = `
  const past14Days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - i));
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return \`\${d.getFullYear()}-\${m}-\${day}\`;
  });

  const allAppointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      date: { in: past14Days },
      status: { not: 'CANCELLED' }
    },
    include: { service: true }
  });

  const analyticsData = past14Days.map(dateStr => {
    const apps = allAppointments.filter(a => a.date === dateStr);
    const rev = apps.reduce((sum, a) => sum + (a.service?.price || 0), 0);
    return { date: dateStr, appointments: apps.length, revenue: rev };
  });
`;

content = content.replace(
  /const todayTotalRevenue = [^;]+;/m,
  match => match + '\n' + analyticsLogic
);

// Fix server actions to use the right redirect url
content = content.replace(/let redirectUrl = "\/dashboard";/g, 'let redirectUrl = `/t/${slug}/admin`;');
content = content.replace(/redirectUrl = `\/dashboard\?error=MULTIPLE_CONFLICTS`/g, 'redirectUrl = `/t/${slug}/admin?error=MULTIPLE_CONFLICTS`');
content = content.replace(/href="\/dashboard\?/g, 'href={`/t/${slug}/admin?');
content = content.replace(/href="\/dashboard"/g, 'href={`/t/${slug}/admin`}');
content = content.replace(/href="\/dashboard\/analytics"/g, 'href={`/t/${slug}/admin/analytics`}');

// Insert chart
content = content.replace(
  '{/* AGENDA SETTIMANALE TETRIS */}',
  '{/* DASHBOARD ANALYTICS */}\n        <AnalyticsChart data={analyticsData} />\n\n        {/* AGENDA SETTIMANALE TETRIS */}'
);

fs.writeFileSync(dest, content);
console.log("Done");
