"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, Phone, Users, CheckCircle, ChevronRight, ChevronLeft, X, AlertCircle, Loader2, Navigation } from "lucide-react";
import { getRomeDate } from "@/lib/rome-time";

interface Props {
  tenant: {
    id: string;
    name: string;
    slug: string;
    themeColor: string;
    logoUrl: string | null;
    description: string | null;
    phone: string | null;
    address: string | null;
  };
  location: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    mapsLink: string | null;
    openTime: string | null;
    closeTime: string | null;
    breakStart: string | null;
    breakEnd: string | null;
    closedDays: string | null;
    isMain?: boolean;
  };
  services: Array<{
    id: string;
    name: string;
    duration: number;
    price: number | null;
    priceInLocation?: number | null;
    staff: string[];
  }>;
  staff: Array<{
    id: string;
    name: string;
    services: string[];
  }>;
}

const SLASH = "/";

export default function SedeBookingClient({ tenant, location, services, staff }: Props) {
  const [calendarBounds] = useState(function () {
    var now = new Date();
    return {
      today: getRomeDate(now),
      maxDate: getRomeDate(new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)),
    };
  });
  const [step, setStep] = useState<"service" | "datetime" | "details" | "confirm">("service");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(calendarBounds.today);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [cancelToken, setCancelToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(function () {
    if (!selectedDate || !selectedService) {
      setAvailableSlots([]);
      return;
    }

    var currentServiceId: string = selectedService;
    var currentDate: string = selectedDate;

    async function fetchSlots() {
      setLoadingSlots(true);
      try {
        var serviceData = services.find(function (s) { return s.id === currentServiceId; });
        var params = new URLSearchParams({
          date: currentDate,
          tenantId: tenant.id,
          locationId: location.id,
          duration: (serviceData ? serviceData.duration : 30).toString(),
          serviceId: currentServiceId,
        });
        var res = await fetch("/api/availability?" + params.toString());
        if (res.ok) {
          var data = await res.json();
          setAvailableSlots(data.slots || []);
        }
      } catch (e) {
        console.error("Errore recupero slot:", e);
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [selectedDate, selectedService, location.id, tenant.id, services]);

  var selectedServiceData = useMemo(function () {
    return services.find(function (s) { return s.id === selectedService; });
  }, [services, selectedService]);

  function handleNext() {
    if (step === "service" && selectedService) { setStep("datetime"); return; }
    if (step === "datetime" && selectedTime) { setStep("details"); return; }
    if (step === "details" && name.trim() && phone.trim() && privacyAccepted) {
      setStep("confirm");
      return;
    }
  }

  function handlePrev() {
    if (step === "datetime") { setStep("service"); return; }
    if (step === "details") { setStep("datetime"); return; }
    if (step === "confirm") { setStep("details"); return; }
  }

  async function handleSubmit() {
    if (
      !name.trim() ||
      !phone.trim() ||
      !privacyAccepted ||
      !selectedService ||
      !selectedDate ||
      !selectedTime
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      var res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.replace(/\D/g, ""),
          date: selectedDate,
          time: selectedTime,
          tenantId: tenant.id,
          serviceId: selectedService,
          duration: selectedServiceData ? selectedServiceData.duration : 30,
          locationId: location.id,
          source: "ONLINE",
          privacyAccepted,
        }),
      });

      var data = await res.json();

      if (!res.ok) { throw new Error(data.error || "Errore prenotazione"); }

      setCancelToken(typeof data.cancelToken === "string" ? data.cancelToken : "");
      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  var themeColor = tenant.themeColor || "cyan";
  var gradient = "from-cyan-500 to-blue-600";
  if (themeColor === "emerald") { gradient = "from-emerald-500 to-teal-600"; }
  else if (themeColor === "rose") { gradient = "from-rose-500 to-pink-600"; }
  else if (themeColor === "amber") { gradient = "from-amber-500 to-orange-600"; }
  else if (themeColor === "violet") { gradient = "from-violet-500 to-purple-600"; }
  else if (themeColor === "indigo") { gradient = "from-indigo-500 to-blue-600"; }

  var progressPct = 0;
  if (step === "service") { progressPct = 25; }
  else if (step === "datetime") { progressPct = 50; }
  else if (step === "details") { progressPct = 75; }
  else if (step === "confirm") { progressPct = 100; }

  var stepIndex = 0;
  if (step === "service") { stepIndex = 0; }
  else if (step === "datetime") { stepIndex = 1; }
  else if (step === "details") { stepIndex = 2; }
  else if (step === "confirm") { stepIndex = 3; }

  if (success) {
    var dateParts = selectedDate.split("-").reverse();
    var dateStr = dateParts.join(SLASH);
    return (
      <div className="min-h-screen bg-[#050814] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0b1221] rounded-3xl border border-[#1a2642] p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <CheckCircle size={48} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Prenotazione Confermata!</h1>
          <p className="text-slate-400 mb-6">
            La prenotazione è stata registrata correttamente.
          </p>
          <div className="bg-[#131c31] rounded-2xl p-4 mb-6 text-left">
            <p className="font-bold text-white mb-2">{selectedServiceData ? selectedServiceData.name : ""}</p>
            <p className="text-slate-300">{dateStr} alle {selectedTime}</p>
            <p className="text-slate-400 text-sm mt-1">Sede: {location.name}</p>
          </div>
          {cancelToken && (
            <Link
              href={`/cancel/${cancelToken}`}
              className="mb-3 block w-full rounded-xl border border-red-500/30 bg-red-500/10 py-3 font-bold text-red-300"
            >
              Gestisci o annulla prenotazione
            </Link>
          )}
          <Link href={"/t/" + tenant.slug} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-xl block">
            Torna alla Home
          </Link>
        </div>
      </div>
    );
  }

  function renderStepIndicators() {
    var stepLabels = ["Servizio", "Quando", "Dettagli", "Conferma"];
    var steps = ["service", "datetime", "details", "confirm"];
    var items = [];
    for (var i = 0; i < steps.length; i++) {
      var isActive = stepIndex >= i;
      var circleClass = isActive ? "bg-cyan-500 text-white" : "bg-[#1a264a] text-slate-500";
      items.push(
        <div key={steps[i]} className={"flex items-center gap-1 " + (step === steps[i] ? "text-cyan-400" : "text-slate-500")}>
          <span className={"w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors " + circleClass}>
            {i + 1}
          </span>
          <span className="hidden sm:inline text-xs font-medium">{stepLabels[i]}</span>
        </div>
      );
      if (i < 3) {
        items.push(<span key={"sep-" + i} className="w-8 h-0.5 bg-[#1a264a] mx-1" />);
      }
    }
    return items;
  }

  function renderServiceStep() {
    var cards = [];
    for (let i = 0; i < services.length; i++) {
      const svc = services[i];
      const isSelected = selectedService === svc.id;
      const cardClass = isSelected
        ? "w-full relative p-5 rounded-2xl border-2 border-cyan-500 bg-cyan-500/5"
        : "w-full relative p-5 rounded-2xl border-2 border-[#1a264a] bg-[#0b1221] hover:border-cyan-500/30";
      cards.push(
        <button
          key={svc.id}
          onClick={function () {
            setSelectedService(svc.id);
            setSelectedTime(null);
          }}
          className={cardClass}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
              <Users size={24} className="text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-lg">{svc.name}</h3>
              <p className="text-slate-400 text-sm mt-1">
                {svc.duration} min &bull; {(svc.priceInLocation ?? svc.price) ? "€" + (svc.priceInLocation ?? svc.price) : "Prezzo da concordare"}
              </p>
            </div>
            {isSelected && (
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
                <CheckCircle size={18} className="text-white" />
              </div>
            )}
          </div>
        </button>
      );
    }
    return (
      <div className="space-y-4">
        {cards}
      </div>
    );
  }

  function renderDateTimeStep() {
    function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
      setSelectedDate(e.target.value);
      setSelectedTime(null);
    }

    var slotButtons: any[] = [];
    var noSlots = availableSlots.length === 0 && !loadingSlots;

    for (let i = 0; i < availableSlots.length; i++) {
      const sl = availableSlots[i];
      const isSlotSelected = selectedTime === sl;
      const btnClass = isSlotSelected
        ? "px-3 py-2.5 rounded-xl text-sm font-medium transition-all bg-cyan-500 text-white"
        : "px-3 py-2.5 rounded-xl text-sm font-medium transition-all bg-[#131c31] border border-[#1a264a] text-slate-300 hover:border-cyan-500/30 hover:text-white";
      slotButtons.push(
        <button
          key={sl}
          onClick={function () { setSelectedTime(sl); }}
          className={btnClass}
        >
          {sl}
        </button>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Data</label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            min={calendarBounds.today}
            max={calendarBounds.maxDate}
            className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Orario {loadingSlots && <Loader2 size={14} className="inline animate-spin ml-2" />}
          </label>
          {noSlots && (
            <div className="text-center py-8 bg-[#131c31] rounded-xl border border-[#1a2642] text-slate-400">
              <Calendar size={32} className="mx-auto text-slate-500 mb-2" />
              <p>Nessun orario disponibile per questa data</p>
              <p className="text-xs text-slate-500 mt-1">Prova un altro giorno</p>
            </div>
          )}
          {!noSlots && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slotButtons}
            </div>
          )}
          {loadingSlots && (
            <div className="flex justify-center py-4">
              <Loader2 size={24} className="text-cyan-400 animate-spin" />
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderDetailsStep() {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Nome *</label>
          <input
            type="text"
            value={name}
            onChange={function (e) { setName(e.target.value); }}
            placeholder="Mario Rossi"
            className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Telefono *</label>
          <input
            type="tel"
            value={phone}
            onChange={function (e) { setPhone(e.target.value); }}
            placeholder="+39 3XX XXXXXXX"
            className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            required
          />
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-[#1e2b4a] bg-[#131c31] p-4">
          <input
            id="location-booking-privacy"
            type="checkbox"
            checked={privacyAccepted}
            onChange={(event) => setPrivacyAccepted(event.target.checked)}
            className="mt-1 h-4 w-4 accent-cyan-500"
          />
          <label htmlFor="location-booking-privacy" className="text-xs leading-relaxed text-slate-400">
            Ho letto e accetto la{" "}
            <Link href="/privacy" className="text-cyan-300 underline">
              Privacy Policy
            </Link>{" "}
            per la gestione dell&apos;appuntamento.
          </label>
        </div>
      </div>
    );
  }

  function renderConfirmStep() {
    var dateParts = selectedDate.split("-").reverse();
    var dateStr = dateParts.join(SLASH);
    return (
      <div className="space-y-6">
        <div className="bg-[#131c31] rounded-2xl p-6 border border-[#1a2642]">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-emerald-400" />
            Riepilogo Prenotazione
          </h3>
          <dl className="space-y-3 text-slate-300">
            <div className="grid grid-cols-2 gap-2">
              <dt className="text-slate-500">Servizio</dt>
              <dd className="font-medium text-white">{selectedServiceData ? selectedServiceData.name : ""}</dd>
              <dt className="text-slate-500">Durata</dt>
              <dd className="font-medium text-white">{selectedServiceData ? selectedServiceData.duration + " min" : ""}</dd>
              <dt className="text-slate-500">Prezzo</dt>
              <dd className="font-medium text-white">{selectedServiceData && (selectedServiceData.priceInLocation ?? selectedServiceData.price) ? "€" + (selectedServiceData.priceInLocation ?? selectedServiceData.price) : "Da concordare"}</dd>
              <dt className="text-slate-500">Sede</dt>
              <dd className="font-medium text-white">{location.name}</dd>
              <dt className="text-slate-500">Data</dt>
              <dd className="font-medium text-white">{dateStr}</dd>
              <dt className="text-slate-500">Orario</dt>
              <dd className="font-medium text-white">{selectedTime}</dd>
              <dt className="text-slate-500">Nome</dt>
              <dd className="font-medium text-white">{name}</dd>
              <dt className="text-slate-500">Telefono</dt>
              <dd className="font-medium text-white">{phone}</dd>
            </div>
          </dl>
        </div>

        <div className="flex items-center gap-2 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <AlertCircle size={20} className="text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm">
            Dopo la conferma potrai aprire il link personale per gestire o annullare
            l&apos;appuntamento.
          </p>
        </div>
      </div>
    );
  }

  var canNext = false;
  if (step === "service") { canNext = selectedService !== null; }
  else if (step === "datetime") { canNext = selectedTime !== null; }
  else if (step === "details") {
    canNext = name.trim() !== "" && phone.trim() !== "" && privacyAccepted;
  }

  var nextBtnClass = canNext
    ? "flex-1 px-6 py-3 rounded-xl font-bold transition-all bg-gradient-to-r " + gradient + " text-white hover:from-cyan-400 hover:to-blue-500"
    : "flex-1 px-6 py-3 rounded-xl font-bold transition-all bg-[#1a264a] text-slate-500 cursor-not-allowed";

  return (
    <div className="min-h-screen bg-[#050814]">
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#1a264a] z-50">
        <div
          className={"h-full bg-gradient-to-r " + gradient + " transition-all duration-300"}
          style={{ width: progressPct + "%" }}
        />
      </div>

      <div className="fixed top-4 left-4 right-4 z-40 flex justify-center">
        <div className="flex items-center gap-2 bg-[#0b1221]/90 backdrop-blur rounded-xl border border-[#1a2642] px-4 py-2">
          {renderStepIndicators()}
        </div>
      </div>

      <main className="pt-20 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Link href={"/t/" + tenant.slug + "/sedi"} className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm mb-4">
              <ChevronLeft size={16} /> Cambia Sede
            </Link>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#131c31] rounded-xl border border-[#1e2b4a] mb-4">
              <MapPin size={16} className="text-cyan-400" />
              <span className="font-medium text-white">{location.name}</span>
              {location.isMain && <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">Principale</span>}
            </div>
            <h1 className="text-3xl font-extrabold text-white mt-4 mb-2">{selectedServiceData ? selectedServiceData.name : "Scegli il servizio"}</h1>
            <p className="text-slate-400">
              {location.address || "Indirizzo non definito"}{location.city ? ", " + location.city : ""}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="text-cyan-400 animate-spin" />
            </div>
          )}

          {step === "service" && renderServiceStep()}
          {step === "datetime" && renderDateTimeStep()}
          {step === "details" && renderDetailsStep()}
          {step === "confirm" && renderConfirmStep()}

          <div className="flex gap-3 pt-4 border-t border-[#1a264a]">
            {step !== "service" && (
              <button
                onClick={handlePrev}
                className="flex-1 px-6 py-3 bg-[#131c31] hover:bg-[#1a264a] text-slate-300 font-medium rounded-xl transition-colors"
              >
                <ChevronLeft size={18} className="inline mr-1" /> Indietro
              </button>
            )}
            {step !== "confirm" && (
              <button
                onClick={handleNext}
                disabled={!canNext}
                className={nextBtnClass}
              >
                Avanti <ChevronRight size={18} className="inline ml-1" />
              </button>
            )}
            {step === "confirm" && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={20} className="mx-auto animate-spin" /> : "Conferma Prenotazione"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
