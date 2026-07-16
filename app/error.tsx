"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("NeatX Global Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050814] text-slate-200 px-6 font-sans relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-500/10 blur-[100px] rounded-full pointer-events-none opacity-50"></div>
      
      <div className="relative z-10 bg-[#0b1221]/80 backdrop-blur-xl border border-red-500/20 p-10 rounded-3xl shadow-2xl text-center max-w-md w-full">
        <div className="w-16 h-16 mx-auto mb-6 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-3">Qualcosa è andato storto.</h2>
        <p className="text-sm text-slate-400 mb-8 font-medium">
          Non preoccuparti, il nostro team è stato avvisato. Nessun dato è andato perso.
        </p>
        <button
          onClick={() => reset()}
          className="w-full py-4 bg-[#00b4ff] hover:bg-cyan-300 text-[#03111f] font-extrabold rounded-2xl transition-all shadow-[0_0_20px_-5px_rgba(0,180,255,0.4)]"
          aria-label="Riprova a caricare la pagina"
        >
          Riprova Subito
        </button>
      </div>
    </div>
  );
}
