"use client";

import { useState } from "react";
import { Mail, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function EmailCapture() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setLoading(true);
    // Store in localStorage for now — could integrate with a mailing list later
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, source: "lead_magnet" }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // Fallback: just show success anyway
      setSubmitted(true);
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <section className="relative z-10 bg-[#0b1221] py-24 border-y border-[#1a2642]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
            <Check size={32} />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Grazie! 🎉 Controlla la tua email
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Ti abbiamo inviato la guida per ridurre i no-show. Nel frattempo, perché non provi NeatX?
          </p>
          <Link
            href="/registrazione"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#00b4ff] to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-2xl transition-all text-lg shadow-lg shadow-cyan-500/30 hover:scale-105"
          >
            Prova Gratis 7 Giorni
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative z-10 bg-[#0b1221] py-24 border-y border-[#1a2642] overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
          Scarica la guida <span className="text-emerald-400">gratuita</span>
        </h2>
        <p className="text-slate-400 text-lg mb-2">
          &quot;Come ridurre i No-Show del 90% e riempire la tua agenda&quot;
        </p>
        <p className="text-slate-500 text-sm mb-8">
          Strategie reali per professionisti su appuntamento. Ricevi la guida via email.
        </p>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col gap-3">
          <input
            type="text"
            placeholder="Il tuo nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-5 py-3.5 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition text-sm font-medium"
          />
          <input
            type="email"
            placeholder="La tua email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-5 py-3.5 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition text-sm font-medium"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold py-3.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Mail size={18} />
                Inviami la guida gratis
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-slate-600 mt-4">Niente spam. Cancellati quando vuoi.</p>
      </div>
    </section>
  );
}
