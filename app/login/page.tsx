"use client";

import Link from "next/link";
import { ArrowRight, Loader2, Lock, Store, UserPlus } from "lucide-react";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/account-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Email o password non valide.");
      return;
    }

    window.location.href = data.adminUrl || "/registrazione";
  };

  return (
    <main className="min-h-screen bg-[#050814] px-5 py-8 text-slate-200">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link href="/" className="text-2xl font-extrabold tracking-tight">
          <span className="text-white">Neat</span>
          <span className="text-[#00b4ff]">X</span>
        </Link>
        <Link
          href="/registrazione"
          className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-cyan-300"
        >
          <UserPlus size={14} />
          Registrati
        </Link>
      </div>

      <section className="mx-auto grid min-h-[calc(100vh-96px)] w-full max-w-6xl grid-cols-1 items-center gap-8 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-cyan-300">
            <Store size={15} />
            Area proprietario
          </div>
          <h1 className="max-w-xl text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Rientra nella tua agenda NeatX.
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-slate-400 sm:text-lg">
            Usa l'email e la password scelte in registrazione. Ti porto direttamente nella dashboard del tuo negozio.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {["Agenda privata", "Pagina clienti", "Trial 14 giorni"].map((point) => (
              <div key={point} className="rounded-2xl border border-[#1a2642] bg-[#0b1221] p-4">
                <p className="text-sm font-extrabold text-white">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[#1a2642] bg-[#0b1221] p-6 shadow-2xl shadow-cyan-950/20">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
            <Lock size={26} />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-cyan-300">Login</p>
          <h2 className="mt-1 text-2xl font-extrabold text-white">Accedi al tuo negozio</h2>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                Email proprietario
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-[#1e2b4a] bg-[#050814] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                placeholder="nome@email.it"
                autoFocus
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-[#1e2b4a] bg-[#050814] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                placeholder="La password scelta in registrazione"
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 text-base font-extrabold text-[#03111f] shadow-xl shadow-cyan-950/40 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              Entra nella dashboard
            </button>
          </form>

          <div className="mt-5 rounded-2xl border border-[#1e2b4a] bg-[#050814] p-4 text-sm font-medium text-slate-400">
            Non hai ancora un negozio?
            <Link href="/registrazione" className="ml-1 font-extrabold text-cyan-300 hover:text-cyan-200">
              Crea la prova gratis.
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
