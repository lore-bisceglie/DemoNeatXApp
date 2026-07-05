"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-extrabold text-red-400 mb-4">Errore Dashboard</h1>
        <pre className="text-sm text-red-200 bg-black/30 p-4 rounded-xl overflow-auto max-h-96 whitespace-pre-wrap font-mono">
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
        <button
          onClick={reset}
          className="mt-6 px-6 py-3 bg-[#00b4ff] text-black font-bold rounded-xl hover:bg-cyan-400 transition"
        >
          Riprova
        </button>
      </div>
    </div>
  );
}
