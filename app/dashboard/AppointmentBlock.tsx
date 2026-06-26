"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteButton from "./DeleteButton";
import ReminderButton from "./ReminderButton";

export default function AppointmentBlock({
  appt,
  italianDate,
  durationInMinutes = 15,
}: {
  appt: any;
  italianDate: string;
  durationInMinutes?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(appt.isPaid || false);
  const [loading, setLoading] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveDate, setMoveDate] = useState(appt.date || "");
  const [moveTime, setMoveTime] = useState(appt.time || "");
  const [moveError, setMoveError] = useState("");
  const [moving, setMoving] = useState(false);
  const router = useRouter();

  const isWalkIn = appt.source === "WALK_IN";
  const isPausa = appt.customerName.includes("PAUSA");
  const isFerie = appt.customerName.includes("FERIE");
  const isSpecial = isPausa || isFerie;

  const rowSpan = Math.ceil(durationInMinutes / 15);
  const textClass = rowSpan > 1 ? "text-xs" : "text-[11px]";

  let blockClass =
    "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20";
  if (isWalkIn) {
    blockClass =
      "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20";
  }
  if (isPausa) {
    blockClass =
      "bg-slate-800/80 border-slate-600 text-slate-400 hover:bg-slate-700/80 border-dashed";
  }
  if (isFerie) {
    blockClass =
      "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20";
  }
  if (isPaid && !isSpecial) {
    blockClass =
      "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)] hover:bg-emerald-500/20";
  }

  const allSlots: string[] = [];
  for (let h = 9; h <= 19; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 19 && m > 0) break;
      allSlots.push(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
      );
    }
  }

  const togglePaid = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/appointment/${appt.id}/paid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isPaid: !isPaid,
        }),
      });

      if (!res.ok) {
        console.error("Errore pagamento:", res.status);
        return;
      }

      setIsPaid(!isPaid);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const moveAppointment = async () => {
    setMoveError("");
    setMoving(true);

    try {
      const res = await fetch(`/api/appointment/${appt.id}/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: moveDate,
          time: moveTime,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMoveError(data.error || "Non riesco a spostare l'appuntamento.");
        setMoving(false);
        return;
      }

      setMoveOpen(false);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      setMoveError("Errore durante lo spostamento.");
      setMoving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{ gridRow: `span ${rowSpan} / span ${rowSpan}` }}
        className={`w-full flex flex-col items-center justify-center rounded-xl font-bold border p-1 text-center truncate transition-all relative z-10 ${blockClass} ${textClass} h-full min-h-[35px]`}
        title={`${appt.customerName}`}
      >
        {isFerie ? (
          <>
            <span className="text-sm mb-1">FERIE</span>
            <span className="truncate w-full whitespace-normal leading-tight">
              Tutto il giorno
            </span>
          </>
        ) : isPausa ? (
          <>
            <span className="text-[9px] opacity-50 mb-0.5 font-medium tracking-wider flex items-center gap-1">
              {appt.time}
            </span>
            <span className="truncate w-full whitespace-normal leading-tight">
              PAUSA
            </span>
          </>
        ) : (
          <>
            <span className="text-[9px] opacity-50 mb-0.5 font-medium tracking-wider flex items-center gap-1">
              {appt.time} {isPaid && "OK"}
            </span>
            <span className="truncate w-full whitespace-normal leading-tight">
              {appt.customerName}
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050814]/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b1221] border border-[#1e2b4a] rounded-3xl p-6 w-full max-w-sm shadow-2xl shadow-cyan-900/20 relative animate-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-2xl font-bold leading-none"
            >
              &times;
            </button>

            <h3 className="text-white font-extrabold text-2xl mb-1">
              {appt.customerName}
            </h3>
            <p className="text-slate-400 text-sm mb-2">
              <span className="text-[#00b4ff] font-bold">
                {appt.time === "ALL_DAY" ? "Tutto il giorno" : appt.time}
              </span>{" "}
              - {italianDate}
              {!isSpecial && (
                <>
                  <br />
                  <span className="inline-block mt-1">
                    Tel. {appt.customerPhone}
                  </span>
                </>
              )}
              {isWalkIn && (
                <span className="bg-blue-500/20 text-blue-400 text-[9px] px-2 py-0.5 rounded-full border border-blue-500/30 ml-2 align-middle">
                  Negozio
                </span>
              )}
            </p>

            {appt.service && !isSpecial && (
              <div className="mb-4 bg-[#131c31] border border-[#1e2b4a] px-3 py-2 rounded-xl inline-block">
                <span className="text-xs font-bold text-slate-300">
                  {appt.service.name} ({appt.service.duration} min)
                </span>
              </div>
            )}

            {moveOpen && !isSpecial && (
              <div className="bg-[#131c31] border border-[#1e2b4a] rounded-2xl p-4 mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Sposta appuntamento
                </p>
                <p className="text-[11px] text-cyan-200 mb-3">
                  Demo: cambia data e ora. Il sistema salva solo se lo slot e
                  libero.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={moveDate}
                    onChange={(event) => setMoveDate(event.target.value)}
                    className="bg-[#0b1221] border border-[#1e2b4a] text-white rounded-xl px-3 py-2 text-sm"
                    style={{ colorScheme: "dark" }}
                  />
                  <select
                    value={moveTime}
                    onChange={(event) => setMoveTime(event.target.value)}
                    className="bg-[#0b1221] border border-[#1e2b4a] text-white rounded-xl px-3 py-2 text-sm"
                  >
                    {allSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
                {moveError && (
                  <p className="text-xs text-red-400 font-bold mt-3">
                    {moveError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={moveAppointment}
                  disabled={moving || !moveDate || !moveTime}
                  className="w-full mt-3 bg-[#00b4ff] hover:bg-cyan-400 text-[#050814] font-bold py-2 rounded-xl transition disabled:opacity-50 text-sm"
                >
                  {moving ? "Sposto..." : "Salva nuovo orario"}
                </button>
              </div>
            )}

            {!isSpecial && (
              <div className="bg-[#131c31] border border-[#1e2b4a] rounded-2xl p-4 flex items-center justify-between mb-6 shadow-inner">
                <div>
                  <p className="text-sm font-bold text-white">
                    Pagato in anticipo
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    Segna se il cliente ha gia saldato
                  </p>
                </div>
                <button
                  onClick={togglePaid}
                  disabled={loading}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                    isPaid ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      isPaid ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            )}

            <div className="space-y-3 flex flex-col items-stretch mt-4">
              {!isSpecial && (
                <button
                  type="button"
                  onClick={() => setMoveOpen((value) => !value)}
                  className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-2 rounded-xl text-xs font-bold transition"
                >
                  Sposta
                </button>
              )}
              {!isSpecial && appt.customerPhone !== "0000000000" && (
                <div className="w-full [&>button]:w-full [&>button]:flex [&>button]:justify-center">
                  <ReminderButton
                    name={appt.customerName}
                    date={italianDate}
                    time={appt.time}
                    phone={appt.customerPhone}
                    serviceName={appt.service?.name}
                    cancelToken={appt.cancelToken}
                  />
                </div>
              )}
              <div className="w-full [&>button]:w-full [&>button]:flex [&>button]:justify-center">
                <DeleteButton
                  appointmentId={appt.id}
                  customerName={appt.customerName}
                  phone={appt.customerPhone}
                  date={italianDate}
                  time={appt.time}
                  isSpecial={isSpecial}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
