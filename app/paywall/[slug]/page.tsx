import { prisma } from "@/lib/prisma";
import { getTenantPublicUrl } from "@/lib/domains";
import PaywallContent from "./PaywallContent";

export const dynamic = "force-dynamic";

export default async function PaywallPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });

  if (!tenant) {
    return (
      <main className="min-h-screen bg-[#050814] flex items-center justify-center p-6 text-white">
        <div className="max-w-md rounded-3xl border border-[#1a2642] bg-[#0b1221] p-8 text-center">
          <h1 className="text-2xl font-extrabold">Negozio non trovato</h1>
          <a href="/" className="mt-6 inline-flex rounded-2xl bg-cyan-400 px-5 py-3 font-extrabold text-black">
            Torna a NeatX
          </a>
        </div>
      </main>
    );
  }

  return <PaywallContent tenantId={tenant.id} slug={tenant.slug} publicUrl={getTenantPublicUrl(tenant.slug)} />;
}
