"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";

export default function ResetPasswordForm({ slug, token }: { slug: string; token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(token ? "" : "Il link non contiene un codice valido.");
  const [adminUrl, setAdminUrl] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("La password deve avere almeno 8 caratteri.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Le due password non coincidono.");
      return;
    }
    setLoading(true);
    const response = await fetch("/api/tenant-password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, password, confirmPassword }),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(data.error || "Non è stato possibile cambiare la password.");
      return;
    }
    setAdminUrl(data.adminUrl || `/t/${slug}/admin`);
  };

  return (
    <main className="min-h-screen bg-[#050814] flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-[#1a2642] bg-[#0b1221] p-8 shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
          <LockKeyhole size={30} />
        </div>
        <h1 className="text-center text-2xl font-extrabold">Nuova password</h1>
        <p className="mb-7 mt-2 text-center text-sm text-slate-400">
          Scegli una nuova password per il tuo account NeatX.
        </p>

        {adminUrl ? (
          <div className="space-y-5 text-center">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-300">
              Password modificata. Le vecchie sessioni sono state chiuse.
            </div>
            <a href={adminUrl} className="block rounded-xl bg-cyan-500 px-4 py-4 font-extrabold hover:bg-cyan-400">
              Accedi con la nuova password
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {[
              { label: "Nuova password", value: password, setValue: setPassword, visible: showPassword, setVisible: setShowPassword },
              { label: "Conferma password", value: confirmPassword, setValue: setConfirmPassword, visible: showConfirmPassword, setVisible: setShowConfirmPassword },
            ].map((field) => (
              <label key={field.label} className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">{field.label}</span>
                <div className="relative">
                  <input
                    type={field.visible ? "text" : "password"}
                    value={field.value}
                    onChange={(event) => field.setValue(event.target.value)}
                    className="w-full rounded-xl border border-[#1e2b4a] bg-[#131c31] px-4 py-3 pr-12 outline-none focus:border-cyan-400"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => field.setVisible(!field.visible)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-cyan-300"
                    aria-label={field.visible ? "Nascondi password" : "Mostra password"}
                  >
                    {field.visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            ))}
            {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm font-bold text-red-400">{error}</div>}
            <button
              type="submit"
              disabled={loading || !token}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 font-extrabold disabled:opacity-60"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Salva nuova password
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
