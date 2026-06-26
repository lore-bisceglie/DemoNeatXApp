"use client";

import { useState } from "react";

export default function ReminderButton({
  name,
  date,
  time,
  phone,
  serviceName,
  cancelToken,
}: {
  name: string;
  date: string;
  time: string;
  phone: string;
  serviceName?: string;
  cancelToken?: string;
}) {
  const [showModal, setShowModal] = useState(false);

  const cancelUrl =
    cancelToken && typeof window !== "undefined"
      ? `${window.location.origin}/cancel/${cancelToken}`
      : "";

  const demoMessage =
    `Ciao ${name}! Ti ricordiamo il tuo appuntamento da Demo NeatX.\n\n` +
    `Data: ${date}\n` +
    `Ora: ${time}\n` +
    `Telefono cliente: ${phone}\n` +
    (serviceName ? `Servizio: ${serviceName}\n` : "") +
    (cancelUrl ? `\nLink per gestire o annullare:\n${cancelUrl}\n` : "") +
    `\nA presto.`;

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b1221] border border-[#1e2b4a] rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center text-xl mb-4 border border-purple-500/20">
              SMS
            </div>

            <h3 className="text-white font-extrabold text-lg mb-2">
              Promemoria demo
            </h3>

            <p className="text-slate-400 text-[13px] mb-4 leading-relaxed">
              Nella versione reale qui si apre WhatsApp con il messaggio gia
              pronto. Nella demo lo mostriamo soltanto.
            </p>

            <pre className="w-full text-left whitespace-pre-wrap bg-[#131c31] border border-[#1e2b4a] rounded-xl p-3 text-[11px] text-slate-300 mb-5">
              {demoMessage}
            </pre>

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white border border-purple-500/50 py-3 rounded-xl text-sm font-bold transition"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-2 rounded-xl text-xs font-bold transition"
      >
        Promemoria
      </button>
    </>
  );
}
