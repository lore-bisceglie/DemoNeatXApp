"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type EditableService = {
  key: string;
  name: string;
  duration: number;
  price: number;
};

const TEMPLATES: Record<string, { icon: string; title: string; services: { name: string; duration: number; price: number }[] }> = {
  barbiere: {
    icon: "✂️",
    title: "Barbiere / Parrucchiere",
    services: [
      { name: "Taglio Capelli", duration: 30, price: 20 },
      { name: "Taglio e Barba", duration: 45, price: 30 },
    ],
  },
  estetista: {
    icon: "💅",
    title: "Centro Beauty / SPA",
    services: [
      { name: "Massaggio Relax", duration: 60, price: 50 },
      { name: "Pulizia Viso", duration: 45, price: 35 },
      { name: "Manicure", duration: 30, price: 20 },
    ],
  },
  psicologo: {
    icon: "🛋️",
    title: "Psicologo / Consulente",
    services: [
      { name: "Prima Visita", duration: 60, price: 80 },
      { name: "Seduta di Supporto", duration: 60, price: 70 },
    ],
  },
  generico: {
    icon: "📅",
    title: "Altro Professionista",
    services: [
      { name: "Appuntamento Standard", duration: 30, price: 0 },
    ],
  },
};

const DAYS = [
  { value: "0", label: "Dom" },
  { value: "1", label: "Lun" },
  { value: "2", label: "Mar" },
  { value: "3", label: "Mer" },
  { value: "4", label: "Gio" },
  { value: "5", label: "Ven" },
  { value: "6", label: "Sab" },
];

function totalSteps() {
  return 5;
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("19:00");
  const [breakStart, setBreakStart] = useState("");
  const [breakEnd, setBreakEnd] = useState("");
  const [closedDays, setClosedDays] = useState<string[]>(["0", "1"]);
  const [template, setTemplate] = useState<string | null>(null);
  const [services, setServices] = useState<EditableService[]>([]);
  const [serviceKeyCounter, setServiceKeyCounter] = useState(100);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const [successData, setSuccessData] = useState<{ slug: string; password: string } | null>(null);

  const progressPercent = useMemo(() => Math.round((step / totalSteps()) * 100), [step]);

  const loadTemplate = (id: string) => {
    setTemplate(id);
    const tpl = TEMPLATES[id];
    if (tpl) {
      setServices(tpl.services.map((s, i) => ({ key: `srv_${i}`, ...s })));
    }
    setStep(3);
  };

  const addService = () => {
    const key = `srv_${serviceKeyCounter}`;
    setServiceKeyCounter(prev => prev + 1);
    setServices(prev => [...prev, { key, name: "", duration: 30, price: 0 }]);
  };

  const removeService = (key: string) => {
    setServices(prev => prev.filter(s => s.key !== key));
  };

  const updateService = (key: string, field: keyof EditableService, value: string | number) => {
    setServices(prev => prev.map(s => (s.key === key ? { ...s, [field]: value } : s)));
  };

  const handleCreate = async () => {
    if (!template) return;
    setIsGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            template,
            phone,
            openTime,
            closeTime,
            breakStart: breakStart || null,
            breakEnd: breakEnd || null,
            closedDays: JSON.stringify(closedDays.map(Number)),
            customServices: services.map(s => ({ name: s.name, duration: s.duration, price: s.price })),
          }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore sconosciuto");

      setTimeout(() => {
        setIsGenerating(false);
        setSuccessData({ slug: data.slug, password: data.password });
        setStep(5);
      }, 2500);
    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-6 text-white text-center font-sans">
        <div className="relative flex justify-center items-center mb-8">
          <div className="absolute w-32 h-32 border-4 border-[#1a2642] border-t-[#00b4ff] rounded-full animate-spin"></div>
          <div className="absolute w-24 h-24 border-4 border-[#1a2642] border-b-purple-500 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
          <span className="text-4xl">🤖</span>
        </div>
        <h2 className="text-3xl font-extrabold mb-3">L'IA sta assemblando l'App</h2>
        <p className="text-slate-400 font-medium animate-pulse max-w-sm">
          Stiamo configurando il database, i servizi per "{name}" e attivando il sistema WhatsApp...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col p-6 text-slate-200 font-sans selection:bg-[#00b4ff]/30 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#00b4ff]/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold text-white">Neat</span>
          <span className="text-[#00b4ff] text-xl font-extrabold">X</span>
        </div>
        {step > 1 && step < 5 && (
          <button
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            className="text-sm text-slate-500 hover:text-white font-medium transition-colors"
          >
            ← Indietro
          </button>
        )}
      </div>

      {step > 1 && step < 5 && (
        <div className="w-full max-w-2xl mx-auto mb-8 relative z-10">
          <div className="flex gap-1 mb-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i + 1 < step ? "bg-[#00b4ff]" : i + 1 === step ? "bg-[#00b4ff] animate-pulse" : "bg-[#1a2642]"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span className={step === 1 ? "text-[#00b4ff] font-bold" : ""}>Info</span>
            <span className={step === 2 ? "text-[#00b4ff] font-bold" : ""}>Orari</span>
            <span className={step === 3 ? "text-[#00b4ff] font-bold" : ""}>Servizi</span>
            <span className={step === 4 ? "text-[#00b4ff] font-bold" : ""}>Anteprima</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto relative z-10">
        {/* STEP 1: Nome */}
        {step === 1 && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Come si chiama <br className="hidden md:block" /> la tua attività?
            </h1>
            <p className="text-slate-400 mb-8 text-lg">Iniziamo dalle basi. Il nome apparirà sulla tua App.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim().length > 2) setStep(2);
              }}
              className="w-full"
            >
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                placeholder="es. BarberShop Milano"
                className="w-full bg-transparent border-b-2 border-slate-700 text-3xl md:text-4xl text-white font-bold pb-4 focus:outline-none focus:border-[#00b4ff] transition-colors placeholder:text-slate-700"
              />
              <button
                type="submit"
                disabled={name.trim().length < 3}
                className="mt-10 px-8 py-4 bg-white text-black hover:bg-[#00b4ff] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black font-extrabold rounded-full transition-all text-lg flex items-center gap-2"
              >
                Continua →
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Orari e contatti */}
        {step === 2 && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Orari e <br className="hidden md:block" /> contatti
            </h1>
            <p className="text-slate-400 mb-8 text-lg">Configura quando lavori e dove ricevere le prenotazioni.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  📱 Numero WhatsApp
                </label>
                <p className="text-xs text-slate-500 mb-2">Riceverai qui le notifiche delle prenotazioni.</p>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="es. 3912345678"
                  className="w-full bg-[#0b1221] border border-[#1a2642] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff] placeholder-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">🔓 Apertura</label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full bg-[#0b1221] border border-[#1a2642] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">🔒 Chiusura</label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full bg-[#0b1221] border border-[#1a2642] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  🍝 Pausa pranzo (opzionale)
                </label>
                <p className="text-xs text-slate-500 mb-2">Se lavori in turno unico, lascia vuoto.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Inizio pausa</label>
                    <input
                      type="time"
                      value={breakStart}
                      onChange={(e) => setBreakStart(e.target.value)}
                      className="w-full bg-[#0b1221] border border-[#1a2642] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Fine pausa</label>
                    <input
                      type="time"
                      value={breakEnd}
                      onChange={(e) => setBreakEnd(e.target.value)}
                      className="w-full bg-[#0b1221] border border-[#1a2642] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  📅 Giorni di chiusura settimanale
                </label>
                <p className="text-xs text-slate-500 mb-2">Seleziona i giorni in cui sei chiuso.</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() =>
                        setClosedDays((prev) =>
                          prev.includes(day.value) ? prev.filter((d) => d !== day.value) : [...prev, day.value]
                        )
                      }
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${
                        closedDays.includes(day.value)
                          ? "bg-red-500/20 border-red-500 text-red-300"
                          : "bg-[#0b1221] border-[#1a2642] text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!phone}
              className="mt-10 px-8 py-4 bg-white text-black hover:bg-[#00b4ff] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black font-extrabold rounded-full transition-all text-lg flex items-center gap-2"
            >
              Continua →
            </button>
          </div>
        )}

        {/* STEP 3: Scegli template e personalizza servizi */}
        {step === 3 && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Scegli i tuoi <br className="hidden md:block" /> servizi
            </h1>
            <p className="text-slate-400 mb-8 text-lg">Parti da un modello o personalizza tutto da zero.</p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 font-bold">
                {error}
              </div>
            )}

            {!template ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(TEMPLATES).map(([id, tpl]) => (
                  <button
                    key={id}
                    onClick={() => loadTemplate(id)}
                    className="bg-[#0b1221] hover:bg-[#131c31] border border-[#1a2642] hover:border-[#00b4ff]/50 p-6 rounded-3xl transition-all flex flex-col items-start gap-3 group text-left"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">{tpl.icon}</span>
                    <span className="text-white font-bold text-lg">{tpl.title}</span>
                    <span className="text-xs text-slate-500">
                      {tpl.services.length} servizi predefiniti
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    {TEMPLATES[template]?.icon} {TEMPLATES[template]?.title}
                  </h2>
                  <button
                    onClick={() => {
                      setTemplate(null);
                      setServices([]);
                    }}
                    className="text-xs text-slate-500 hover:text-white font-medium transition-colors underline underline-offset-4"
                  >
                    Cambia categoria
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  {services.map((srv) => (
                    <div
                      key={srv.key}
                      className="bg-[#0b1221] border border-[#1a2642] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                    >
                      <div className="flex-1 w-full sm:w-auto">
                        <input
                          type="text"
                          value={srv.name}
                          onChange={(e) => updateService(srv.key, "name", e.target.value)}
                          placeholder="Nome servizio"
                          className="w-full bg-transparent border-b border-slate-700 text-white font-bold py-1 focus:outline-none focus:border-[#00b4ff] placeholder-slate-600"
                        />
                      </div>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">⏱</span>
                          <input
                            type="number"
                            value={srv.duration}
                            onChange={(e) => updateService(srv.key, "duration", parseInt(e.target.value) || 30)}
                            min={5}
                            max={480}
                            className="w-16 bg-[#050814] border border-[#1a2642] text-white rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-[#00b4ff]"
                          />
                          <span className="text-xs text-slate-500">min</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">€</span>
                          <input
                            type="number"
                            value={srv.price}
                            onChange={(e) => updateService(srv.key, "price", parseFloat(e.target.value) || 0)}
                            min={0}
                            step={1}
                            className="w-16 bg-[#050814] border border-[#1a2642] text-white rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-[#00b4ff]"
                          />
                        </div>
                        <button
                          onClick={() => removeService(srv.key)}
                          className="text-red-500 hover:text-red-400 text-lg px-2 transition"
                          title="Rimuovi servizio"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addService}
                  className="w-full py-3 border-2 border-dashed border-[#1a2642] hover:border-[#00b4ff]/50 text-slate-500 hover:text-[#00b4ff] rounded-2xl font-bold text-sm transition"
                >
                  + Aggiungi servizio
                </button>

                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setStep(4)}
                    className="flex-1 px-6 py-4 bg-[#0b1221] border border-[#1a2642] hover:border-[#00b4ff]/50 text-white font-extrabold rounded-full transition-all"
                  >
                    Anteprima →
                  </button>
                  <button
                    onClick={handleCreate}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-[#00b4ff] to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold rounded-full transition-all shadow-lg shadow-cyan-500/20"
                  >
                    Crea App 🚀
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Anteprima live */}
        {step === 4 && template && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Anteprima <br className="hidden md:block" /> della tua App
            </h1>
            <p className="text-slate-400 mb-8 text-lg">Ecco come vedranno i tuoi clienti la pagina di prenotazione.</p>

            <div className="bg-[#0b1221] border border-[#1a2642] rounded-3xl p-6 max-w-md mx-auto shadow-2xl shadow-cyan-900/10">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00b4ff] to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-extrabold">
                  {name.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-extrabold text-white">{name}</h2>
                <p className="text-sm text-slate-500">
                  {openTime} - {closeTime}
                  {breakStart && breakEnd ? ` · Pausa ${breakStart}-${breakEnd}` : ""}
                  {closedDays.length > 0 && ` · Chiuso ${closedDays.map(d => DAYS.find(day => day.value === d)?.label).join(", ")}`}
                </p>
              </div>

              <div className="space-y-2 mb-6">
                {services.filter(s => s.name.trim()).map((srv) => (
                  <div
                    key={srv.key}
                    className="bg-[#050814] border border-[#1a2642] rounded-xl px-4 py-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{srv.name}</p>
                      <p className="text-xs text-slate-500">{srv.duration} min</p>
                    </div>
                    <span className="text-sm font-extrabold text-[#00b4ff]">
                      {srv.price > 0 ? `${srv.price}€` : "Gratis"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-[#050814] border border-[#1a2642] rounded-xl p-4 text-center">
                <p className="text-sm text-slate-400 font-medium">
                  📱 I clienti prenotano in 30 secondi
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Riceverai la notifica su WhatsApp
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-6 py-4 bg-[#0b1221] border border-[#1a2642] hover:border-[#00b4ff]/50 text-white font-extrabold rounded-full transition-all"
              >
                ← Modifica servizi
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-[#00b4ff] to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold rounded-full transition-all shadow-lg shadow-cyan-500/20"
              >
                Crea App 🚀
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Successo → Wizard */}
        {step === 5 && successData && (
          <div className="w-full animate-in fade-in zoom-in duration-700 max-w-lg mx-auto">
            <div className="bg-[#0b1221] p-8 rounded-3xl border border-[#1a2642] shadow-2xl text-center mb-6">
              <div className="w-20 h-20 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center text-4xl mb-6 border border-green-500/20 mx-auto">
                ✓
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-2">{name} è online! 🎉</h1>
              <p className="text-slate-400 mb-6 font-medium">
                La tua App è attiva per 7 giorni gratis. Ecco i prossimi passi:
              </p>

              <div className="space-y-4 text-left mb-8">
                <div className="bg-[#050814] p-4 rounded-2xl border border-[#1a2642] flex items-start gap-4">
                  <span className="bg-[#00b4ff] text-black w-8 h-8 rounded-full flex items-center justify-center font-extrabold shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="font-bold text-white text-sm">Condividi il link su Instagram</p>
                    <p className="text-xs text-slate-500 mt-1">I clienti cliccano e prenotano in 30 secondi.</p>
                    <div className="mt-2 bg-[#0b1221] border border-[#1a2642] rounded-xl p-3 flex items-center justify-between gap-2">
                      <span className="text-cyan-400 text-sm font-medium truncate">neatx.store/t/{successData.slug}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(`https://neatx.store/t/${successData.slug}`)}
                        className="shrink-0 bg-[#00b4ff]/10 text-[#00b4ff] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#00b4ff]/20 transition"
                      >
                        Copia
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#050814] p-4 rounded-2xl border border-purple-500/30 flex items-start gap-4">
                  <span className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-extrabold shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="font-bold text-white text-sm">Aggiungi lo staff</p>
                    <p className="text-xs text-slate-500 mt-1">Nella dashboard puoi aggiungere i tuoi collaboratori e assegnare i servizi.</p>
                  </div>
                </div>

                <div className="bg-[#050814] p-4 rounded-2xl border border-emerald-500/30 flex items-start gap-4">
                  <span className="bg-emerald-500 text-black w-8 h-8 rounded-full flex items-center justify-center font-extrabold shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="font-bold text-white text-sm">Fai una prenotazione di prova</p>
                    <p className="text-xs text-slate-500 mt-1">Usa la dashboard per simulare una prenotazione e vedere come funziona.</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#050814] p-4 rounded-2xl border border-yellow-500/20 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-yellow-500 text-xs font-bold uppercase tracking-widest">Password Admin</span>
                  <span className="font-mono text-lg text-yellow-400 font-bold tracking-widest select-all">{successData.password}</span>
                </div>
              </div>

              <Link
                href={`/t/${successData.slug}/admin`}
                className="w-full py-5 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-400 hover:to-blue-500 text-white font-extrabold rounded-2xl transition-all text-lg flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 hover:scale-[1.02]"
              >
                Entra nella Dashboard →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
