"use client";

import { AlertTriangle, Check, Clock3, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type AppointmentConflict = { customerName: string; serviceName: string; start: string; end: string };
type LeaveRequest = {
  id: string;
  date: string;
  type: string;
  start: string | null;
  end: string | null;
  status: string;
  staff: { id: string; name: string };
  conflicts: AppointmentConflict[];
};

export default function StaffRequestsPanel({ tenantId, enabled }: { tenantId: string; enabled: boolean }) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    const response = await fetch(`/api/staff/requests?tenantId=${encodeURIComponent(tenantId)}&status=pending`, { cache: "no-store" });
    if (response.ok) setRequests((await response.json()).requests || []);
  }, [enabled, tenantId]);

  useEffect(() => {
    void load();
    if (!enabled) return;
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, [enabled, load]);

  const review = async (item: LeaveRequest, status: "approved" | "rejected") => {
    if (status === "approved" && item.conflicts.length > 0) {
      setError("Sposta prima i clienti coinvolti: la richiesta resterà in attesa.");
      return;
    }
    setBusy(item.id);
    setError(null);
    try {
      const response = await fetch("/api/staff/requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: item.id, status }) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setError(result.error || "Non riesco a gestire la richiesta.");
        return;
      }
      setRequests((items) => items.filter((request) => request.id !== item.id));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="border-b border-[#1e2b4a] bg-[#0b1221] px-5 py-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400"><Clock3 size={14} className={requests.length > 0 ? "text-amber-400" : "text-slate-600"} /> Richieste assenza {requests.length > 0 && <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] text-[#211500]">{requests.length}</span>}</h3>
        {requests.length === 0 && <span className="text-[10px] font-bold text-slate-600">Tutto in ordine</span>}
      </div>
      {error && <p className="mt-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-200">{error}</p>}
      {requests.length > 0 && <div className="mt-2 space-y-2">{requests.map((item) => {
        const cancellationRequested = item.status === "cancellation_requested";
        return <div key={item.id} className={`rounded-xl border p-2.5 ${cancellationRequested ? "border-violet-400/30 bg-violet-500/10" : "border-amber-500/20 bg-amber-500/5"}`}><div className="flex items-center gap-2"><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-white">{item.staff.name}</p><p className={cancellationRequested ? "text-[11px] text-violet-200" : "text-[11px] text-amber-200"}>{new Date(`${item.date}T12:00:00Z`).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })} · {cancellationRequested ? "Annullamento richiesto" : item.type === "ferie" ? "Giornata intera" : `${item.start}–${item.end}`}</p></div><button type="button" disabled={busy === item.id || (!cancellationRequested && item.conflicts.length > 0)} onClick={() => void review(item, "approved")} className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-30" title={cancellationRequested ? "Conferma annullamento" : item.conflicts.length > 0 ? "Sposta prima i clienti coinvolti" : "Approva"}><Check size={15} /></button><button type="button" disabled={busy === item.id} onClick={() => void review(item, "rejected")} className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:opacity-50" title={cancellationRequested ? "Mantieni assenza" : "Rifiuta"}><X size={15} /></button></div>{cancellationRequested && <p className="mt-2 rounded-lg border border-violet-300/20 bg-violet-300/5 px-2 py-1.5 text-[10px] font-bold text-violet-100/80">✓ conferma l&apos;annullamento · ✕ mantiene l&apos;assenza</p>}{item.conflicts.length > 0 && <div className="mt-2 rounded-lg border border-red-400/25 bg-red-400/10 p-2"><p className="flex items-center gap-1 text-[11px] font-black text-red-200"><AlertTriangle size={13} /> {item.conflicts.length} {item.conflicts.length === 1 ? "cliente da spostare" : "clienti da spostare"}</p><div className="mt-1 space-y-0.5">{item.conflicts.map((conflict) => <p key={`${conflict.customerName}-${conflict.start}`} className="text-[10px] text-red-100/75">{conflict.start}–{conflict.end} · {conflict.customerName} · {conflict.serviceName}</p>)}</div></div>}</div>;
      })}</div>}
    </section>
  );
}
