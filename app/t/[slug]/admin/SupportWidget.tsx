"use client";

import { useState } from "react";

export default function SupportWidget({ tenantId }: { tenantId: string; colorTheme: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, message })
      });

      if (!res.ok) throw new Error("Errore invio");

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setMessage("");
      }, 3000);
    } catch (_error) {
      alert("Errore di connessione. Riprova più tardi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* FAB (Floating Action Button) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-slate-800 text-white p-4 rounded-full shadow-2xl hover:bg-slate-700 transition-transform hover:scale-105 border border-slate-700 flex items-center justify-center group"
        title="Segnala un Problema / Supporto"
      >
        <span className="text-2xl group-hover:hidden">💬</span>
        <span className="hidden group-hover:inline-block px-2 font-bold text-sm">Supporto</span>
      </button>

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                💬 Hai bisogno di aiuto?
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white text-xl p-1">
                &times;
              </button>
            </div>

            {success ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-lg font-bold text-emerald-400 mb-2">Messaggio Inviato!</h3>
                <p className="text-slate-400 text-sm">Il team di assistenza NeatX lo ha ricevuto e ti risponderà al più presto sul tuo numero WhatsApp.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="text-sm text-slate-400 mb-4">
                  Hai trovato un errore? Vuoi suggerire una modifica? Scrivi tutto qui, arriverà direttamente ai fondatori.
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Descrivi il problema o la tua richiesta..."
                  required
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none mb-4"
                />
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {sending ? "Invio in corso..." : "Invia a NeatX"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
