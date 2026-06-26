"use client";

import { useState } from "react";

type WaitlistItem = {
  id: string;
  name: string;
  phone: string;
  date: string;
};

export default function WaitlistDashboard() {
  // 🛡️ DATI FITTIZI PER LA DEMO (Così il componente non risulta mai vuoto)
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([
    { id: "demo-1", name: "Clarissa Bianchi", phone: "393331112222", date: "2026-06-15" },
    { id: "demo-2", name: "Veronica Neri", phone: "393334445555", date: "2026-06-16" }
  ]);
  
  const [deleteTarget, setDeleteTarget] = useState<WaitlistItem | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 🚀 NUOVO STATO PER IL MODALE DI AVVISO WHATSAPP PREMIUM
  const [demoAlert, setDemoAlert] = useState<{ show: boolean; name: string; date: string } | null>(null);

  // 🗑️ Rimosso lo useEffect che andava a chiamare /api/waitlist vera e propria.

  const handleWhatsApp = (name: string, phone: string, date: string) => {
    const formattedDate = date.split("-").reverse().join("/");
    // 🛡️ INVECE DI APRIRE VERAMENTE WHATSAPP (Perché siamo in Demo), APRIAMO IL MODALE NEATX
    setDemoAlert({ show: true, name, date: formattedDate });
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
    
    // 🛡️ SIMULAZIONE DEMO: Ritardo finto per cancellare l'item dall'array locale
    setTimeout(() => {
      setWaitlist((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setLoading(false);
    }, 600);
  };

  if (waitlist.length === 0) return null;

  return (
    <>
      {/* 🚀 NUOVO MODALE SIMULAZIONE WHATSAPP PREMIUM */}
      {demoAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b1221] border border-[#00b4ff]/30 p-8 rounded-3xl shadow-2xl shadow-cyan-900/20 max-w-sm w-full text-center transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Simulazione Avviso</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Nella realtà, si aprirebbe WhatsApp con questo messaggio pronto da inviare a <strong>{demoAlert.name}</strong>:<br/><br/>
              <span className="italic text-slate-300">
                "Ciao {demoAlert.name}! Sono la Demo NeatX.<br/>Si è appena liberato un posto per la giornata del {demoAlert.date}.<br/>Sei ancora interessato? Rispondimi a questo messaggio così te lo blocco subito!"
              </span>
            </p>
            <button 
              onClick={() => setDemoAlert(null)} 
              className="w-full bg-[#131c31] hover:bg-[#1a2642] text-white border border-[#1e2b4a] hover:border-[#00b4ff]/50 font-bold py-3 rounded-xl transition shadow-lg"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}

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
