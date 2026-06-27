"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetDemoButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const resetDemo = async () => {
    setLoading(true);
    setDone(false);

    try {
      const res = await fetch("/api/demo/reset", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Reset demo non riuscito.");
      }

      setDone(true);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Non riesco a ripristinare la demo adesso. Riprova tra poco.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={resetDemo}
      disabled={loading}
      className={`${
        compact
          ? "w-full justify-center text-xs px-3 py-2"
          : "flex-1 sm:flex-none text-sm px-5 py-2.5"
      } bg-yellow-400/10 hover:bg-yellow-400/20 disabled:opacity-60 text-yellow-300 border border-yellow-400/30 font-bold rounded-xl shadow-lg shadow-yellow-900/10 transition flex items-center gap-2 whitespace-nowrap`}
    >
      <span>{loading ? "⏳" : done ? "✅" : "↻"}</span>
      <span>{loading ? "Ripristino..." : done ? "Demo pronta" : "Reset demo"}</span>
    </button>
  );
}
