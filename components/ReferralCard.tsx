"use client";

import { useState, useEffect } from "react";
import { Gift, Copy, Check } from "lucide-react";

type Props = { tenantId: string };

export default function ReferralCard({ tenantId }: Props) {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/referral?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tenantId]);

  const copyLink = () => {
    if (!data?.referralLink) return;
    navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-3xl border border-white/5 shadow-2xl shadow-emerald-900/10 bg-gradient-to-br from-[#0b1221] to-[#0f192b] p-8 h-full min-h-[320px] flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-emerald-500/10 group relative overflow-hidden">
      <div className="absolute -right-6 -bottom-6 text-9xl opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-500">
        🎁
      </div>

      <div className="flex items-center gap-3 mb-4 z-10 relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          <Gift size={20} className="group-hover:animate-pulse" />
        </div>
        <div>
          <h3 className="font-extrabold text-white text-sm group-hover:text-emerald-400 transition-colors">Invita un collega</h3>
          <p className="text-xs text-slate-500">Guadagna crediti messaggio gratis</p>
        </div>
      </div>

      {data && (
        <>
          <div className="flex items-center gap-2 mb-3 z-10 relative">
            <input
              readOnly
              value={data.referralLink}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            <button
              onClick={copyLink}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 shadow-lg ${
                copied 
                  ? "bg-emerald-500 text-white shadow-emerald-500/30 scale-105" 
                  : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105"
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center mb-3 z-10 relative">
            <div className="rounded-xl bg-black/20 border border-white/5 p-2 backdrop-blur-sm group-hover:border-emerald-500/20 transition-colors">
              <div className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">{data.totalReferrals}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">Invitati</div>
            </div>
            <div className="rounded-xl bg-black/20 border border-white/5 p-2 backdrop-blur-sm group-hover:border-emerald-500/20 transition-colors">
              <div className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-b from-cyan-300 to-cyan-500 drop-shadow-[0_0_5px_rgba(6,182,212,0.3)]">{data.convertedReferrals}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">Convertiti</div>
            </div>
            <div className="rounded-xl bg-black/20 border border-white/5 p-2 backdrop-blur-sm group-hover:border-emerald-500/20 transition-colors">
              <div className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-b from-amber-300 to-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">{data.creditsEarned}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">Crediti</div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed z-10 relative">
            Ogni amico che si registra col tuo link e attiva un abbonamento ti regala <strong className="text-emerald-400 font-bold">100 crediti messaggio</strong>.
            Nessun limite. Più inviti, più messaggi gratis.
          </p>
        </>
      )}
    </div>
  );
}
