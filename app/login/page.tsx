"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Password non corretta. Riprova.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4 font-sans text-slate-200">
      <div className="bg-[#0b1221] max-w-sm w-full rounded-3xl shadow-2xl shadow-cyan-900/10 border border-[#1a2642] p-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          <span className="text-white">Neat</span><span className="text-[#00b4ff]">X</span> <span className="text-slate-500 font-medium">| Auth</span>
        </h1>
        <p className="text-xs text-slate-400 mb-8">Area riservata. Inserisci la password per accedere all'Agenda.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition text-center tracking-widest"
          />
          {error && <p className="text-red-400 text-xs font-bold">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-[#00b4ff] hover:bg-cyan-400 text-[#050814] font-bold py-3 rounded-xl transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Accesso in corso..." : "🔑 Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
}