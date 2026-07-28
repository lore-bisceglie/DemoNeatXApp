"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronRight, Loader2 } from "lucide-react";

export type FirstAvailableResult = {
  found: boolean;
  date?: string;
  time?: string;
  locationId?: string | null;
};

interface FirstAvailableButtonProps {
  tenantId: string;
  serviceId: string;
  locationId?: string | null;
  staffId?: string | null;
  onFound: (result: FirstAvailableResult) => void;
}

export function FirstAvailableButton({
  tenantId,
  serviceId,
  locationId,
  staffId,
  onFound,
}: FirstAvailableButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    requestIdRef.current += 1;
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    setLoading(false);
    setError("");

    return () => activeRequestRef.current?.abort();
  }, [tenantId, serviceId, locationId, staffId]);

  async function handleClick() {
    if (loading) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const controller = new AbortController();
    activeRequestRef.current = controller;
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ tenantId, serviceId });
      if (locationId) params.set("locationId", locationId);
      if (staffId && staffId !== "any") params.set("staffId", staffId);

      const response = await fetch(`/api/availability/first?${params.toString()}`, {
        signal: controller.signal,
      });
      const result = (await response.json()) as FirstAvailableResult & { error?: string };

      if (requestId !== requestIdRef.current) return;

      if (!response.ok) {
        throw new Error(result.error || "Non è stato possibile cercare il primo posto libero.");
      }

      if (!result.found || !result.date || !result.time) {
        setError("Non ci sono appuntamenti disponibili nei prossimi 60 giorni.");
        return;
      }

      onFound(result);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === "AbortError") return;
      if (requestId !== requestIdRef.current) return;
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Non è stato possibile cercare il primo posto libero.",
      );
    } finally {
      if (requestId === requestIdRef.current) {
        activeRequestRef.current = null;
        setLoading(false);
      }
    }
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
        className="w-full rounded-2xl border border-cyan-500/30 bg-[#07182b] px-4 py-4 text-left transition-all hover:border-cyan-400/60 hover:bg-[#0a2038] active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Calendar size={18} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-white">
              {loading ? "Cerco il primo posto libero..." : "Trova il primo posto libero"}
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-slate-300">
              {loading
                ? "Controllo l’agenda del gestore."
                : "Ci pensiamo noi a farti saltare al primo orario disponibile."}
            </span>
          </span>
          {!loading && <ChevronRight size={20} className="shrink-0 text-cyan-400" />}
        </span>
      </button>

      {error && (
        <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-center text-xs font-medium text-amber-300">
          {error}
        </p>
      )}
    </div>
  );
}
