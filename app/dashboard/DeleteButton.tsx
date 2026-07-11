"use client";

import { useState } from "react";

type ModalState = "NONE" | "CONFIRM_NOSHOW";

function whatsappPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("3")) digits = `39${digits}`;
  return digits.length >= 8 ? digits : "";
}

function getPublicBookingUrl() {
  const adminPath = window.location.pathname;
  const publicPath = adminPath.includes("/admin")
    ? adminPath.split("/admin")[0]
    : "/";

  return `${window.location.origin}${publicPath}`;
}

function cancellationMessage({
  customerName,
  date,
  time,
}: {
  customerName: string;
  date: string;
  time: string;
}) {
  return (
    `Ciao ${customerName}, ti informiamo che il tuo appuntamento del ${date} alle ${time} è stato annullato.\n\n` +
    `Puoi prenotare un nuovo orario da qui:\n${getPublicBookingUrl()}`
  );
}

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
    const digits = whatsappPhone(phone || "");
    const whatsappTab = !isSpecial && digits && phone !== "0000000000"
      ? window.open("about:blank", "_blank")
      : null;

    try {
      await deleteAppointment();

      if (digits && whatsappTab) {
        whatsappTab.opener = null;
        const message = cancellationMessage({ customerName, date, time });
        whatsappTab.location.href = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
        setTimeout(() => window.location.reload(), 500);
      } else if (digits && !isSpecial && phone && phone !== "0000000000") {
        const message = cancellationMessage({ customerName, date, time });
        window.location.href = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
      } else if (!isSpecial && phone && phone !== "0000000000") {
        alert("Appuntamento eliminato, ma il numero WhatsApp del cliente non è valido.");
        window.location.reload();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      alert("Errore durante l'eliminazione. Riprova.");
      setLoading(false);
    }
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
              verrà rimosso e il cliente entrerà nello storico no-show.
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
