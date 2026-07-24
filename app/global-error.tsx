"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    fetch("/api/syslog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        url: window.location.href,
      }),
    }).catch(console.error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-[#060d18] flex items-center justify-center p-4">
          <div className="bg-[#0b1221] border border-red-500/30 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl shadow-red-500/10">
            <div className="text-5xl mb-4">🚨</div>
            <h2 className="text-xl font-bold text-white mb-2">Ops! Errore Fatale</h2>
            <p className="text-slate-400 text-sm mb-6">
              Qualcosa è andato seriamente storto. Abbiamo già inviato una notifica automatica al team tecnico per risolvere il problema.
            </p>
            <button
              onClick={() => reset()}
              className="bg-white text-black px-6 py-2 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Riprova
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
