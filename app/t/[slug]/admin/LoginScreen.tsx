"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginScreen({ slug, correctPassword, tenantName }: { slug: string, correctPassword: string, tenantName: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      document.cookie = `admin_auth_${slug}=${password}; path=/; max-age=31536000`;
      router.refresh();
    } else {
      setError("Password errata.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4 selection:bg-[#00b4ff]/30">
      <div className="w-full max-w-md bg-[#0b1221] p-8 rounded-3xl border border-[#1a2642] shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center text-3xl border border-purple-500/20">
            🔒
          </div>
        </div>
        
        <h1 className="text-2xl font-extrabold text-white text-center mb-2">Area Privata</h1>
        <p className="text-slate-400 text-center mb-8 font-medium">Gestione {tenantName}</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Password Gestionale
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full bg-[#131c31] border border-[#1e2b4a] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#00b4ff] transition-colors"
              placeholder="Inserisci la password..."
            />
          </div>

          {error && <div className="text-red-400 text-sm font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center">{error}</div>}

          <button 
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-[#00b4ff] to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-cyan-500/25"
          >
            Accedi
          </button>
        </form>
      </div>
    </div>
  );
}
