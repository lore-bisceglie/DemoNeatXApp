"use client";

import { useState } from "react";
import { FileSpreadsheet, RefreshCw, CheckCircle2 } from "lucide-react";

export default function GoogleSheetsSync({
  tenantId,
  initialUrl,
}: {
  tenantId: string;
  initialUrl?: string | null;
}) {
  const [url, setUrl] = useState(initialUrl || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSync = async () => {
    setMessage("");
    setError("");
    if (!url.includes("docs.google.com/spreadsheets")) {
      setError("Inserisci un link Google Sheets valido.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tenant/sync-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, url }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Errore sconosciuto");
      setMessage(data.message || "Sincronizzato!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-emerald-500/20 p-2 rounded-lg">
          <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Orari Staff (Google Sheets)</h2>
          <p className="text-sm text-slate-400">
            Incolla il link del tuo foglio Excel condiviso per aggiornare in automatico i turni.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/.../edit"
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
        />
        <button
          onClick={handleSync}
          disabled={loading || !url}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
          Sincronizza Ora
        </button>
      </div>

      {message && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {message}
        </div>
      )}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
