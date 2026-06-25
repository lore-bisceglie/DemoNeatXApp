"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [username, setUsername] = useState("");
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
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      // 🚀 Hard redirect: forza il browser a ricaricare la pagina portando con sé il nuovo Cookie
      window.location.href = "/dashboard"; 
    } else {
      setError("Credenziali non valide. Riprova.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4 font-sans text-slate-200">
      <div className="bg-[#0b1221] max-w-sm w-full rounded-3xl shadow-2xl shadow-cyan-900/10 border border-[#1a2642] p-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          <span className="text-white">Neat</span><span className="text-[#00b4ff]">X</span> <span className="text-slate-500 font-medium">| Auth</span>
        </h1>
        <p className="text-xs text-slate-400 mb-8">Area riservata. Inserisci ID e Password per accedere all'Agenda.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="ID Utente"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition text-center tracking-widest placeholder-slate-500"
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition text-center tracking-widest placeholder-slate-500"
          />
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || !username}
            className="w-full bg-[#00b4ff] hover:bg-cyan-400 text-[#050814] font-bold py-3 rounded-xl transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Accesso in corso..." : "🔑 Accedi all'Agenda"}
          </button>
        </form>
      </div>
    </div>
  );
}