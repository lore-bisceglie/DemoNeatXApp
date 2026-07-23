"use client";

import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Store, UserPlus } from "lucide-react";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [verificationSlug, setVerificationSlug] = useState("");
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNeedsVerification(false);
    setMessage("");
    setVerificationSlug("");

    const res = await fetch("/api/account-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      if (data.needsVerification) {
        setNeedsVerification(true);
        setUnverifiedEmail(data.email || email);
        if (typeof data.slug === "string") setVerificationSlug(data.slug);
      }
      setError(data.error || "Email o password non valide.");
      return;
    }

    window.location.href = data.adminUrl || "/registrazione";
  };

  const handleRecovery = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/tenant-password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Non è stato possibile inviare il link.");
      return;
    }
    setMessage(data.message || "Controlla la tua casella di posta.");
  };

  const resendVerification = async () => {
    setSecondaryLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/verification/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: verificationSlug, email }),
    });
    const data = await res.json().catch(() => ({}));
    setSecondaryLoading(false);
    if (!res.ok) {
      setError(data.error || "Non è stato possibile inviare il link.");
      return;
    }
    setMessage(data.message || "Controlla la tua casella di posta.");
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
            {recoveryMode ? <Mail size={26} /> : <Lock size={26} />}
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-cyan-300">{recoveryMode ? "Recupero" : "Login"}</p>
          <h2 className="mt-1 text-2xl font-extrabold text-white">{recoveryMode ? "Recupera la password" : "Accedi al tuo negozio"}</h2>

          <form onSubmit={recoveryMode ? handleRecovery : handleLogin} className="mt-6 space-y-4">
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

            {!recoveryMode && (
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-[#1e2b4a] bg-[#050814] px-4 py-3 pr-12 text-white outline-none transition focus:border-cyan-400"
                    placeholder="La password scelta in registrazione"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-cyan-300"
                    aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            )}

            {needsVerification ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-left">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                  <Mail size={16} />
                  <span>Verifica email richiesta</span>
                </div>
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-300">
                  È richiesta la conferma dell'email prima di accedere alla dashboard admin.
                  Controlla la casella di posta di <strong className="text-amber-200">{unverifiedEmail}</strong> (inclusa la cartella spam) e clicca sul link di verifica.
                </p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || (!recoveryMode && !password)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 text-base font-extrabold text-[#03111f] shadow-xl shadow-cyan-950/40 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {recoveryMode ? "Invia link di recupero" : "Entra nella dashboard"}
            </button>
            {!recoveryMode && verificationSlug && (
              <button
                type="button"
                onClick={resendVerification}
                disabled={secondaryLoading}
                className="w-full rounded-2xl border border-amber-500/30 px-4 py-3 text-sm font-extrabold text-amber-200 hover:bg-amber-500/10 disabled:opacity-60"
              >
                {secondaryLoading ? "Invio in corso…" : "Invia di nuovo l'email di verifica"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setRecoveryMode((active) => !active);
                setError("");
                setMessage("");
                setVerificationSlug("");
              }}
              className="w-full text-sm font-extrabold text-cyan-300 hover:text-cyan-200"
            >
              {recoveryMode ? "Torna all'accesso" : "Hai dimenticato la password?"}
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
