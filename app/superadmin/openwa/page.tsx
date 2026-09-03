"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type OpenWaSession = { id: string; status: string; ready: boolean };

type SessionState =
  | { loading: true }
  | { loading: false; ready: boolean; status?: string; configuredSessionId?: string; sessions?: OpenWaSession[]; qrCode?: string; error?: string };

export default function OpenWaReconnectPage() {
  const [state, setState] = useState<SessionState>({ loading: true });

  const loadStatus = useCallback(async () => {
    setState({ loading: true });
    try {
      const response = await fetch("/api/superadmin/openwa/session", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossibile leggere OpenWA.");
      if (!data.ready) {
        const qrResponse = await fetch("/api/superadmin/openwa/qr", { cache: "no-store" });
        const qrData = await qrResponse.json().catch(() => ({}));
        if (qrResponse.ok && typeof qrData.qrCode === "string") data.qrCode = qrData.qrCode;
      }
      setState({ loading: false, ...data });
    } catch (error) {
      setState({
        loading: false,
        ready: false,
        error: error instanceof Error ? error.message : "Impossibile leggere OpenWA.",
      });
    }
  }, []);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  return (
    <main className="min-h-screen bg-[#050814] px-4 py-8 text-slate-200 md:p-10">
      <div className="mx-auto max-w-xl">
        <Link href="/superadmin" className="text-sm font-medium text-cyan-300 transition hover:text-cyan-100">← Torna al pannello</Link>
        <section className="mt-6 rounded-3xl border border-cyan-400/20 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/40 md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Canale promemoria</p>
          <h1 className="mt-2 text-3xl font-black text-white">Collegamento WhatsApp</h1>

          {state.loading ? (
            <p className="mt-6 text-slate-300">Controllo la sessione OpenWA…</p>
          ) : state.ready ? (
            <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
              <p className="text-lg font-bold text-emerald-300">✓ WhatsApp è collegato</p>
              <p className="mt-1 text-sm text-slate-300">La sessione <b>{state.configuredSessionId}</b> è pronta: i promemoria possono essere inviati.</p>
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
                <p className="font-bold text-amber-200">Non aggiungere un altro dispositivo</p>
              <p className="mt-1 text-sm text-slate-300">NeatX è configurato sulla sessione <b>{state.configuredSessionId}</b>, ma quella sessione è <b>{state.status}</b>. Prima confrontiamo questo nome con la lista del tuo WhatsApp.</p>
              </div>

              {state.qrCode && (
                <div className="mt-6 rounded-2xl border border-cyan-400/30 bg-white p-5 text-center">
                  <p className="font-bold text-slate-900">Ricollega la sessione NeatX</p>
                  <p className="mt-1 text-sm text-slate-600">Scansiona questo QR dal numero NeatX. Non creare una nuova sessione.</p>
                  <img src={state.qrCode} alt="QR per ricollegare WhatsApp NeatX" className="mx-auto mt-4 h-64 w-64" />
                </div>
              )}

              <p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{state.error}</p>
            </>
          )}

          {!state.loading && state.sessions && state.sessions.length > 0 && (
            <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/60 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-300">Sessioni presenti su OpenWA</p>
              <ul className="mt-3 space-y-2 text-sm">
                {state.sessions.map((session) => (
                  <li key={session.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-900 px-3 py-2">
                    <span className="font-medium text-white">{session.id}</span>
                    <span className={session.ready ? "text-emerald-300" : "text-amber-300"}>{session.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => void loadStatus()}
            className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Aggiorna stato
          </button>
        </section>
      </div>
    </main>
  );
}
