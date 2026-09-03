"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type SessionState =
  | { loading: true }
  | { loading: false; ready: true; status: string }
  | { loading: false; ready: false; status?: string; qrDataUrl?: string | null; error?: string };

export default function OpenWaReconnectPage() {
  const [state, setState] = useState<SessionState>({ loading: true });

  const loadStatus = useCallback(async () => {
    setState({ loading: true });
    try {
      const response = await fetch("/api/superadmin/openwa/session", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossibile leggere OpenWA.");
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
              <p className="mt-1 text-sm text-slate-300">La sessione è pronta: i promemoria possono essere inviati.</p>
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
                <p className="font-bold text-amber-200">WhatsApp deve essere ricollegato</p>
                <p className="mt-1 text-sm text-slate-300">Apri WhatsApp sul telefono, vai in <b>Impostazioni → Dispositivi collegati → Collega un dispositivo</b> e inquadra questo QR.</p>
              </div>

              {state.qrDataUrl ? (
                <div className="mt-6 rounded-2xl bg-white p-4">
                  {/* The QR is intentionally served only by the authenticated SuperAdmin route. */}
                  <Image src={state.qrDataUrl} alt="QR per ricollegare WhatsApp" width={640} height={640} unoptimized className="mx-auto aspect-square w-full max-w-sm" />
                </div>
              ) : (
                <p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{state.error || "QR non disponibile."}</p>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => void loadStatus()}
            className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Aggiorna stato / QR
          </button>
        </section>
      </div>
    </main>
  );
}
