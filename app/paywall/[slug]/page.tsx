import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTenantPublicUrl } from "@/lib/domains";

export const dynamic = "force-dynamic";

export default async function PaywallPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });

  if (!tenant) {
    return (
      <main className="min-h-screen bg-[#050814] flex items-center justify-center p-6 text-white">
        <div className="max-w-md rounded-3xl border border-[#1a2642] bg-[#0b1221] p-8 text-center">
          <h1 className="text-2xl font-extrabold">Negozio non trovato</h1>
          <Link href="/" className="mt-6 inline-flex rounded-2xl bg-cyan-400 px-5 py-3 font-extrabold text-black">
            Torna a NeatX
          </Link>
        </div>
      </main>
    );
  }

  const publicUrl = getTenantPublicUrl(tenant.slug);
  const message = encodeURIComponent(
    `Ciao, voglio attivare NeatX per ${tenant.name}. Link negozio: ${publicUrl}`
  );

  return (
    <main className="min-h-screen bg-[#050814] flex items-center justify-center p-6 text-white">
      <section className="w-full max-w-3xl rounded-3xl border border-cyan-500/20 bg-[#0b1221] p-6 shadow-2xl shadow-cyan-950/30 sm:p-10 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-4xl">
          !
        </div>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-amber-300">
          Prova gratuita terminata
        </p>
        <h1 className="text-3xl font-extrabold sm:text-5xl">
          {tenant.name} e pronto, ora va attivato.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-400 sm:text-base">
          Il negozio, i servizi, lo staff e l'agenda restano salvati. Attiva l'abbonamento per continuare a ricevere prenotazioni senza perdere la configurazione.
        </p>

        <div className="mt-8 rounded-2xl border border-[#1a2642] bg-[#050814] p-4 text-left">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Link negozio
          </p>
          <p className="mt-2 truncate font-mono text-sm font-bold text-cyan-300">
            {publicUrl}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href={`https://wa.me/393333333333?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-extrabold text-[#03110a] transition hover:bg-emerald-400"
          >
            Attiva abbonamento
          </a>
          <Link
            href={publicUrl}
            className="rounded-2xl border border-[#1e2b4a] bg-[#050814] px-5 py-4 text-sm font-extrabold text-white transition hover:border-cyan-500/40"
          >
            Rivedi pagina cliente
          </Link>
        </div>
      </section>
    </main>
  );
}
