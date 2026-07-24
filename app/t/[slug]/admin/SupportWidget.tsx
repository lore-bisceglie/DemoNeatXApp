"use client";

import { useState } from "react";
import { MessageCircleQuestion } from "lucide-react";

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
      {/* FAB (Floating Action Button) - styled like the Translate Globe */}
      <div className="fixed bottom-3 left-12 sm:bottom-6 sm:left-20 z-[9998] pointer-events-auto">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#0b1221] border border-[#1e2b4a] text-slate-300 hover:text-white p-2 sm:p-3 rounded-full shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center justify-center group"
          title="Segnala un Problema / Supporto"
        >
          <MessageCircleQuestion className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>

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
