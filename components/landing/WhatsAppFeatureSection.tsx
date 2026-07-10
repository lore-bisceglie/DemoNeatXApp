"use client";

import { useState, useEffect } from "react";

const MESSAGES = [
  {
    type: "out",
    text: "Ciao Marco! 👋 Ti ricordiamo il tuo appuntamento domani alle 15:00 da Rosanna Acconciature — Taglio Uomo. Ti aspettiamo!",
    time: "18:00",
  },
  {
    type: "in",
    text: "Perfetto, ci sarò! 💪",
    time: "18:02",
  },
  {
    type: "out",
    text: "Ciao Giulia! 👋 Ti ricordiamo il tuo appuntamento domani alle 10:30 — Colore e Piega. Ti aspettiamo!",
    time: "18:00",
  },
  {
    type: "in",
    text: "Grazie! Quasi me lo scordavo 😅",
    time: "18:05",
  },
];

export default function WhatsAppFeatureSection() {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleMessages((prev) => {
        if (prev >= MESSAGES.length) {
          setTimeout(() => {
            setVisibleMessages(0);
            setSentCount(0);
          }, 2500);
          return prev;
        }
        if (MESSAGES[prev]?.type === "out") {
          setSentCount((c) => c + 1);
        }
        return prev + 1;
      });
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative z-10 overflow-hidden bg-[#050814] py-24">
      {/* Glow verde WhatsApp */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-500/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-emerald-300 mb-5">
            <span className="text-lg">💬</span>
            Integrazione WhatsApp
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            I tuoi clienti ricevono un messaggio da{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">
              NeatX su WhatsApp
            </span>
          </h2>
          <p className="text-slate-400 font-medium max-w-2xl mx-auto">
            Niente SMS da numeri sconosciuti. NeatX è un&apos;azienda verificata su WhatsApp Business: i tuoi clienti vedono il nome, il logo e la spunta di verifica. Il tasso di lettura passa dal 20% al 98%.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Mockup WhatsApp */}
          <div className="relative mx-auto w-full max-w-sm">
            {/* Phone frame */}
            <div className="rounded-[2.5rem] border-2 border-emerald-500/20 bg-[#0b1221] p-1 shadow-2xl shadow-emerald-500/10">
              <div className="rounded-[2.2rem] bg-[#111b2e] overflow-hidden">
                {/* Header */}
                <div className="bg-[#1a2642] px-5 py-4 flex items-center gap-3 border-b border-emerald-500/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00b4ff] to-cyan-400 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-cyan-500/30">
                    NX
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-white font-bold text-sm">
                        NeatX
                      </p>
                      <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">✓ Verificato</span>
                    </div>
                    <p className="text-emerald-400 text-[10px] font-semibold">
                      Account Business
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-emerald-400 text-[10px] font-bold">
                      Automatico
                    </span>
                  </div>
                </div>

                {/* Chat */}
                <div className="p-4 min-h-[340px] flex flex-col gap-3 justify-end">
                  {MESSAGES.slice(0, visibleMessages).map((msg, i) => (
                    <div
                      key={i}
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-lg transition-all duration-500 ${
                        i >= visibleMessages
                          ? "opacity-0 translate-y-4"
                          : "opacity-100 translate-y-0"
                      } ${
                        msg.type === "out"
                          ? "ml-auto bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-br-sm"
                          : "mr-auto bg-[#1a2642] text-slate-200 rounded-bl-sm border border-white/5"
                      }`}
                    >
                      {msg.text}
                      <span
                        className={`block text-[10px] mt-1 ${
                          msg.type === "out"
                            ? "text-emerald-200/60 text-right"
                            : "text-slate-500"
                        }`}
                      >
                        {msg.time} {msg.type === "out" && "✓✓"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Badge contatore */}
            <div className="absolute -top-3 -right-3 bg-gradient-to-br from-emerald-500 to-green-500 text-white font-black text-lg w-12 h-12 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/40 border-2 border-[#050814] animate-bounce">
              {sentCount}
            </div>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-6">
            {[
              {
                icon: "🏢",
                title: "NeatX è il mittente ufficiale",
                desc: "Il cliente non riceve messaggi da numeri sconosciuti. Vede arrivare un messaggio da 'NeatX' con logo e spunta di verifica WhatsApp Business.",
                color: "border-emerald-500/20 bg-emerald-500/5",
              },
              {
                icon: "🤖",
                title: "100% automatico, zero fatica",
                desc: "Ogni sera alle 18:00 NeatX scansiona le prenotazioni del giorno dopo e spara i promemoria. Tu non devi toccare nulla.",
                color: "border-cyan-500/20 bg-cyan-500/5",
              },
              {
                icon: "🛡️",
                title: "SMS come rete di sicurezza",
                desc: "Se per qualunque motivo WhatsApp non dovesse funzionare, il sistema scatta in automatico sull'SMS classico. Nessun cliente viene mai dimenticato.",
                color: "border-purple-500/20 bg-purple-500/5",
              },
              {
                icon: "📱",
                title: "98% tasso di lettura",
                desc: "Gli SMS vengono ignorati. Un messaggio WhatsApp Business con il nome NeatX viene aperto entro 3 minuti. I no-show crollano del 90%.",
                color: "border-amber-500/20 bg-amber-500/5",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`rounded-2xl border ${item.color} p-5 transition-all duration-300 hover:scale-[1.02] group`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <div>
                    <h3 className="text-white font-extrabold text-lg mb-1">
                      {item.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
