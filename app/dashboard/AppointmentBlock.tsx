"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteButton from "./DeleteButton";
import ReminderButton from "./ReminderButton";

export default function AppointmentBlock({ appt, italianDate, durationInMinutes = 15 }: { appt: any, italianDate: string, durationInMinutes?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(appt.isPaid || false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Riconoscimento logico del tipo di blocco
  const isWalkIn = appt.source === "WALK_IN";
  const isPausa = appt.customerName.includes("PAUSA");
  const isFerie = appt.customerName.includes("FERIE");
  const isSpecial = isPausa || isFerie;

  const rowSpan = Math.ceil(durationInMinutes / 15);
  const textClass = rowSpan > 1 ? "text-xs" : "text-[11px]";

  // Styling dinamico
  let blockClass = "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"; // Default: Cliente Online
  if (isWalkIn) blockClass = "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"; // Walk-In
  if (isPausa) blockClass = "bg-slate-800/80 border-slate-600 text-slate-400 hover:bg-slate-700/80 border-dashed"; // Pausa (Grigio)
  if (isFerie) blockClass = "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"; // Ferie (Arancio)
  if (isPaid && !isSpecial) blockClass = "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)] hover:bg-emerald-500/20"; // Pagato

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
            <span className="text-xl mb-1">🏖️</span>
            <span className="truncate w-full whitespace-normal leading-tight">FERIE</span>
          </>
        ) : isPausa ? (
          <>
            <span className="text-[9px] opacity-50 mb-0.5 font-medium tracking-wider flex items-center gap-1">{appt.time}</span>
            <span className="truncate w-full whitespace-normal leading-tight">☕ PAUSA</span>
          </>
        ) : (
          <>
            <span className="text-[9px] opacity-50 mb-0.5 font-medium tracking-wider flex items-center gap-1">
              {appt.time} {isPaid && "✅"}
            </span>
            <span className="truncate w-full whitespace-normal leading-tight">{appt.customerName}</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050814]/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b1221] border border-[#1e2b4a] rounded-3xl p-6 w-full max-w-sm shadow-2xl shadow-cyan-900/20 relative animate-in zoom-in-95 duration-200 text-left">
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white text-2xl font-bold leading-none">&times;</button>

            <h3 className="text-white font-extrabold text-2xl mb-1">{appt.customerName}</h3>
            <p className="text-slate-400 text-sm mb-2">
              <span className="text-[#00b4ff] font-bold">{appt.time === "ALL_DAY" ? "Tutto il giorno" : appt.time}</span> • {italianDate}
              {!isSpecial && <><br/><span className="inline-block mt-1">📞 {appt.customerPhone}</span></>}
              {isWalkIn && <span className="bg-blue-500/20 text-blue-400 text-[9px] px-2 py-0.5 rounded-full border border-blue-500/30 ml-2 align-middle">Negozio</span>}
            </p>
            
            {appt.service && !isSpecial && (
              <div className="mb-6 bg-[#131c31] border border-[#1e2b4a] px-3 py-2 rounded-xl inline-block">
                <span className="text-xs font-bold text-slate-300">💆‍♀️ {appt.service.name} ({appt.service.duration} min)</span>
              </div>
            )}

            {/* Switch Pagamento (Nascosto se è Ferie/Pausa) */}
            {!isSpecial && (
              <div className="bg-[#131c31] border border-[#1e2b4a] rounded-2xl p-4 flex items-center justify-between mb-6 shadow-inner">
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-2">💳 Pagato in anticipo</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Segna se il cliente ha già saldato</p>
                </div>
                <button 
                  onClick={togglePaid} disabled={loading}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${isPaid ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isPaid ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            )}

            <div className="space-y-3 flex flex-col items-stretch mt-4">
              {!isSpecial && appt.customerPhone !== "0000000000" && (
                <div className="w-full [&>a]:w-full [&>a]:flex [&>a]:justify-center">
                  <ReminderButton name={appt.customerName} date={italianDate} time={appt.time} phone={appt.customerPhone} />
                </div>
              )}
              <div className="w-full [&>button]:w-full [&>button]:flex [&>button]:justify-center">
                <DeleteButton appointmentId={appt.id} customerName={appt.customerName} phone={appt.customerPhone} date={italianDate} time={appt.time} isSpecial={isSpecial} />
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}