"use client";

import { useState, useEffect } from "react";

interface LocationSettingsFormProps {
  locationId: string;
  tenantSlug: string;
  onClose: () => void;
}

export default function LocationSettingsForm({ locationId, tenantSlug, onClose }: LocationSettingsFormProps) {
  const [paymentStrategy, setPaymentStrategy] = useState("OFF");
  const [paymentFixedAmount, setPaymentFixedAmount] = useState(5);
  const [paymentPercentage, setPaymentPercentage] = useState(20);
  const [paymentMandatory, setPaymentMandatory] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(function () {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/locations/" + locationId + "/settings?slug=" + tenantSlug);
      if (res.ok) {
        const data = await res.json();
        setPaymentStrategy(data.paymentStrategy ?? "OFF");
        setPaymentFixedAmount(data.paymentFixedAmount ?? 5);
        setPaymentPercentage(data.paymentPercentage ?? 20);
        setPaymentMandatory(data.paymentMandatory ?? false);
        setStripeAccountId(data.stripeAccountId ?? "");
      }
    } catch (e) {
      setError("Errore caricamento impostazioni");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/locations/" + locationId + "/settings?slug=" + tenantSlug, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smsCredits: 0,
          paymentStrategy,
          paymentFixedAmount: paymentStrategy !== "OFF" ? paymentFixedAmount : null,
          paymentPercentage: paymentStrategy !== "OFF" ? paymentPercentage : null,
          paymentMandatory: paymentStrategy !== "OFF" ? paymentMandatory : false,
          stripeAccountId: stripeAccountId || null,
        }),
      });

      if (res.ok) {
        onClose();
      } else {
        const err = await res.json();
        setError(err.error || "Errore salvataggio");
      }
    } catch (e) {
      setError("Errore di rete");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-[#0b1221] border border-[#1a2642] rounded-2xl p-8 text-center">
          <p className="text-slate-400">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-4 pt-[8vh] sm:pt-4">
      <div className="bg-[#0b1221] border border-[#1a2642] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-[#1a2642] flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Impostazioni Sede</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">X</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Strategia Pagamento</label>
            <select value={paymentStrategy} onChange={function (e) { setPaymentStrategy(e.target.value); }} className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none">
              <option value="OFF">Nessun pagamento online</option>
              <option value="FIXED">Importo fisso</option>
              <option value="PERCENTAGE">Percentuale</option>
            </select>
          </div>

          {paymentStrategy !== "OFF" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  {paymentStrategy === "FIXED" ? "Importo Fisso (€)" : "Percentuale (%)"}
                </label>
                <input type="number" min="0" step="0.01" value={paymentStrategy === "FIXED" ? paymentFixedAmount : paymentPercentage} onChange={function (e) {
                  if (paymentStrategy === "FIXED") { setPaymentFixedAmount(parseFloat(e.target.value) || 0); }
                  else { setPaymentPercentage(parseInt(e.target.value) || 0); }
                }} className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={paymentMandatory} onChange={function (e) { setPaymentMandatory(e.target.checked); }} className="w-4 h-4 rounded bg-[#131c31] border-[#1e2b4a] text-cyan-500 focus:ring-cyan-500" />
                <label className="text-sm text-slate-300">Pagamento obbligatorio</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Stripe Account ID</label>
                <input value={stripeAccountId} onChange={function (e) { setStripeAccountId(e.target.value); }} className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" placeholder="acct_..." />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50">
              {saving ? "Salvataggio..." : "Salva Impostazioni"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 bg-[#131c31] text-slate-300 font-medium rounded-xl hover:bg-[#1a2642] transition-all">
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
