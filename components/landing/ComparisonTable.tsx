"use client";

import { Check, X } from "lucide-react";

const ROWS = [
  { label: "Commissioni sugli incassi", neatx: "0%", booksy: "20-30%", treatwell: "~25%" },
  { label: "Visibile su Google", neatx: <Check size={18} className="text-emerald-400" />, booksy: <X size={18} className="text-red-400" />, treatwell: <span className="text-slate-400">Solo nella loro app</span> },
  { label: "Link prenotazione brandizzato", neatx: <Check size={18} className="text-emerald-400" />, booksy: <X size={18} className="text-red-400" />, treatwell: <X size={18} className="text-red-400" /> },
  { label: "Promemoria automatici", neatx: <span className="text-amber-300">In manutenzione</span>, booksy: <span className="text-slate-400">Solo in-app</span>, treatwell: <span className="text-slate-400">Solo in-app</span> },
  { label: "Acconti / Caparre online", neatx: <Check size={18} className="text-emerald-400" />, booksy: <Check size={18} className="text-emerald-400" />, treatwell: <X size={18} className="text-red-400" /> },
  { label: "Prova gratuita", neatx: <span className="text-emerald-400">14 giorni</span>, booksy: <X size={18} className="text-red-400" />, treatwell: <X size={18} className="text-red-400" /> },
  { label: "Piani mensili trasparenti", neatx: <span className="text-emerald-400 font-bold">Pro 29€ · Elite 59€ · VIP 149€</span>, booksy: <span className="text-red-400">Variabile</span>, treatwell: <span className="text-red-400">Variabile</span> },
  { label: "Multi-staff", neatx: <Check size={18} className="text-emerald-400" />, booksy: <Check size={18} className="text-emerald-400" />, treatwell: <Check size={18} className="text-emerald-400" /> },
  { label: "Recensioni automatiche", neatx: <span className="text-emerald-400">Smart routing</span>, booksy: <X size={18} className="text-red-400" />, treatwell: <X size={18} className="text-red-400" /> },
  { label: "Aggiunta appuntamento a Google Calendar", neatx: <Check size={18} className="text-emerald-400" />, booksy: <span className="text-slate-400">A pagamento</span>, treatwell: <X size={18} className="text-red-400" /> },
  { label: "Assistenza prioritaria", neatx: <Check size={18} className="text-emerald-400" />, booksy: <X size={18} className="text-red-400" />, treatwell: <X size={18} className="text-red-400" /> },
];

export default function ComparisonTable() {
  return (
    <section className="relative z-10 bg-[#0b1221] py-24 border-y border-[#1a2642]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Più controllo. Meno trattenute.
          </h2>
          <p className="text-slate-400 font-medium max-w-2xl mx-auto">
            Con NeatX paghi un prezzo definito e non cediamo percentuali sulle tue prenotazioni.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-[#1a2642] shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1a2642] bg-[#050814]">
                <th className="p-5 text-sm font-extrabold text-slate-400 uppercase tracking-widest">Caratteristica</th>
                <th className="p-5 text-sm font-extrabold text-[#00b4ff] uppercase tracking-widest">NeatX</th>
                <th className="p-5 text-sm font-extrabold text-slate-400 uppercase tracking-widest">Booksy</th>
                <th className="p-5 text-sm font-extrabold text-slate-400 uppercase tracking-widest">Treatwell</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.label} className={`border-b border-[#1a2642] ${i % 2 === 0 ? "bg-[#0b1221]/50" : "bg-[#050814]/30"} hover:bg-cyan-900/20 hover:shadow-[inset_2px_0_0_#00b4ff] transition-all cursor-default`}>
                  <td className="p-5 text-sm font-bold text-white group-hover:text-cyan-300">{row.label}</td>
                  <td className="p-5 text-sm font-semibold text-slate-200">{row.neatx}</td>
                  <td className="p-5 text-sm text-slate-400">{row.booksy}</td>
                  <td className="p-5 text-sm text-slate-400">{row.treatwell}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 font-medium">
          * Booksy e Treatwell applicano commissioni variabili in base al volume. I dati sono aggiornati a luglio 2026.
        </div>
      </div>
    </section>
  );
}
