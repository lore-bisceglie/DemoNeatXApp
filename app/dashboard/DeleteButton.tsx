"use client";

import { useState } from "react";

type ModalState = "NONE" | "CONFIRM_WHATSAPP" | "CONFIRM_NOSHOW";

export default function DeleteButton({
  appointmentId,
  customerName,
  phone,
  date,
  time,
  isSpecial,
}: {
  appointmentId: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  isSpecial: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState<ModalState>("NONE");

  const deleteAppointment = async () => {
    const noCache = Date.now();

    const res = await fetch(
      `/api/actions/delete?id=${appointmentId}&t=${noCache}`
    );

    if (!res.ok) {
      throw new Error("Impossibile eliminare l'appuntamento.");
    }

    return true;
  };

  const handleClick = async () => {
    setLoading(true);

    try {
      await deleteAppointment();

      if (!isSpecial && phone && phone !== "0000000000") {
        setLoading(false);
        setModalState("CONFIRM_WHATSAPP");
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      alert("Errore durante l'eliminazione. Riprova.");
      setLoading(false);
    }
  };

  const handleWhatsAppConfirm = () => {
    const cleanPhone = phone.replace(/\D/g, "");
    const finalPhone = cleanPhone.startsWith("39")
      ? cleanPhone
      : `39${cleanPhone}`;

    const text = encodeURIComponent(
      `[!] *APPUNTAMENTO ANNULLATO*\n\n` +
        `Ciao *${customerName}*, ti informiamo che il tuo appuntamento da *Demo NeatX* del *${date}* alle ore *${time}* è stato annullato.\n\n` +
        `Per prenotare un nuovo orario, usa il link della pagina prenotazioni.\n\n` +
        `_Messaggio automatico gestito tramite NeatX._`
    );

    window.open(`https://wa.me/${finalPhone}?text=${text}`, "_blank");
    window.location.reload();
  };

  const handleWhatsAppCancel = () => {
    window.location.reload();
  };

  const triggerNoShow = () => {
    setModalState("CONFIRM_NOSHOW");
  };

  const confirmNoShow = async () => {
    setModalState("NONE");
    setLoading(true);

    try {
      const noCache = Date.now();

      const res = await fetch(
        `/api/actions/noshow?id=${appointmentId}&phone=${encodeURIComponent(
          phone
        )}&name=${encodeURIComponent(customerName)}&date=${encodeURIComponent(
          date
        )}&t=${noCache}`,
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        throw new Error("Impossibile registrare il No-Show.");
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Errore durante la registrazione dell'assenza. Riprova.");
      setLoading(false);
    }
  };

  return (
    <>
      {modalState === "CONFIRM_WHATSAPP" && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b1221] border border-[#1e2b4a] rounded-3xl p-6 max-w-xs w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center text-2xl mb-4 border border-green-500/20">
              💬
            </div>

            <h3 className="text-white font-extrabold text-lg mb-2">
              Avvisa il Cliente
            </h3>

            <p className="text-slate-400 text-[13px] mb-6 leading-relaxed">
              L'appuntamento di <b>{customerName}</b> è stato rimosso.
              <br />
              <br />
              Vuoi inviargli un messaggio WhatsApp per avvisarlo?
            </p>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={handleWhatsAppCancel}
                className="flex-1 bg-[#131c31] text-slate-300 hover:text-white border border-[#1e2b4a] py-3 rounded-xl text-sm font-bold transition"
              >
                No, chiudi
              </button>

              <button
                type="button"
                onClick={handleWhatsAppConfirm}
                className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-[#050814] border border-green-500/50 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
              >
                ✓ Avvisa
              </button>
            </div>
          </div>
        </div>
      )}

      {modalState === "CONFIRM_NOSHOW" && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b1221] border border-[#1e2b4a] rounded-3xl p-6 max-w-xs w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center text-2xl mb-4 border border-yellow-500/20">
              ⚠️
            </div>

            <h3 className="text-white font-extrabold text-lg mb-2">
              Cartellino Giallo?
            </h3>

            <p className="text-slate-400 text-[13px] mb-6 leading-relaxed">
              Vuoi segnare <b>{customerName}</b> come{" "}
              <span className="text-yellow-500 font-bold">ASSENTE</span>?
              <br />
              <br />
              L'appuntamento verrà rimosso e il cliente verrà registrato nei
              No-Show.
            </p>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setModalState("NONE")}
                className="flex-1 bg-[#131c31] text-slate-300 hover:text-white border border-[#1e2b4a] py-3 rounded-xl text-sm font-bold transition"
              >
                Annulla
              </button>

              <button
                type="button"
                onClick={confirmNoShow}
                className="flex-1 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-[#050814] border border-yellow-500/30 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}

      {isSpecial ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-lg transition text-sm disabled:opacity-50"
        >
          {loading ? "⏳..." : "Sblocca"}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            title="Elimina appuntamento"
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-lg transition text-xs disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {loading ? "⏳..." : "🗑️ Elimina"}
          </button>

          <button
            type="button"
            onClick={triggerNoShow}
            disabled={loading}
            title="Segna come assente"
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-3 py-2 rounded-lg transition text-xs disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {loading ? "⏳..." : "🟨 Assente"}
          </button>
        </div>
      )}
    </>
  );
}