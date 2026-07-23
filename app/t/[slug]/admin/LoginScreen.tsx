"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Loader2, Mail } from "lucide-react";

export default function LoginScreen({
  slug,
  tenantName,
  ownerEmail,
  showLegacyHint,
  isEmailUnverified,
}: {
  slug: string;
  tenantName: string;
  ownerEmail?: string | null;
  showLegacyHint?: boolean;
  isEmailUnverified?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerificationAlert, setNeedsVerificationAlert] = useState(isEmailUnverified || false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(ownerEmail || "");
  const [message, setMessage] = useState("");
  const needsEmail = Boolean(ownerEmail);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setNeedsVerification(false);

    const res = await fetch("/api/tenant-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.needsVerification) {
        setNeedsVerificationAlert(true);
        setNeedsVerification(true);
        if (data.email) setUnverifiedEmail(data.email);
      }
      setError(data.error || "Credenziali non valide.");
      return;
    }
    window.location.reload();
  };

  const requestRecovery = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/tenant-password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, email }),
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
      body: JSON.stringify({ slug, email }),
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
    <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4 selection:bg-[#00b4ff]/30">
      <div className="w-full max-w-md bg-[#0b1221] p-8 rounded-3xl border border-[#1a2642] shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-cyan-500/10 text-cyan-300 rounded-2xl flex items-center justify-center border border-cyan-500/20">
            {recoveryMode ? <Mail size={30} /> : <Lock size={30} />}
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-white text-center mb-2">
          {recoveryMode ? "Recupera password" : "Area Privata"}
        </h1>
        <p className="text-slate-400 text-center mb-8 font-medium">
          {recoveryMode ? "Ricevi un link sicuro via email" : `Gestione ${tenantName}`}
        </p>

        {needsVerificationAlert && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left">
            <div className="flex items-center gap-2 text-amber-300 text-sm font-bold mb-1">
              <Mail size={18} />
              <span>Verifica email richiesta</span>
            </div>
            <p className="text-slate-300 text-xs font-medium leading-relaxed">
              È richiesta la verifica dell'email prima di accedere alla tua dashboard admin. Controlla la tua casella di posta (inclusa la cartella spam) e clicca sul link di conferma inviato a <strong className="text-amber-200">{unverifiedEmail || ownerEmail || "la tua email"}</strong>.
            </p>
          </div>
        )}

        {showLegacyHint && !recoveryMode && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <p className="text-amber-200 text-xs font-bold leading-relaxed">
              Account creato prima del nuovo login: puoi entrare con la vecchia password gestionale.
            </p>
          </div>
        )}

        <form onSubmit={recoveryMode ? requestRecovery : handleLogin} className="space-y-5">
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
                autoComplete="email"
                required
              />
            </div>
          )}

          {!recoveryMode && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoFocus={!needsEmail}
                  className="w-full bg-[#131c31] border border-[#1e2b4a] text-white px-4 py-3 pr-12 rounded-xl focus:outline-none focus:border-[#00b4ff] transition-colors"
                  placeholder="La password scelta in registrazione"
                  autoComplete="current-password"
                  required
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
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="text-emerald-300 text-sm font-bold bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-center">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (needsEmail && !email) || (!recoveryMode && !password)}
            className="w-full py-4 bg-gradient-to-r from-[#00b4ff] to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {recoveryMode ? "Invia link di recupero" : "Accedi"}
          </button>

          {needsVerification && (
            <button
              type="button"
              onClick={resendVerification}
              disabled={secondaryLoading || !email}
              className="w-full rounded-xl border border-amber-500/30 px-4 py-3 text-sm font-bold text-amber-200 hover:bg-amber-500/10 disabled:opacity-60"
            >
              {secondaryLoading ? "Invio in corso…" : "Invia di nuovo l'email di verifica"}
            </button>
          )}

          {needsEmail && (
            <button
              type="button"
              onClick={() => {
                setRecoveryMode((active) => !active);
                setError("");
                setMessage("");
                setNeedsVerification(false);
              }}
              className="w-full text-sm font-bold text-cyan-300 hover:text-cyan-200"
            >
              {recoveryMode ? "Torna all'accesso" : "Hai dimenticato la password?"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
