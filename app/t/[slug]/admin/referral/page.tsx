import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cookies } from "next/headers";
import { isTenantAdminCookieValid } from "@/lib/auth";
import { ArrowLeft, Copy, Share2, Users, Gift } from "lucide-react";

export default async function ReferralPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) {
    notFound();
  }

  // Auth check
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("admin_auth_" + slug)?.value;
  
  if (!isTenantAdminCookieValid(authCookie, slug, tenant.adminPassword)) {
    redirect(`/t/${slug}`);
  }

  // Assicurati che il referralCode esista
  let referralCode = tenant.referralCode;
  if (!referralCode) {
    referralCode = tenant.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12) || tenant.slug.toUpperCase().slice(0, 12);
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { referralCode },
    });
  }

  // Statistiche Referral
  const totalReferrals = await prisma.tenant.count({
    where: { referredByCode: referralCode },
  });

  const convertedReferrals = await prisma.tenant.count({
    where: { referredByCode: referralCode, trialStatus: "converted" },
  });

  const creditsEarned = convertedReferrals * 100;

  const referralUrl = `https://neatx.store/registrazione?ref=${referralCode}`;

  return (
    <div className="min-h-screen bg-[#050814] p-4 sm:p-8 font-sans text-slate-200 selection:bg-cyan-500/30">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/t/${slug}/admin`}
            className="flex-shrink-0 bg-[#0b1221] border border-[#1a2642] p-3 rounded-xl hover:bg-[#131c31] hover:border-cyan-500/30 transition-all text-slate-400 hover:text-cyan-400"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Gift className="text-rose-400" size={28} /> Programma Inviti
            </h1>
            <p className="text-slate-400 font-medium">Invita un collega e ottieni crediti gratis.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Main Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-[#0b1221] to-[#0f192b] border border-white/5 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Il tuo link esclusivo</h2>
            <p className="text-sm text-slate-400 mb-6">
              Invia questo link ad altri barbieri o parrucchieri. Quando si iscriveranno e diventeranno clienti paganti, tu riceverai <strong>100 Crediti SMS gratuiti</strong> e loro avranno 1 mese gratis!
            </p>

            <div className="bg-[#050814] border border-[#1a2642] rounded-xl p-4 flex items-center justify-between gap-4">
              <code className="text-cyan-400 font-mono text-sm sm:text-base break-all">
                {referralUrl}
              </code>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Ehi! Sto usando questo nuovo gestionale zero commissioni per il mio salone e mi trovo benissimo. Provalo gratis da questo link e avrai 1 mese extra: ${referralUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
              >
                <Share2 size={18} /> Condividi su WhatsApp
              </a>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-[#131c31] border border-[#1e2b4a] rounded-3xl p-8 flex flex-col justify-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Users size={16} /> Statistiche
            </h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-3xl font-black text-white">{totalReferrals}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-bold mt-1">Colleghi iscritti</p>
              </div>
              <div>
                <p className="text-3xl font-black text-emerald-400">{convertedReferrals}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-bold mt-1">Colleghi attivi</p>
              </div>
              <div className="pt-4 border-t border-[#1a2642]">
                <p className="text-3xl font-black text-rose-400">+{creditsEarned}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-bold mt-1">Crediti guadagnati</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
