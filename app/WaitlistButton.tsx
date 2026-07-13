"use client";

import { useState } from "react";

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

type WaitlistButtonProps = {
  selectedDate: string;
  tenantId: string;
  selectedService: Service | null;
};

export default function WaitlistButton({
  selectedDate,
  tenantId,
  selectedService,
}: WaitlistButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const formattedDate = selectedDate
    ? selectedDate.split("-").reverse().join("/")
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !phone) {
      setError("Inserisci nome e numero WhatsApp.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          date: selectedDate,
          tenantId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Errore durante il salvataggio.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl text-center text-sm font-bold animate-in zoom-in-95 duration-300">
        ✅ Ottimo! Ti abbiamo aggiunto alla lista.
        <br />
        <span className="text-xs font-normal opacity-80">
          Ti avviseremo su WhatsApp se si libera un posto.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-[#0b1221] border border-[#1e2b4a] rounded-3xl shadow-lg relative overflow-hidden">
      <div className="absolute -right-4 -top-4 text-8xl opacity-[0.03] pointer-events-none">
        ⏳
      </div>

      <h3 className="text-white font-extrabold mb-2 text-center text-lg">
        Non trovi l'orario ideale?
      </h3>

      <p className="text-slate-400 text-xs text-center mb-5 max-w-sm leading-relaxed">
        Aggiungiti alla Lista d'Attesa. Se si libera un posto per il{" "}
        <b>{formattedDate}</b>
        {selectedService ? (
          <>
            {" "}
            per <b>{selectedService.name}</b>
          </>
        ) : null}
        , ti avvisiamo subito su WhatsApp!
      </p>

      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-6 py-3 rounded-xl text-sm font-extrabold transition flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          ⏳ Mettiti in Lista d'Attesa
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <input
            type="text"
            placeholder="Il tuo nome"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder-slate-500"
          />

          <input
            type="tel"
            placeholder="Numero WhatsApp"
            required
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError("");
            }}
            className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder-slate-500"
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-white bg-[#131c31] border border-[#1e2b4a] transition"
            >
              Annulla
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-[2] px-4 py-3 rounded-xl text-sm font-bold text-[#050814] bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition"
            >
              {loading ? "Invio..." : "Conferma"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}