"use client";

import { Download } from "lucide-react";
import { useState } from "react";

type Props = {
  tenantId: string;
  variant?: "toolbar" | "menu";
  onDownload?: () => void;
};

export default function CommercialistaExportButton({ tenantId, variant = "toolbar", onDownload }: Props) {
  const [month, setMonth] = useState(() => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit" }).format(new Date()));
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/export/timesheets?tenantId=${encodeURIComponent(tenantId)}&month=${encodeURIComponent(month)}`);
      if (!response.ok) throw new Error(await response.text());
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `presenze_${month}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      onDownload?.();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Export non riuscito");
    } finally { setLoading(false); }
  };

  if (variant === "menu") {
    return <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-1 text-slate-300 transition-colors hover:border-emerald-500/35 hover:bg-emerald-500/[0.08]">
      <button type="button" onClick={() => void download()} disabled={loading || !month} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left disabled:opacity-50" title="Scarica il report di presenze, assenze e appuntamenti">
        <div className="shrink-0 rounded-lg bg-emerald-500/20 p-1.5 text-emerald-400"><Download size={16} /></div>
        <span className="min-w-0"><span className="block text-sm font-bold text-emerald-300">{loading ? "Creo il CSV..." : "Export commercialista"}</span><span className="mt-0.5 block text-[10px] font-medium text-slate-500">Presenze, assenze e appuntamenti</span></span>
      </button>
      <label className="mx-2 flex items-center justify-between border-t border-emerald-500/15 px-1 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Periodo report</span>
        <input aria-label="Mese report commercialista" type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="w-[100px] rounded-md border border-emerald-500/20 bg-[#0b1221] px-1.5 py-1 text-[10px] font-bold text-emerald-200 outline-none focus:border-emerald-400" />
      </label>
    </div>;
  }

  return <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-1.5">
    <label className="sr-only" htmlFor="commercialista-month">Mese report commercialista</label>
    <input id="commercialista-month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="rounded-lg border-0 bg-transparent px-1.5 py-1 text-xs font-bold text-slate-300 outline-none" />
    <button type="button" onClick={() => void download()} disabled={loading || !month} className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-extrabold text-[#03111f] transition hover:bg-emerald-400 disabled:opacity-50" title="Scarica report presenze, assenze e appuntamenti">
      <Download size={14} /> {loading ? "Creo..." : "Export commercialista"}
    </button>
  </div>;
}
