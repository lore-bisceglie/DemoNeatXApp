"use client";

import { useState, useEffect } from "react";
import { Gift, Copy, Check, Share2 } from "lucide-react";

type Props = { tenantId: string };

export default function ReferralCard({ tenantId }: Props) {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

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
    <div className="rounded-3xl border border-emerald-500/20 shadow-xl shadow-emerald-900/20 bg-[#0b1221] p-8 h-full min-h-[280px] flex flex-col justify-center">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
          <Gift size={20} />
        </div>
        <div>
          <h3 className="font-extrabold text-white text-sm">Invita un collega</h3>
          <p className="text-xs text-slate-500">Guadagna crediti WhatsApp gratis</p>
        </div>
      </div>

      {data && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <input
              readOnly
              value={data.referralLink}
              className="flex-1 bg-[#131c31] border border-[#1e2b4a] rounded-lg px-3 py-2 text-xs text-slate-300 font-mono"
            />
            <button
              onClick={copyLink}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="rounded-xl bg-[#131c31] border border-[#1e2b4a] p-2">
              <div className="text-lg font-black text-emerald-400">{data.totalReferrals}</div>
              <div className="text-[10px] text-slate-500">Invitati</div>
            </div>
            <div className="rounded-xl bg-[#131c31] border border-[#1e2b4a] p-2">
              <div className="text-lg font-black text-cyan-400">{data.convertedReferrals}</div>
              <div className="text-[10px] text-slate-500">Convertiti</div>
            </div>
            <div className="rounded-xl bg-[#131c31] border border-[#1e2b4a] p-2">
              <div className="text-lg font-black text-amber-400">{data.creditsEarned}</div>
              <div className="text-[10px] text-slate-500">Crediti</div>
            </div>
          </div>

          <p className="text-[10px] text-slate-600 leading-relaxed">
            Ogni amico che si registra col tuo link e attiva un abbonamento ti regala <strong className="text-emerald-400">75 crediti WhatsApp</strong>.
            Nessun limite. Più inviti, più messaggi gratis.
          </p>
        </>
      )}
    </div>
  );
}
