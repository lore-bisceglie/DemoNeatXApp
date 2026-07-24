"use client";

import { CreditCard } from "lucide-react";
import { useState } from "react";

export default function PortalButton({ slug, className }: { slug: string; className?: string }) {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Errore durante l'apertura del portale");
      }
    } catch {
      alert("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={openPortal}
      disabled={loading}
      className={className || "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-150 flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 hover:scale-[1.03] disabled:opacity-50"}
    >
      <CreditCard size={16} />
      {loading ? "Apertura..." : "Gestione Abbonamento"}
    </button>
  );
}
