const fs = require('fs');
const path = 'C:\\\\Users\\\\Lxxmtq\\\\Documents\\\\Korsakoff\\\\NeatX\\\\DemoNeatXApp\\\\app\\\\t\\\\[slug]\\\\admin\\\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix imports
content = content.replace(/from "\.\//g, 'from "../../../dashboard/');

// Modify function signature to include params
content = content.replace(
  /export default async function Dashboard\(props: \{[\s\S]*?\}\) \{/,
  'import { cookies } from "next/headers";\nimport LoginScreen from "./LoginScreen";\n\nexport default async function Dashboard(props: { searchParams: Promise<{ [key: string]: string | undefined }>; params: Promise<{ slug: string }> }) {'
);

// Replace DEMO_TENANT_ID logic with dynamic slug logic and auth
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
`;

content = content.replace(
  /const DEMO_TENANT_ID = "cmqtds1840000yyqbd23x1jdj";[\s\S]*?const tenantServices = tenant\.services;/m,
  authLogic
);

// Fix server actions to use the right redirect url
content = content.replace(/let redirectUrl = "\/dashboard";/g, 'let redirectUrl = `/t/${slug}/admin`;');
content = content.replace(/redirectUrl = `\/dashboard\?error=MULTIPLE_CONFLICTS`/g, 'redirectUrl = `/t/${slug}/admin?error=MULTIPLE_CONFLICTS`');

// Fix navigation links
content = content.replace(/href="\/dashboard\?/g, 'href={`/t/${slug}/admin?');
// Be careful not to replace things incorrectly.
content = content.replace(/href="\/dashboard"/g, 'href={`/t/${slug}/admin`}');
content = content.replace(/href="\/dashboard\/analytics"/g, 'href={`/t/${slug}/admin/analytics`}'); // Even though it might not exist yet

fs.writeFileSync(path, content);
console.log("Done");
