"use client";

import { useState } from "react";

type ModalState = "NONE" | "DEMO_NOTICE" | "CONFIRM_NOSHOW";

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
  const [demoNotice, setDemoNotice] = useState("");

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
        setDemoNotice(
          `Demo: appuntamento di ${customerName} eliminato.\n\nNella versione reale si potrebbe aprire WhatsApp con questo testo:\n\nCiao ${customerName}, ti informiamo che il tuo appuntamento del ${date} alle ${time} e stato annullato. Puoi prenotare un nuovo orario dalla pagina prenotazioni.`
        );
        setModalState("DEMO_NOTICE");
        setLoading(false);
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      alert("Errore durante l'eliminazione. Riprova.");
      setLoading(false);
    }
  };

  const closeDemoNotice = () => {
    setModalState("NONE");
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
      {modalState === "DEMO_NOTICE" && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b1221] border border-[#1e2b4a] rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center text-xl mb-4 border border-green-500/20">
              OK
            </div>

            <h3 className="text-white font-extrabold text-lg mb-2">
              Avviso simulato
            </h3>

            <p className="text-slate-400 text-[13px] mb-4 leading-relaxed">
              Nella demo non apriamo WhatsApp dalla dashboard. Ti mostro solo
              il messaggio che partirebbe nella versione reale.
            </p>

            <pre className="w-full text-left whitespace-pre-wrap bg-[#131c31] border border-[#1e2b4a] rounded-xl p-3 text-[11px] text-slate-300 mb-5">
              {demoNotice}
            </pre>

            <button
              type="button"
              onClick={closeDemoNotice}
              className="w-full bg-green-500/20 text-green-300 hover:bg-green-500 hover:text-[#050814] border border-green-500/50 py-3 rounded-xl text-sm font-bold transition"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}

      {modalState === "CONFIRM_NOSHOW" && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b1221] border border-[#1e2b4a] rounded-3xl p-6 max-w-xs w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center text-2xl mb-4 border border-yellow-500/20">
              !
            </div>

            <h3 className="text-white font-extrabold text-lg mb-2">
              Segnare come assente?
            </h3>

            <p className="text-slate-400 text-[13px] mb-6 leading-relaxed">
              Vuoi segnare <b>{customerName}</b> come assente? L'appuntamento
              verra rimosso e il cliente entrera nello storico no-show.
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
          {loading ? "..." : "Sblocca"}
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
            {loading ? "..." : "Elimina"}
          </button>

          <button
            type="button"
            onClick={triggerNoShow}
            disabled={loading}
            title="Segna come assente"
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-3 py-2 rounded-lg transition text-xs disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {loading ? "..." : "Assente"}
          </button>
        </div>
      )}
    </>
  );
}
