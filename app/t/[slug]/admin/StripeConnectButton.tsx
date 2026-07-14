"use client";

import { useState } from "react";

export default function StripeConnectButton({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/stripe/connect?tenantId=${tenantId}`);
      if (res.redirected) {
        window.location.href = res.url;
      } else {
        const data = await res.json();
        if (data.error) {
          if (data.error.includes("platform profile") || data.error.includes("complete your platform")) {
            setError("Stripe sta ancora verificando la tua identità. La configurazione è quasi completa — riprova tra qualche minuto.");
          } else if (data.error.includes("account already exists") || data.error.includes("already has an account")) {
            setError("Questo salone ha già un account Stripe collegato.");
          } else if (data.error.includes("transfers")) {
            setError("Abilita i trasferimenti su https://dashboard.stripe.com/settings/connect/transfers e riprova.");
          } else if (data.error.includes("managing losses")) {
            setError("Manca un'impostazione su Stripe. Vai su https://dashboard.stripe.com/settings/connect/platform-profile e conferma le responsabilità sulle perdite.");
          } else {
            setError("Errore Stripe: " + data.error);
          }
        }
      }
    } catch {
      setError("Errore di rete. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="bg-[#007aff] hover:bg-[#00b4ff] text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap disabled:opacity-50"
      >
        {loading ? "Connessione in corso..." : "Collega IBAN (Solo 2 minuti)"}
      </button>
      {error && (
        <p className="text-xs text-red-400 mt-2 max-w-[280px] text-right">{error}</p>
      )}
    </div>
  );
}