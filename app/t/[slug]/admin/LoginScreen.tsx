"use client";

import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";

export default function LoginScreen({
  slug,
  tenantName,
  ownerEmail,
  showLegacyHint,
}: {
  slug: string;
  tenantName: string;
  ownerEmail?: string | null;
  showLegacyHint?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const needsEmail = Boolean(ownerEmail);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/tenant-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Credenziali non valide.");
      return;
    }

    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4 selection:bg-[#00b4ff]/30">
      <div className="w-full max-w-md bg-[#0b1221] p-8 rounded-3xl border border-[#1a2642] shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-cyan-500/10 text-cyan-300 rounded-2xl flex items-center justify-center border border-cyan-500/20">
            <Lock size={30} />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-white text-center mb-2">Area Privata</h1>
        <p className="text-slate-400 text-center mb-8 font-medium">Gestione {tenantName}</p>

        {showLegacyHint && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <p className="text-amber-200 text-xs font-bold leading-relaxed">
              Account creato prima del nuovo login: puoi entrare con la vecchia password gestionale.
            </p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {needsEmail && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Email proprietario
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-[#131c31] border border-[#1e2b4a] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#00b4ff] transition-colors"
                placeholder="nome@email.it"
                autoFocus
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus={!needsEmail}
              className="w-full bg-[#131c31] border border-[#1e2b4a] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#00b4ff] transition-colors"
              placeholder="La password scelta in registrazione"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#00b4ff] to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Accedi
          </button>
        </form>
      </div>
    </div>
  );
}
