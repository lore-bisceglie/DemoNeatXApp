"use client";

import { useState } from "react";

const PACKAGES = [
  { id: "sms_500",  credits: 500,  price: "39€",  popular: false },
  { id: "sms_1000", credits: 1000, price: "69€",  popular: true  },
  { id: "sms_2000", credits: 2000, price: "149€", popular: false },
];

type LocationBrief = { id: string; name: string; settings?: { smsCredits: number } | null };

export default function MessageRechargeCard({
  tenantId,
  slug,
  currentCredits,
  locations,
}: {
  tenantId: string;
  slug: string;
  currentCredits: number;
  locations?: LocationBrief[];
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showPackages, setShowPackages] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const isLow = currentCredits <= 20;
  const hasLocations = locations && locations.length > 0;

  const handlePurchase = async (packageId: string) => {
    setLoading(packageId);
    try {
      const res = await fetch("/api/checkout/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, packageId, slug, locationId: selectedLocationId || undefined }),
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

  const displayCredits = selectedLocationId
    ? locations?.find((l) => l.id === selectedLocationId)?.settings?.smsCredits ?? 0
    : currentCredits;
  const isLowDisplay = displayCredits <= 20;

  return (
    <div
      className={`p-6 rounded-3xl shadow-xl border flex flex-col justify-between h-full min-h-[140px] relative overflow-hidden transition-all ${
        isLowDisplay
          ? "bg-red-950/20 border-red-900/50 shadow-red-900/20"
          : "bg-[#0b1221] border-[#1a2642] shadow-cyan-900/10"
      }`}
    >
      <div className="absolute -right-4 -top-4 text-8xl opacity-[0.03] pointer-events-none">
        💬
      </div>

      <div>
        <h2
          className={`text-xs font-bold mb-2 uppercase tracking-widest flex items-center justify-between ${
            isLowDisplay ? "text-red-400" : "text-slate-500"
          }`}
        >
          <span className="flex items-center gap-2">
            <span>💬</span>
            WhatsApp Auto
          </span>
        </h2>

        {hasLocations && (
          <select
            value={selectedLocationId || ""}
            onChange={(e) => setSelectedLocationId(e.target.value || null)}
            className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-lg p-2 text-xs text-white mb-3 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Tutte le sedi (globale: {currentCredits})</option>
            {locations!.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.settings?.smsCredits ?? 0} crediti)
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-end gap-3">
            <span
              className={`text-4xl font-extrabold ${
                isLowDisplay ? "text-red-500" : "text-white"
              }`}
            >
              {displayCredits}
            </span>
            <span className="text-slate-400 font-medium mb-1 text-sm">
              {selectedLocationId ? "crediti sede" : "crediti globali"}
            </span>
          </div>

          <button
            onClick={() => setShowPackages(!showPackages)}
            className={`text-xs px-3 py-2 rounded-lg font-bold transition-all shadow-lg ${
              isLowDisplay
                ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 shadow-red-500/10 animate-pulse"
                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/10"
            }`}
          >
            {showPackages ? "Chiudi ✕" : "Ricarica 🔋"}
          </button>
        </div>
      </div>

      {/* Pacchetti acquistabili */}
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
