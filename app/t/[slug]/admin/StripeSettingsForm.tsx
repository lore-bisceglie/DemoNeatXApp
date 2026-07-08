"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StripeSettingsForm({ 
  tenantId, 
  initialStrategy, 
  initialFixed, 
  initialPercentage,
  initialMandatory
}: { 
  tenantId: string;
  initialStrategy: string;
  initialFixed: number | null;
  initialPercentage: number | null;
  initialMandatory: boolean;
}) {
  const router = useRouter();
  const [strategy, setStrategy] = useState(initialStrategy || "OFF");
  const [fixedAmount, setFixedAmount] = useState(initialFixed || 5);
  const [percentage, setPercentage] = useState(initialPercentage || 20);
  const [isMandatory, setIsMandatory] = useState(initialMandatory);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/tenant/settings/stripe", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          paymentStrategy: strategy,
          paymentFixedAmount: fixedAmount,
          paymentPercentage: percentage,
          paymentMandatory: isMandatory,
        }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Errore durante il salvataggio");
      }
    } catch (e) {
      console.error(e);
      alert("Errore di rete");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-6 border-t border-[#1e2b4a] pt-6">
      <h3 className="text-sm font-bold text-white mb-4">Regole di Pagamento</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-2">
            Tipo di Anticipo Richiesto
          </label>
          <select 
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff] transition"
          >
            <option value="OFF">Nessun pagamento anticipato</option>
            <option value="FIXED">Caparra Fissa (es. 5€)</option>
            <option value="PERCENTAGE">Acconto in Percentuale (es. 30%)</option>
            <option value="FULL">Intero Importo del Servizio</option>
          </select>
        </div>

        {strategy === "FIXED" && (
          <div>
            <label className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-2">
              Importo Caparra Fissa (€)
            </label>
            <input 
              type="number"
              min="1"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(Number(e.target.value))}
              className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff] transition"
            />
          </div>
        )}

        {strategy === "PERCENTAGE" && (
          <div>
            <label className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-2">
              Percentuale di Acconto (%)
            </label>
            <input 
              type="number"
              min="1"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff] transition"
            />
          </div>
        )}

        {strategy !== "OFF" && strategy !== "FULL" && (
          <div className="flex items-center justify-between p-4 bg-[#1e2b4a]/30 border border-[#1e2b4a] rounded-xl mt-4">
            <div>
              <p className="text-white text-sm font-bold">Caparra Obbligatoria</p>
              <p className="text-slate-400 text-xs mt-1">
                Se disabilitata, il cliente potrà scegliere se pagare in sede o anticipare su Stripe.
              </p>
            </div>
            <label className="relative flex items-center cursor-pointer ml-4 group">
              <input
                type="checkbox"
                className="sr-only"
                checked={isMandatory}
                onChange={(e) => setIsMandatory(e.target.checked)}
              />
              <div className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${isMandatory ? 'bg-emerald-500' : 'bg-[#131c31] border border-[#1e2b4a]'}`}>
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isMandatory ? 'translate-x-7' : 'translate-x-0'}`}></div>
              </div>
              <span className={`ml-3 text-xs font-bold w-12 ${isMandatory ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isMandatory ? 'ATTIVA' : 'SPENTA'}
              </span>
            </label>
          </div>
        )}

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-[#1e2b4a] hover:bg-[#2a3c6b] text-white font-bold py-3 rounded-xl transition"
        >
          {isSaving ? "Salvataggio..." : "Salva Regole"}
        </button>
      </div>
    </div>
  );
}
