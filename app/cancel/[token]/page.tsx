"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function CancelPage() {
  const params = useParams();
  const token = params.token as string;

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [finishedMessage, setFinishedMessage] = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [moving, setMoving] = useState(false);
  const [tenantPhone, setTenantPhone] = useState("");
  const [moveMessage, setMoveMessage] = useState("");

  function whatsappPhone(value: string) {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.length === 10 && digits.startsWith("3")) digits = `39${digits}`;
    return digits.length >= 8 ? digits : "";
  }

  function notifyTenantViaWhatsApp(phone: string, type: "cancel" | "reschedule", details: { date: string; time: string; newDate?: string; newTime?: string }) {
    const digits = whatsappPhone(phone);
    if (!digits) return;

    let message = "";
    if (type === "cancel") {
      message = `Ciao, ho annullato il mio appuntamento del ${details.date} alle ${details.time}.`;
    } else {
      message = `Ciao, ho spostato il mio appuntamento dal ${details.date} alle ${details.time} al ${details.newDate} alle ${details.newTime}.`;
    }

    const whatsappTab = window.open("about:blank", "_blank");
    if (whatsappTab) {
      whatsappTab.opener = null;
      whatsappTab.location.href = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    }
  }

  useEffect(() => {
    if (!token) return;

    fetch(`/api/cancel?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        setAppointment(data.appointment);
        setTenantPhone(data.tenantPhone || "");
        setRescheduleDate(data.appointment?.date || "");
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    if (!appointment || !rescheduleDate || !appointment.tenantId || !appointment.serviceId) return;

    fetch(
      `/api/availability?date=${encodeURIComponent(rescheduleDate)}&tenantId=${encodeURIComponent(appointment.tenantId)}&serviceId=${encodeURIComponent(appointment.serviceId)}${appointment.locationId ? `&locationId=${encodeURIComponent(appointment.locationId)}` : ""}${appointment.staffId ? `&staffId=${encodeURIComponent(appointment.staffId)}` : ""}`
    )
      .then((res) => res.json())
      .then((data) => {
        setSlots(data.slots || []);
        setRescheduleTime("");
      })
      .catch(() => {
        setSlots([]);
      });
  }, [appointment, rescheduleDate]);

  const handleCancel = async () => {
    setCanceling(true);

    const res = await fetch("/api/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.tenantPhone) setTenantPhone(data.tenantPhone);

      const [year, month, day] = appointment.date.split("-");
      const displayDate = `${day}/${month}/${year}`;

      setFinishedMessage(
        `Appuntamento annullato con successo. Lo slot del ${displayDate} alle ${appointment.time} è stato liberato.`
      );

      notifyTenantViaWhatsApp(data.tenantPhone || tenantPhone, "cancel", { date: displayDate, time: appointment.time });
      setCanceling(false);
    } else {
      alert("Si e verificato un errore di connessione.");
      setCanceling(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      setMoveMessage("Scegli una data e un orario.");
      return;
    }

    setMoving(true);
    setMoveMessage("");

    const res = await fetch(`/api/reschedule/${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: rescheduleDate,
        time: rescheduleTime,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMoveMessage(data.error || "Non riesco a spostare l'appuntamento.");
      setMoving(false);
      return;
    }

    setAppointment(data.appointment);
    setRescheduleOpen(false);
    setMoving(false);

    const latestPhone = data.tenantPhone || tenantPhone;
    if (data.tenantPhone) setTenantPhone(data.tenantPhone);

    const [oldYear, oldMonth, oldDay] = appointment.date.split("-");
    const oldDisplayDate = `${oldDay}/${oldMonth}/${oldYear}`;
    const [newYear, newMonth, newDay] = data.appointment.date.split("-");
    const newDisplayDate = `${newDay}/${newMonth}/${newYear}`;
    setMoveMessage(
      `Appuntamento spostato con successo dal ${oldDisplayDate} alle ${appointment.time} al ${newDisplayDate} alle ${data.appointment.time}.`
    );

    notifyTenantViaWhatsApp(latestPhone, "reschedule", {
      date: oldDisplayDate,
      time: appointment.time,
      newDate: newDisplayDate,
      newTime: data.appointment.time,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4">
        <span className="text-4xl animate-spin mb-4">...</span>
        <p className="text-slate-400 font-medium animate-pulse">
          Ricerca appuntamento...
        </p>
      </div>
    );
  }

  if (finishedMessage) {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4">
        <div className="bg-[#0b1221] border border-emerald-500/30 p-8 rounded-3xl shadow-xl max-w-sm w-full text-center">
          <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 text-2xl">
            OK
          </div>
          <h2 className="text-white font-extrabold text-xl mb-2">
            Azione completata
          </h2>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            {finishedMessage}
          </p>
          <Link
            href="/"
            className="bg-[#131c31] border border-[#1e2b4a] text-white font-bold py-3 px-6 rounded-xl transition hover:bg-[#1e2b4a] block w-full"
          >
            Torna alla home
          </Link>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4">
        <div className="bg-[#0b1221] border border-[#1e2b4a] p-8 rounded-3xl shadow-xl max-w-sm w-full text-center">
          <span className="text-5xl block mb-4">?</span>
          <h2 className="text-white font-extrabold text-xl mb-2">
            Appuntamento non trovato
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Questo appuntamento non esiste più o è già stato annullato.
          </p>
          <Link
            href="/"
            className="bg-[#131c31] border border-[#1e2b4a] text-white font-bold py-3 px-6 rounded-xl transition hover:bg-[#1e2b4a] block w-full"
          >
            Torna alla home
          </Link>
        </div>
      </div>
    );
  }

  const [year, month, day] = appointment.date.split("-");
  const displayDate = `${day}/${month}/${year}`;

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4 text-slate-200 selection:bg-emerald-500/30">
      <div className="bg-[#0b1221] border border-red-900/30 p-8 rounded-3xl shadow-2xl shadow-red-900/10 max-w-sm w-full text-center relative z-10">
        <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <span className="text-2xl">!</span>
        </div>

        <h2 className="text-white font-extrabold text-xl mb-2">
          Gestisci appuntamento
        </h2>

        <div className="bg-[#131c31] border border-[#1e2b4a] rounded-xl p-4 my-6 text-left shadow-inner">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">
            Dettagli appuntamento
          </p>
          <p className="text-white font-bold capitalize">
            {appointment.customerName}
          </p>
          <p className="text-emerald-400 font-bold text-lg mt-1">
            {appointment.time}
            <span className="text-sm font-medium text-slate-400">
              {" "}
              ({displayDate})
            </span>
          </p>
          {appointment.service && (
            <p className="text-xs text-slate-300 font-bold mt-2">
              {appointment.service.name}
            </p>
          )}
        </div>

        {moveMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl px-3 py-2 mb-4">
            {moveMessage}
          </div>
        )}

        {rescheduleOpen && (
          <div className="bg-[#131c31] border border-[#1e2b4a] rounded-2xl p-4 mb-4 text-left">
            <label className="block text-xs text-slate-500 uppercase font-bold tracking-widest mb-2">
              Nuova data
            </label>
            <input
              type="date"
              value={rescheduleDate}
              onChange={(event) => setRescheduleDate(event.target.value)}
              className="w-full bg-[#0b1221] border border-[#1e2b4a] rounded-xl px-3 py-2 text-white text-sm mb-3"
              style={{ colorScheme: "dark" }}
            />

            <label className="block text-xs text-slate-500 uppercase font-bold tracking-widest mb-2">
              Nuovo orario
            </label>
            <select
              value={rescheduleTime}
              onChange={(event) => setRescheduleTime(event.target.value)}
              className="w-full bg-[#0b1221] border border-[#1e2b4a] rounded-xl px-3 py-2 text-white text-sm"
            >
              <option value="">Seleziona un orario</option>
              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>

            {slots.length === 0 && (
              <p className="text-[11px] text-slate-500 mt-2">
                Nessun orario libero per questa data.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {rescheduleOpen ? (
            <button
              onClick={handleReschedule}
              disabled={moving || !rescheduleDate || !rescheduleTime}
              className="w-full bg-[#00b4ff] hover:bg-cyan-400 text-[#050814] font-bold py-3 rounded-xl transition disabled:opacity-50"
            >
              {moving ? "Spostamento..." : "Conferma nuovo orario"}
            </button>
          ) : (
            <button
              onClick={() => setRescheduleOpen(true)}
              className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold py-3 rounded-xl transition"
            >
              Sposta appuntamento
            </button>
          )}

          <button
            onClick={handleCancel}
            disabled={canceling}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {canceling ? "Annullamento in corso..." : "Annulla appuntamento"}
          </button>

          <Link
            href="/"
            className="w-full bg-[#131c31] border border-[#1e2b4a] text-white hover:bg-[#1e2b4a] font-bold py-3 rounded-xl transition block"
          >
            Torna indietro
          </Link>
        </div>
      </div>
    </div>
  );
}
