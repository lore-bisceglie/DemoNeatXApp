import React from "react";
import Link from "next/link";
import { Gift, Share2, BadgeCheck, Link2, MessageCircle, Coins } from "lucide-react";

const STEP_NUMBER_COLORS = [
  "bg-[#00b4ff]/10 border-[#00b4ff]/30 text-[#00b4ff]",
  "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  "bg-rose-500/10 border-rose-500/30 text-rose-400",
];

const STEPS = [
  {
    icon: Link2,
    title: "Trovi il tuo link",
    text: "Nella tua dashboard, sezione \"Invita e Guadagna\". È il tuo link personale, già pronto da condividere.",
  },
  {
    icon: MessageCircle,
    title: "Lo condividi",
    text: "Con un collega di fiducia, via email o WhatsApp. Quando lui si registra col tuo link, parte con 100 crediti.",
  },
  {
    icon: Coins,
    title: "Guadagni",
    text: "Tu ricevi 100 crediti quando il collega attiva il suo primo abbonamento. Nessun limite: più inviti, più guadagni.",
  },
];

export default function ReferralSection() {
  return (
    <section className="relative z-10 bg-[#050814] py-24 border-t border-[#1a2642] overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Testo */}
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-emerald-300 mb-6">
              <Gift size={14} />
              Invita e Guadagna
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Porta un collega su NeatX:{" "}
              <span className="text-emerald-400">guadagni messaggi gratis.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-xl">
              Hai un collega che soffre di telefonate a tutte le ore e clienti che non
              si presentano? Condividi il tuo link personale: lui parte con{" "}
              <strong className="text-white">100 crediti</strong> e tu ricevi{" "}
              <strong className="text-white">100 crediti</strong> quando attiva il suo
              primo abbonamento. Nessun limite: più inviti, più guadagni.
            </p>
            <ul className="space-y-3 mb-9">
              {[
                "L'invitato riceve 100 crediti messaggio (50 subito + 50 dopo la verifica email).",
                "Tu ricevi 100 crediti quando l'invitato attiva un abbonamento.",
                "Zero commissioni, nessun limite al numero di inviti.",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 text-base text-slate-300">
                  <BadgeCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/registrazione"
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-7 py-3.5 text-base font-extrabold text-[#03111f] shadow-xl shadow-cyan-950/40 transition hover:bg-cyan-300"
              >
                Registrati e crea il tuo link
                <Share2 size={18} />
              </Link>
              <Link
                href="/registrazione"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#1e2b4a] bg-[#0b1221] px-7 py-3.5 text-base font-extrabold text-white transition hover:border-emerald-500/40"
              >
                Scopri come funziona
              </Link>
            </div>
          </div>

          {/* Riquadro: come funziona in 3 passi */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent blur-3xl"></div>
            <div className="glow-card relative rounded-3xl border border-[#1a2642] bg-gradient-to-br from-[#0b1221] to-[#0f192b] backdrop-blur-xl p-8 md:p-10 lg:p-12 shadow-2xl">
              <div className="flex items-center gap-4 mb-8 md:mb-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
                  <Gift size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-white">Programma Inviti</h3>
                  <p className="text-sm text-slate-400">Come funziona in 3 passi</p>
                </div>
              </div>
              <div className="grid gap-5 md:gap-6">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.title}
                      className="group relative rounded-2xl border border-[#1a2642] bg-[#050814]/80 p-5 md:p-6 transition-all duration-500 hover:border-[#00b4ff]/40 hover:bg-[#0b1221]/80 hover:-translate-y-1"
                    >
                      <div className="flex gap-5">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-14 h-14 rounded-2xl bg-[#00b4ff]/10 border border-[#00b4ff]/20 text-[#00b4ff] flex items-center justify-center">
                            <Icon size={28} />
                          </div>
                          <div className={`mt-3 flex h-12 w-12 items-center justify-center rounded-xl border text-lg font-extrabold ${STEP_NUMBER_COLORS[index % STEP_NUMBER_COLORS.length]}`}>
                            {index + 1}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-extrabold text-white mb-2">{step.title}</h3>
                          <p className="text-base text-slate-400 leading-relaxed">{step.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
