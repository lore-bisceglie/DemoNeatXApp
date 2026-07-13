"use client";

import { useState } from "react";

type WaitlistItem = {
  id: string;
  name: string;
  phone: string;
  date: string;
};

export default function WaitlistDashboard({ initialData, tenantId }: { initialData: WaitlistItem[], tenantId: string }) {
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>(initialData);
  const [deleteTarget, setDeleteTarget] = useState<WaitlistItem | null>(null);
  const [loading, setLoading] = useState(false);

  const handleWhatsApp = (name: string, phone: string, date: string) => {
    const formattedDate = date.split("-").reverse().join("/");
    const msg = `Ciao ${name}! Sono l'agenda automatica. Si è appena liberato un posto per la giornata del ${formattedDate}. Sei ancora interessato/a? Rispondi a questo messaggio per bloccarlo!`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const openRemovePopup = (item: WaitlistItem) => {
    setDeleteTarget(item);
  };

  const closeRemovePopup = () => {
    if (loading) return;
    setDeleteTarget(null);
  };

  const confirmRemove = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    
    try {
      await fetch(`/api/waitlist?id=${deleteTarget.id}`, { method: 'DELETE' });
      setWaitlist((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteTarget(null);
      setLoading(false);
    }
  };

  if (waitlist.length === 0) {
    return (
      <div className="bg-[#0b1221] border border-[#1a2642] p-6 rounded-3xl shadow-xl mb-6">
        <h2 className="text-slate-500 font-extrabold flex items-center gap-2 mb-2 text-lg">
          <span>⏳</span> Lista d&apos;Attesa
        </h2>
        <p className="text-slate-500 text-sm italic">Nessun cliente in lista d&apos;attesa.</p>
      </div>
    );
  }

  return (
    <>
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b1221] border border-[#1e2b4a] rounded-3xl p-6 max-w-xs w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center text-2xl mb-4 border border-red-500/20">
              ✕
            </div>

            <h3 className="text-white font-extrabold text-lg mb-2">
              Rimuovere dalla Lista?
            </h3>

            <p className="text-slate-400 text-[13px] mb-6 leading-relaxed">
              Vuoi rimuovere <b>{deleteTarget.name}</b> dalla lista d'attesa?
              <br />
              <br />
              Il cliente non verrà avvisato automaticamente.
            </p>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={closeRemovePopup}
                disabled={loading}
                className="flex-1 bg-[#131c31] text-slate-300 hover:text-white border border-[#1e2b4a] py-3 rounded-xl text-sm font-bold transition disabled:opacity-50"
              >
                No, chiudi
              </button>

              <button
                type="button"
                onClick={confirmRemove}
                disabled={loading}
                className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/50 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Rimuovo..." : "✓ Rimuovi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#1a110a] border border-amber-900/50 p-6 rounded-3xl shadow-xl mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <h2 className="text-amber-400 font-extrabold flex items-center gap-2 mb-4 text-lg">
          <span className="animate-pulse">⏳</span> Lista d'Attesa (
          {waitlist.length})
        </h2>

        <div className="space-y-3">
          {waitlist.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center bg-[#0b1221] p-4 rounded-2xl border border-[#1e2b4a] shadow-inner group transition hover:border-amber-500/30"
            >
              <div>
                <p className="text-white text-sm font-bold capitalize">
                  {item.name}
                </p>

                <p className="text-amber-500/70 text-xs font-mono mt-0.5">
                  {item.date.split("-").reverse().join("/")} • {item.phone}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleWhatsApp(item.name, item.phone, item.date)
                  }
                  className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  title="Avvisa su WhatsApp"
                >
                  💬 Avvisa
                </button>

                <button
                  onClick={() => openRemovePopup(item)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 w-8 h-8 flex items-center justify-center rounded-xl transition font-bold"
                  title="Rimuovi"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
