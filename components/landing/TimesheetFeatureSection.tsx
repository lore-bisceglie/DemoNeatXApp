"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  Download,
  FileSpreadsheet,
  Sparkles,
  Clock3,
  Ban,
  FileDown,
} from "lucide-react";

// --- Dati mockup ---
const STAFF = [
  {
    name: "Luca",
    avatar: "L",
    color: "from-cyan-500 to-blue-500",
    days: [
      { label: "09:00–13:00\n15:00–19:00", type: "work" },
      { label: "09:00–15:00", type: "work" },
      { label: "Riposo", type: "off" },
      { label: "09:00–19:00", type: "work" },
      { label: "Ferie", type: "ferie" },
    ],
  },
  {
    name: "Sara",
    avatar: "S",
    color: "from-pink-500 to-rose-500",
    days: [
      { label: "14:00–20:00", type: "work" },
      { label: "Permesso", type: "permesso" },
      { label: "09:00–13:00", type: "work" },
      { label: "Riposo", type: "off" },
      { label: "10:00–18:00", type: "work" },
    ],
  },
  {
    name: "Marco",
    avatar: "M",
    color: "from-amber-500 to-orange-500",
    days: [
      { label: "Ferie", type: "ferie" },
      { label: "10:00–18:00", type: "work" },
      { label: "09:00–12:00", type: "work" },
      { label: "Permesso", type: "permesso" },
      { label: "09:00–19:00", type: "work" },
    ],
  },
];

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven"];

const CSV_LINES = [
  "Data;Giorno;Dipendente;Ore Teoriche;Ferie;Pausa;Permesso;Ore Effettive",
  "01/07/2026;Mercoledì;Luca;8.00;0;0;0;8.00",
  "01/07/2026;Mercoledì;Sara;8.00;0;0;1.5;6.50",
  "02/07/2026;Giovedì;Luca;8.00;8;0;0;0.00",
  "02/07/2026;Giovedì;Marco;8.00;0;0;2;6.00",
  "...",
  "TOTALE LUGLIO;;Luca;168.00;16;0;0;152.00",
  "TOTALE LUGLIO;;Sara;168.00;0;4;6;158.00",
  "TOTALE LUGLIO;;Marco;168.00;8;0;4;156.00",
];

type CellType = "work" | "off" | "ferie" | "permesso";

function cellStyle(type: CellType) {
  switch (type) {
    case "work":
      return "text-emerald-300 bg-emerald-500/8 border-emerald-500/20";
    case "off":
      return "text-slate-500 bg-white/[0.02] border-white/5 line-through";
    case "ferie":
      return "text-amber-300 bg-amber-500/10 border-amber-500/20";
    case "permesso":
      return "text-blue-300 bg-blue-500/10 border-blue-500/20";
  }
}

// --- Blocco stat ---
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 text-center">
      <span className="text-2xl font-black text-white">{value}</span>
      <span className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </span>
    </div>
  );
}

// --- Fase animazione ---
type Phase = "sheet" | "agenda" | "csv";

export default function TimesheetFeatureSection() {
  const [phase, setPhase] = useState<Phase>("sheet");
  const [csvLine, setCsvLine] = useState(0);
  const [highlightCol, setHighlightCol] = useState<number | null>(null);
  const [highlightRow, setHighlightRow] = useState<number | null>(null);

  // Ciclo animazione automatica
  useEffect(() => {
    const sequence: { phase: Phase; delay: number }[] = [
      { phase: "sheet", delay: 2200 },
      { phase: "agenda", delay: 2200 },
      { phase: "csv", delay: 3200 },
    ];
    let i = 0;
    const next = () => {
      i = (i + 1) % sequence.length;
      setPhase(sequence[i].phase);
      setCsvLine(0);
      t = setTimeout(next, sequence[i].delay);
    };
    let t = setTimeout(next, sequence[0].delay);
    return () => clearTimeout(t);
  }, []);

  // Animazione righe CSV
  useEffect(() => {
    if (phase !== "csv") return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setCsvLine(i);
      if (i >= CSV_LINES.length - 1) clearInterval(t);
    }, 280);
    return () => clearInterval(t);
  }, [phase]);

  // Highlight cella random nella fase sheet
  useEffect(() => {
    if (phase !== "sheet") { setHighlightCol(null); setHighlightRow(null); return; }
    const t = setInterval(() => {
      setHighlightRow(Math.floor(Math.random() * STAFF.length));
      setHighlightCol(Math.floor(Math.random() * DAYS.length));
    }, 900);
    return () => clearInterval(t);
  }, [phase]);

  return (
    <section className="relative z-10 overflow-hidden bg-[#07111f] py-24">
      {/* Linea top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      {/* Glow */}
      <div className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full bg-emerald-500/8 blur-[120px]" />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-cyan-500/8 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Header centrato */}
        <div className="mb-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-emerald-300">
            <Sparkles size={13} />
            Solo su NeatX
          </div>
          <h2 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            I turni su Google Fogli.{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Il commercialista ringrazia.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-relaxed text-slate-400">
            Aggiorni il foglio che già usi. NeatX legge gli orari reali, blocca
            ferie e riposi nell'agenda, poi ti dà il file pronto da mandare al
            commercialista — senza riscrivere nulla a mano.
          </p>

          {/* Stat bar */}
          <div className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-3">
            <Stat value="0 min" label="per aggiornare" />
            <Stat value="1 click" label="per esportare" />
            <Stat value="0 errori" label="da correggere" />
          </div>
        </div>

        {/* Layout principale: mockup + pannello fasi */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_420px]">
          {/* Mockup animato */}
          <div className="relative rounded-3xl border border-white/10 bg-[#050c16] p-5 shadow-[0_0_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            {/* Tab fasi */}
            <div className="mb-5 flex gap-2">
              {(["sheet", "agenda", "csv"] as Phase[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPhase(p)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-widest transition-all ${
                    phase === p
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {p === "sheet" && <FileSpreadsheet size={13} />}
                  {p === "agenda" && <CalendarCheck2 size={13} />}
                  {p === "csv" && <FileDown size={13} />}
                  {p === "sheet" ? "Foglio" : p === "agenda" ? "Agenda" : "Export"}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                  Live
                </span>
              </div>
            </div>

            {/* FASE: Google Sheet */}
            {phase === "sheet" && (
              <div className="animate-fade-in overflow-hidden rounded-2xl border border-[#1a2642]">
                <div className="grid grid-cols-6 border-b border-[#1a2642] bg-[#0b1221]">
                  <div className="col-span-1 px-3 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-600">
                    Staff
                  </div>
                  {DAYS.map((d) => (
                    <div
                      key={d}
                      className="px-2 py-3 text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-600"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                {STAFF.map((s, ri) => (
                  <div
                    key={s.name}
                    className="grid grid-cols-6 border-t border-[#1a2642]"
                  >
                    <div className="col-span-1 flex items-center gap-2 px-3 py-4">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${s.color} text-[10px] font-black text-white`}
                      >
                        {s.avatar}
                      </div>
                      <span className="text-xs font-bold text-white">
                        {s.name}
                      </span>
                    </div>
                    {s.days.map((cell, ci) => (
                      <div
                        key={ci}
                        className={`px-2 py-3 text-center transition-all duration-300 ${
                          highlightRow === ri && highlightCol === ci
                            ? "ring-1 ring-inset ring-emerald-400/60 bg-emerald-500/10"
                            : ""
                        }`}
                      >
                        <span
                          className={`inline-block rounded-lg border px-1.5 py-1 text-[10px] font-bold leading-tight whitespace-pre-line ${cellStyle(cell.type as CellType)}`}
                        >
                          {cell.label}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="border-t border-[#1a2642] bg-[#0b1221] px-4 py-2 text-[10px] font-bold text-slate-600">
                  Google Sheets — orari-team-luglio-2026
                </div>
              </div>
            )}

            {/* FASE: Agenda */}
            {phase === "agenda" && (
              <div className="animate-fade-in space-y-3">
                <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Agenda pubblica — Martedì 2 Luglio
                </p>
                {STAFF.map((s) => {
                  const day = s.days[1]; // Martedì
                  const isOff =
                    day.type === "off" ||
                    day.type === "ferie" ||
                    day.type === "permesso";
                  return (
                    <div
                      key={s.name}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                        isOff
                          ? "border-white/5 bg-white/[0.02] opacity-40"
                          : "border-emerald-500/20 bg-emerald-500/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${s.color} text-xs font-black text-white`}
                        >
                          {s.avatar}
                        </div>
                        <div>
                          <p
                            className={`text-sm font-bold ${isOff ? "text-slate-600" : "text-white"}`}
                          >
                            {s.name}
                          </p>
                          <p
                            className={`text-xs ${isOff ? "text-slate-700" : "text-emerald-400"}`}
                          >
                            {day.label}
                          </p>
                        </div>
                      </div>
                      {isOff ? (
                        <div className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-600">
                          <Ban size={11} />
                          Non disponibile
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
                          <Clock3 size={11} />
                          Prenota
                        </div>
                      )}
                    </div>
                  );
                })}
                <p className="pt-2 text-center text-[10px] font-bold text-slate-600">
                  I clienti vedono solo chi lavora davvero quel giorno
                </p>
              </div>
            )}

            {/* FASE: CSV Export */}
            {phase === "csv" && (
              <div className="animate-fade-in">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    timesheet_luglio_2026.csv
                  </p>
                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[10px] font-bold text-cyan-300 border border-cyan-500/20">
                    Pronto per il commercialista
                  </span>
                </div>
                <div className="rounded-2xl border border-[#1a2642] bg-[#030810] p-4 font-mono text-[11px]">
                  {CSV_LINES.slice(0, csvLine + 1).map((line, i) => (
                    <div
                      key={i}
                      className={`leading-6 transition-all duration-200 ${
                        i === 0
                          ? "font-bold text-slate-400"
                          : line === "..."
                          ? "text-slate-700 py-1"
                          : line.startsWith("TOTALE")
                          ? "mt-2 font-bold text-emerald-400"
                          : "text-slate-500"
                      } ${i === csvLine ? "text-white" : ""}`}
                    >
                      {line}
                    </div>
                  ))}
                  {csvLine < CSV_LINES.length - 1 && (
                    <span className="inline-block h-3.5 w-1.5 animate-pulse bg-emerald-400 align-middle" />
                  )}
                </div>
                {csvLine >= CSV_LINES.length - 1 && (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
                    <Download size={18} className="shrink-0 text-emerald-400" />
                    <div>
                      <p className="text-sm font-bold text-white">File pronto</p>
                      <p className="text-xs text-slate-400">
                        168 ore, 3 dipendenti — Luglio 2026
                      </p>
                    </div>
                    <span className="ml-auto rounded-xl bg-emerald-500/20 px-3 py-1.5 text-xs font-black text-emerald-300">
                      Scarica
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pannello destra: vantaggi + CTA */}
          <div className="flex flex-col gap-5">
            {/* Cards vantaggio */}
            {[
              {
                icon: FileSpreadsheet,
                color: "emerald",
                title: "Usi già Google Fogli?",
                body: "Incolla il link. NeatX legge i turni in automatico — nessun doppio inserimento, nessun gestionale nuovo da imparare.",
              },
              {
                icon: CalendarCheck2,
                color: "cyan",
                title: "L'agenda si aggiorna da sola",
                body: "Luca ha preso ferie? I clienti non vedono più i suoi slot. Riposi, permessi e chiusure bloccano tutto in tempo reale.",
              },
              {
                icon: Download,
                color: "blue",
                title: "Un click al commercialista",
                body: "Export mensile con ore teoriche, ferie, pause e ore effettive lavorate. Formato CSV italiano, subito leggibile in Excel.",
              },
            ].map((card) => {
              const Icon = card.icon;
              const c = card.color;
              return (
                <div
                  key={card.title}
                  className={`rounded-2xl border border-${c}-500/15 bg-${c}-500/5 p-5`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-${c}-500/20 bg-${c}-500/10 text-${c}-300`}
                    >
                      <Icon size={17} />
                    </div>
                    <h3 className="text-sm font-extrabold text-white">
                      {card.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {card.body}
                  </p>
                </div>
              );
            })}

            {/* CTA */}
            <Link
              href="/registrazione"
              className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4 text-sm font-extrabold text-[#03111f] shadow-[0_0_40px_rgba(16,185,129,0.2)] transition hover:scale-[1.02] hover:from-emerald-400 hover:to-cyan-400"
            >
              Prova gratis — turni e commercialista inclusi
              <ArrowRight size={17} />
            </Link>
            <p className="text-center text-xs font-bold text-slate-600">
              Nessuna carta di credito · Attivo in 2 minuti
            </p>
          </div>
        </div>
      </div>

      {/* Linea bottom */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
    </section>
  );
}
