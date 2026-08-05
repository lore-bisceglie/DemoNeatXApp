"use client";

import { Copy, Link2, RefreshCw, ShieldOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Props = { staffId: string };

async function readJson(response: Response): Promise<{ active?: boolean; error?: string; url?: string }> {
  const body = await response.text();
  if (!body) return {};
  try { return JSON.parse(body) as { active?: boolean; error?: string; url?: string }; }
  catch { return { error: response.ok ? undefined : "Il server non ha restituito una risposta valida." }; }
}

export default function StaffAccessControls({ staffId }: Props) {
  const [active, setActive] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const response = await fetch(`/api/staff/access?staffId=${encodeURIComponent(staffId)}`);
    const data = await readJson(response);
    if (response.ok) setActive(Boolean(data.active));
    else setMessage(data.error || "Impossibile verificare l'accesso dipendente.");
  }, [staffId]);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  const generate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/staff/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ staffId }) });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "Generazione non riuscita");
      if (!data.url) throw new Error("Il link non è stato creato. Riprova.");
      setUrl(data.url);
      setActive(true);
      setMessage("Nuovo link generato: quello precedente è stato revocato.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Generazione non riuscita"); }
    finally { setLoading(false); }
  };

  const revoke = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/staff/access", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ staffId }) });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "Revoca non riuscita");
      setActive(false); setUrl(null); setMessage("Link revocato. Il cellulare non può più accedere.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Revoca non riuscita"); }
    finally { setLoading(false); }
  };

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setMessage("Link copiato negli appunti.");
  };

  return <section id="tour-staff-link" className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
    <div className="flex items-start justify-between gap-3"><div><h4 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-cyan-300"><Link2 size={14} /> Accesso dipendente</h4><p className="mt-1 text-xs leading-relaxed text-slate-500">Link permanente, senza password. Generandone uno nuovo, il precedente viene invalidato.</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${active ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-500"}`}>{active ? "ATTIVO" : "NON ATTIVO"}</span></div>
    {url && <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#1e2b4a] bg-[#0b1221] p-2"><span className="min-w-0 flex-1 truncate text-[10px] text-slate-400">{url}</span><button type="button" onClick={() => void copy()} className="flex items-center gap-1 rounded-lg bg-cyan-500/15 px-2 py-1.5 text-[10px] font-bold text-cyan-300 hover:bg-cyan-500/25"><Copy size={12} /> Copia</button></div>}
    <div className="mt-3 flex gap-2"><button type="button" onClick={() => void generate()} disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-3 py-2.5 text-xs font-extrabold text-[#03111f] transition hover:bg-cyan-400 disabled:opacity-50"><RefreshCw size={14} /> {active ? "Rigenera link" : "Genera link staff"}</button>{active && <button type="button" onClick={() => void revoke()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50"><ShieldOff size={14} /> Revoca</button>}</div>
    {message && <p className="mt-2 text-[11px] font-bold text-slate-400">{message}</p>}
  </section>;
}
