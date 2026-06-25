"use client";

import { useState } from "react";

export default function ReminderButton({
  name,
  date,
  time,
  phone,
}: {
  name: string;
  date: string;
  time: string;
  phone: string;
}) {
  const [showModal, setShowModal] = useState(false);

  const handleSendReminder = () => {
    const cleanPhone = phone.replace(/\D/g, "");
    const finalPhone = cleanPhone.startsWith("39")
      ? cleanPhone
      : `39${cleanPhone}`;

    const text = encodeURIComponent(
      `Ciao *${name}*! Ti ricordiamo il tuo appuntamento da *Demo NeatX* per il *${date}* alle ore *${time}*.\n\n` +
        `A presto 🌿`
    );

    window.open(`https://wa.me/${finalPhone}?text=${text}`, "_blank");
    setShowModal(false);
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b1221] border border-[#1e2b4a] rounded-3xl p-6 max-w-xs w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center text-2xl mb-4 border border-purple-500/20">
              💬
            </div>

            <h3 className="text-white font-extrabold text-lg mb-2">
              Invia Promemoria
            </h3>

            <p className="text-slate-400 text-[13px] mb-6 leading-relaxed">
              Vuoi inviare un promemoria WhatsApp a <b>{name}</b>?
            </p>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 bg-[#131c31] text-slate-300 hover:text-white border border-[#1e2b4a] py-3 rounded-xl text-sm font-bold transition"
              >
                No, chiudi
              </button>

              <button
                type="button"
                onClick={handleSendReminder}
                className="flex-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white border border-purple-500/50 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
              >
                ✓ Invia
              </button>
            </div>
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