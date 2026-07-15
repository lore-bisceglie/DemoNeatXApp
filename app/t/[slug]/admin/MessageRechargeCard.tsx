"use client";

import { useState } from "react";

const PACKAGES = [
  { id: "sms_500",  credits: 500,  price: "39€",  popular: false },
  { id: "sms_1000", credits: 1000, price: "69€",  popular: true  },
  { id: "sms_2000", credits: 2000, price: "149€", popular: false },
];

export default function MessageRechargeCard({
  tenantId,
  slug,
  currentCredits,
}: {
  tenantId: string;
  slug: string;
  currentCredits: number;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showPackages, setShowPackages] = useState(false);
  const isLow = currentCredits <= 20;

  const handlePurchase = async (packageId: string) => {
    setLoading(packageId);
    try {
      const res = await fetch("/api/checkout/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, packageId, slug }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Errore: " + (data.error || "Riprova più tardi"));
      }
    } catch {
      alert("Errore di connessione");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className={`p-8 rounded-3xl shadow-2xl border flex flex-col justify-between h-full min-h-[320px] relative overflow-hidden transition-all duration-300 hover:-translate-y-1 group ${
        isLow
          ? "bg-gradient-to-br from-red-950/40 to-[#0b1221] border-red-900/50 shadow-red-900/20 hover:border-red-500/50 hover:shadow-red-500/20"
          : "bg-gradient-to-br from-[#0b1221] to-[#0f192b] border-white/5 hover:border-indigo-500/30 hover:shadow-indigo-500/10"
      }`}
    >
      <div className={`absolute -right-6 -bottom-6 text-9xl pointer-events-none group-hover:scale-110 transition-transform duration-500 ${isLow ? 'opacity-[0.05] text-red-500' : 'opacity-[0.02]'}`}>
        💬
      </div>

      <div>
        <h2
          className={`text-xs font-bold mb-4 uppercase tracking-widest flex items-center justify-between transition-colors ${
            isLow ? "text-red-400" : "text-slate-400 group-hover:text-indigo-400"
          }`}
        >
          <span className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg shadow-[0_0_10px_rgba(99,102,241,0.2)] ${isLow ? "bg-red-500/10 text-red-500 shadow-red-500/20" : "bg-indigo-500/10 text-indigo-400"}`}>💬</span>
            WhatsApp Auto
          </span>
        </h2>

        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col gap-1 z-10 relative">
            <span
              className={`text-5xl font-black bg-clip-text text-transparent drop-shadow-sm ${
                isLow ? "bg-gradient-to-br from-red-400 to-red-600 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-gradient-to-br from-indigo-400 to-blue-200 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              }`}
            >
              {currentCredits}
            </span>
            <span className="text-slate-500 font-bold text-sm tracking-wide mt-1">
              crediti totali
            </span>
          </div>

          <button
            onClick={() => setShowPackages(!showPackages)}
            className={`relative overflow-hidden text-xs px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg z-10 group/btn ${
              isLow
                ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 shadow-red-500/10 animate-pulse"
                : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 shadow-indigo-500/10"
            }`}
          >
            {/* Shimmer effect hover */}
            {!showPackages && !isLow && (
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]" />
            )}
            <span className="relative z-10">{showPackages ? "Chiudi ✕" : "Ricarica 🔋"}</span>
          </button>
        </div>
      </div>

      {showPackages && (
        <div className="mt-4 pt-4 border-t border-[#1e2b4a] grid grid-cols-3 gap-2">
          {PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handlePurchase(pkg.id)}
              disabled={loading !== null}
              className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl border text-center transition-all duration-200 ${
                loading === pkg.id
                  ? "opacity-50 cursor-wait"
                  : "hover:scale-105 cursor-pointer"
              } ${
                pkg.popular
                  ? "bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                  : "bg-[#131c31] border-[#1e2b4a] hover:border-slate-500/50"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Popolare
                </span>
              )}
              <span className="text-lg font-black text-white">
                {pkg.credits}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                messaggi
              </span>
              <span
                className={`text-sm font-extrabold mt-1 ${
                  pkg.popular ? "text-emerald-400" : "text-[#00b4ff]"
                }`}
              >
                {loading === pkg.id ? "..." : pkg.price}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
