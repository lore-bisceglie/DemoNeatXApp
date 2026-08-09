"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function ReferralCopyButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copyLink}
      className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold transition-all shadow-lg ${
        copied
          ? "bg-emerald-500 text-white shadow-emerald-500/30"
          : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 hover:scale-105"
      }`}
    >
      {copied ? <Check size={18} /> : <Copy size={18} />}
      {copied ? "Link copiato!" : "Copia link"}
    </button>
  );
}
