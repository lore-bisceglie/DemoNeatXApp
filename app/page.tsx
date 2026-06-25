"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WaitlistButton from "./WaitlistButton";

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

export default function Home() {
  const today = new Date().toISOString().split("T")[0];

  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 60);
  const maxDate = maxDateObj.toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  const [formError, setFormError] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [demoModal, setDemoModal] = useState({ show: false, date: "", time: "", serviceName: "" });
  const [showCancelBanner, setShowCancelBanner] = useState(false);
  const [honey, setHoney] = useState("");
  const [isHoliday, setIsHoliday] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // ✅ NUOVO STATO PER L'EASTER EGG DELL'IMMAGINE
  const [logoClicked, setLogoClicked] = useState(false);
  
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [tenantInfo] = useState({
    id: "cmqtds1840000yyqbd23x1jdj",
    name: "Appuntamenti Demo NeatX",
    address: "📍 Indirizzo del Salone (Città)",
    phone: "390000000000",
    instagramUrl: "https://www.instagram.com",
    mapsLink: "https://maps.app.goo.gl/W9vbcGsr3ZfgdTPy5",
    isDemo: true,
  });

  // ✅ FUNZIONE CHE FA PARTIRE L'ANIMAZIONE QUANDO TOCCHI LA FOTO
  const handleLogoClick = () => {
    if (logoClicked) return; // Evita che l'utente clicchi 100 volte di fila
    setLogoClicked(true);
    
    // Fa vibrare leggermente il telefono se supportato (Haptic Feedback)
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    // Spegne l'animazione dopo 2 secondi
    setTimeout(() => setLogoClicked(false), 2000);
  };

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("canceled=true")
    ) {
      setShowCancelBanner(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    fetch(`/api/services?tenantId=${tenantInfo.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.services && data.services.length > 0) {
          setServices(data.services);
          setSelectedService(data.services[0]);
        } else {
          setInitialLoad(false);
          setDateError("Nessun servizio configurato per questo salone.");
        }
      })
      .catch((err) => {
        console.error("Errore servizi:", err);
        setInitialLoad(false);
      });
  }, [tenantInfo.id]);

  useEffect(() => {
    if (!date || !selectedService) return;

    const d = new Date(date);
    const day = d.getDay();

    const month = String(d.getMonth() + 1).padStart(2, "0");
    const dayOfMonth = String(d.getDate()).padStart(2, "0");
    const giornoMese = `${dayOfMonth}-${month}`;

    const festeNazionali = [
      "01-01",
      "06-01",
      "25-04",
      "01-05",
      "02-06",
      "15-08",
      "01-11",
      "08-12",
      "25-12",
      "26-12",
    ];

    if (date > maxDate) {
      setDateError("Puoi prenotare con un massimo di 60 giorni di anticipo.");
      setSlots([]);
      setIsHoliday(false);
      return;
    }

    if (date < today) {
      setDateError("Non puoi prenotare in una data passata.");
      setSlots([]);
      setIsHoliday(false);
      return;
    }

    if (day === 0 || day === 1) {
      setDateError("La domenica e il lunedì sono chiuso! Scegli un altro giorno.");
      setSlots([]);
      setIsHoliday(false);
      return;
    }

    if (festeNazionali.includes(giornoMese)) {
      setDateError("Il salone è chiuso in questa data per festività nazionale!");
      setSlots([]);
      setIsHoliday(false);
      return;
    }

    setDateError("");
    setLoading(true);

    fetch(
      `/api/availability?date=${date}&tenantId=${tenantInfo.id}&duration=${selectedService.duration}`
    )
      .then((res) => res.json())
      .then((data) => {
        let fetchedSlots = data.slots || [];

        const now = new Date();
        const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .split("T")[0];

        if (date === localToday) {
          const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

          fetchedSlots = fetchedSlots.filter((slot: string) => {
            const [hours, minutes] = slot.split(":").map(Number);
            const slotTotalMinutes = hours * 60 + minutes;
            return slotTotalMinutes >= currentTotalMinutes + 30;
          });
        }

        setSlots(fetchedSlots);
        setIsHoliday(data.isHoliday || false);
        setSelectedSlot("");
        setLoading(false);
        setInitialLoad(false);
      })
      .catch((error) => {
        console.error("Errore:", error);
        setSlots([]);
        setIsHoliday(false);
        setLoading(false);
        setInitialLoad(false);
      });
  }, [date, maxDate, selectedService, tenantInfo.id, today]);

  const handleFirstAvailable = () => {
    if (slots.length > 0) {
      setSelectedSlot(slots[0]);
      setFormError("");
    } else {
      setFormError("Nessun posto disponibile in questa data.");
    }
  };

  const isScarce = slots.length > 0 && slots.length <= 5;

  const handleBook = async () => {
    setFormError("");

    if (!name || !phone || !selectedSlot || !selectedService) {
      setFormError(
        "Per favore, seleziona un servizio, un orario e inserisci Nome e Telefono."
      );
      return;
    }

    if (!tenantInfo.isDemo && phone !== "0000") {
      const cifre = phone.replace(/\D/g, "");
      let isValid = false;

      if (cifre.length === 10) isValid = true;
      else if (cifre.length === 12 && cifre.startsWith("39")) isValid = true;
      else if (cifre.length === 14 && cifre.startsWith("0039")) isValid = true;

      if (!isValid) {
        setFormError(
          "Il numero non è valido. Un cellulare italiano deve avere 10 cifre. Riprova!"
        );
        return;
      }
    }

    if (dateError || isHoliday) return;

    setIsBooking(true);

    // 🛡️ MODIFICA DEMO: Se è una demo, bypassiamo l'API vera e propria!
    // Simuliamo il caricamento per permettere l'inserimento di lettere a caso.
    if (tenantInfo.isDemo) {
      setTimeout(() => {
        setDemoModal({ show: true, date, time: selectedSlot, serviceName: selectedService.name });
        setName("");
        setPhone("");
        setSelectedSlot("");
        setDate(today);
        setSlots([]);
        setHoney("");
        setIsBooking(false);
      }, 800);
      return;
    }

    const res = await fetch("/api/book", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerName: name,
        customerPhone: phone,
        date,
        time: selectedSlot,
        honey,
        tenantId: tenantInfo.id,
        serviceId: selectedService.id,
        duration: selectedService.duration,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const cancelToken = data.cancelToken;

      if (tenantInfo.isDemo) {
        setDemoModal({ show: true, date, time: selectedSlot, serviceName: selectedService.name });
        setName("");
        setPhone("");
        setSelectedSlot("");
        setDate(today);
        setSlots([]);
        setHoney("");
        setIsBooking(false);
        return;
      }

      if (phone === "0000") {
        router.push("/dashboard");
        return;
      }

      const [year, month, day] = date.split("-");
      const italianDate = `${day}/${month}/${year}`;
      const cleanPhone = phone.replace(/\D/g, "");
      const shopPhone = tenantInfo.phone;

      const baseUrl =
        window.location.hostname === "localhost"
          ? "http://localhost:3000"
          : window.location.origin;

      const cancelUrl = `${baseUrl}/cancel/${cancelToken}`;

      const text = encodeURIComponent(
        `✨ *Nuova Prenotazione!*\n\n` +
          `👤 *Cliente:* ${name}\n` +
          `📞 *Telefono:* ${cleanPhone}\n` +
          `📅 *Data:* ${italianDate}\n` +
          `⏰ *Ora:* ${selectedSlot}\n` +
          `💆‍♀️ *Servizio:* ${selectedService.name} (${selectedService.price}€)\n\n` +
          `❌ *Per annullare in autonomia:*\n` +
          `Puoi usare questo link fino a 2 ore prima:\n${cancelUrl}\n\n` +
          `_Prenotazione gestita tramite Demo NeatX._ 🚀`
      );

      const whatsappUrl = `https://wa.me/${shopPhone}?text=${text}`;
      const link = document.createElement("a");
      link.href = whatsappUrl;
      link.target = "_top";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setName("");
      setPhone("");
      setSelectedSlot("");
      setDate(today);
      setSlots([]);
      setHoney("");
      setIsBooking(false);
    } else if (res.status === 429) {
      setFormError("Troppi tentativi ravvicinati! Attendi un paio di minuti e riprova.");
      setIsBooking(false);
    } else {
      setFormError("Si è verificato un errore di connessione, riprova!");
      setIsBooking(false);
    }
  };

  const isButtonDisabled =
    isBooking || selectedSlot === "" || name === "" || phone === "";

  const isSelectedLastMinute = isScarce && selectedSlot !== "";

  // ✅ Messaggio dinamico quando non ci sono orari disponibili
  // Modifica qui l'orario di chiusura del salone, se necessario.
  const closingHour = 19;
  const closingMinute = 0;

  const nowForMessage = new Date();
  const localTodayForMessage = new Date(
    nowForMessage.getTime() - nowForMessage.getTimezoneOffset() * 60000
  )
    .toISOString()
    .split("T")[0];

  const currentTotalMinutesForMessage =
    nowForMessage.getHours() * 60 + nowForMessage.getMinutes();
  const closingTotalMinutes = closingHour * 60 + closingMinute;

  const isTodaySelected = date === localTodayForMessage;
  const isSalonClosedNow =
    isTodaySelected && currentTotalMinutesForMessage >= closingTotalMinutes;

  const noSlotsMessage = isSalonClosedNow
    ? {
        icon: "🌙",
        badge: "SALONE CHIUSO",
        badgeClass:
          "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20",
        title: "Abbiamo terminato la giornata lavorativa.",
        text: "Seleziona una nuova data sul calendario per trovare il momento perfetto per il tuo relax.",
      }
    : {
        icon: "📅",
        badge: "TUTTO PRENOTATO",
        badgeClass:
          "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
        title: "Nessun orario disponibile per questa data.",
        text: "La giornata è al completo o non c'è abbastanza tempo per il servizio selezionato. Prova a scegliere un altro giorno.",
      };

  if (initialLoad) {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center font-sans">
        <div className="relative flex justify-center items-center mb-6">
          <div className="absolute w-20 h-20 border-4 border-[#1a2642] border-t-[#00b4ff] rounded-full animate-spin"></div>
          <span className="text-2xl mt-1">🚀</span>
        </div>

        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Neat<span className="text-[#00b4ff]">X</span> Demo
        </h2>

        <p className="text-slate-500 text-sm mt-3 font-medium animate-pulse">
          Sincronizzazione agenda in corso...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col items-center py-10 px-4 font-sans text-slate-200 selection:bg-cyan-500/30 relative overflow-hidden animate-in fade-in duration-500">
      {demoModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
          <div className="bg-[#0b1221] border border-[#00b4ff]/30 p-8 rounded-3xl shadow-2xl shadow-cyan-900/20 max-w-sm w-full text-center transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Prenotazione Demo Salvata</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Hai prenotato <strong>{demoModal.serviceName}</strong> per il <strong>{demoModal.date.split("-").reverse().join("/")}</strong> alle <strong>{demoModal.time}</strong>.<br /><br />
              La prenotazione è stata salvata nel database DemoNeatX ed è visibile in Dashboard.
            </p>
            <button 
              onClick={() => setDemoModal({ show: false, date: "", time: "", serviceName: "" })}
              className="w-full bg-[#131c31] hover:bg-[#1a2642] text-white border border-[#1e2b4a] hover:border-[#00b4ff]/50 font-bold py-3 rounded-xl transition shadow-lg"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00b4ff] opacity-[0.04] blur-[120px] pointer-events-none rounded-full"></div>

      <div className="bg-[#0b1221] max-w-md w-full rounded-3xl shadow-2xl shadow-cyan-900/10 border border-[#1a2642] p-6 sm:p-8 relative z-10">
        {tenantInfo.isDemo && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs text-center p-2 rounded-xl font-semibold uppercase tracking-wide">
            ⚠️ Ambiente Demo - Dati fittizi accettati
          </div>
        )}

        {showCancelBanner && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-center animate-in fade-in zoom-in duration-300">
            <span className="block text-2xl mb-1">✅</span>
            <span className="font-bold block text-sm">Appuntamento annullato</span>
            <span className="text-xs text-emerald-200">
              Il tuo slot è stato liberato con successo.
            </span>
          </div>
        )}

        <div className="text-center mb-8">
          
          {/* ✅ LA MAGIA DELLA FOTO CHE GIRA */}
          <div className="flex flex-col items-center justify-center mb-10 relative">
            <div
              onClick={handleLogoClick}
              className={`relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#00b4ff] to-purple-600 cursor-pointer transition-all duration-1000 z-20 ${
                logoClicked
                  ? "rotate-[360deg] scale-110 shadow-[0_0_30px_rgba(0,180,255,0.4)]"
                  : "shadow-lg shadow-cyan-500/20 hover:scale-105"
              }`}
            >
              <img
                src="/apple-icon.png"
                alt="Logo Demo NeatX"
                className="w-full h-full object-cover rounded-full border-4 border-[#0b1221]"
              />
            </div>

            {/* Messaggio fluttuante Easter Egg */}
            {logoClicked && (
              <div className="absolute -bottom-8 text-sm font-bold text-[#00b4ff] animate-in fade-in slide-in-from-top-2 zoom-in duration-500 z-10 whitespace-nowrap">
                Animazione da Demo! 🚀
              </div>
            )}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex justify-center items-center gap-3 flex-wrap">
            <span className="text-slate-100">{tenantInfo.name}</span>
          </h1>

          <p className="text-slate-400 text-[13px] font-medium mb-6">
            Prova la prenotazione online con dati fittizi.
          </p>

          <div className="mb-6 flex flex-col items-center justify-center gap-4 transition-all duration-500">
            <a
              href={tenantInfo.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50 underline-offset-4 transition-colors text-sm flex items-center justify-center gap-1 animate-in fade-in duration-300"
            >
              {tenantInfo.address}
            </a>

            <a
              href={tenantInfo.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:from-orange-300 hover:via-pink-400 hover:to-purple-500 text-white px-7 py-3 rounded-full text-sm font-extrabold shadow-lg shadow-pink-500/30 transition transform hover:scale-105"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              Seguici su Instagram
            </a>
          </div>
        </div>

        {services.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-bold mb-2 text-slate-300">
              Scegli il servizio
            </label>

            <select
              value={selectedService?.id || ""}
              onChange={(e) => {
                const s = services.find((srv) => srv.id === e.target.value);
                setSelectedService(s || null);
                setSlots([]);
                setSelectedSlot("");
                setFormError("");
              }}
              className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition appearance-none cursor-pointer"
            >
              {services.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name} ({srv.duration} min) - {srv.price ? `${srv.price}€` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-bold mb-2 text-slate-300">
            Scegli il giorno
          </label>

          <input
            type="date"
            value={date}
            min={today}
            max={maxDate}
            onChange={(e) => {
              setDate(e.target.value);
              setFormError("");
            }}
            className={`w-full bg-[#131c31] border ${
              dateError ? "border-red-500" : "border-[#1e2b4a]"
            } text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition`}
            style={{ colorScheme: "dark" }}
          />

          {dateError && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in">
              <span>[!]</span> {dateError}
            </div>
          )}
        </div>

        {isHoliday ? (
          <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 p-6 rounded-2xl text-center shadow-inner animate-in fade-in zoom-in duration-300">
            <span className="text-4xl mb-2 block">🏖️</span>
            <h3 className="font-extrabold text-lg mb-1 text-white">Siamo in Ferie!</h3>
            <p className="text-sm font-medium">
              Il salone è chiuso in questa data. Per favore, seleziona un altro giorno dal calendario.
            </p>
          </div>
        ) : dateError !== "" ? null : loading ? (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm font-medium animate-pulse">
              Calcolo incastri perfetti in corso...
            </p>
          </div>
        ) : slots.length === 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 mt-8">
            <div className="mb-4 text-center">
              <span className="text-4xl mb-3 block">{noSlotsMessage.icon}</span>

              <span
                className={`inline-block ${noSlotsMessage.badgeClass} px-3 py-1 rounded-full text-xs font-bold mb-3 tracking-widest`}
              >
                {noSlotsMessage.badge}
              </span>

              <h3 className="font-extrabold text-lg mb-1 text-white">
                {noSlotsMessage.title}
              </h3>

              <p className="text-slate-300 text-sm font-medium">
                {noSlotsMessage.text}
              </p>
            </div>

            <WaitlistButton selectedDate={date} selectedService={selectedService} tenantId={tenantInfo.id} />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {isScarce && (
              <div className="mb-5 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-[0_0_15px_rgba(249,115,22,0.15)] animate-in zoom-in duration-300">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>

                  <span className="text-red-400 text-[11px] font-black tracking-widest uppercase">
                    Giornata quasi piena
                  </span>
                </div>

                <span className="text-orange-100 text-xs font-medium text-center sm:text-right">
                  Solo{" "}
                  <b className="text-white text-base bg-red-500/20 px-2 py-0.5 rounded-md border border-red-500/30">
                    {slots.length}
                  </b>{" "}
                  {slots.length === 1 ? "incastro rimasto" : "incastri rimasti"}!
                </span>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-bold mb-2 text-slate-300">
                Orari disponibili
              </label>

              <div className="space-y-2">
                <select
                  value={selectedSlot}
                  onChange={(e) => {
                    setSelectedSlot(e.target.value);
                    setFormError("");
                  }}
                  className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition appearance-none cursor-pointer"
                >
                  <option value="">-- Seleziona un orario --</option>
                  {slots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot} {isScarce ? "🔥 (In esaurimento)" : ""}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleFirstAvailable}
                  className="w-full text-xs font-semibold text-[#00b4ff] hover:text-cyan-400 transition"
                >
                  [+] Primo disponibile
                </button>
              </div>
            </div>

            <div className="mb-6 space-y-3">
              <input
                type="text"
                placeholder="Il tuo nome"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFormError("");
                }}
                className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 placeholder-slate-500 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition"
              />

              <input
                type="tel"
                placeholder="Il tuo numero (WhatsApp)"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setFormError("");
                }}
                className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 placeholder-slate-500 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition"
              />

              <input
                type="text"
                value={honey}
                onChange={(e) => setHoney(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {formError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-start gap-3 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                <span className="text-lg leading-none mt-0.5">⚠️</span>
                <p className="text-sm font-medium">{formError}</p>
              </div>
            )}

            <button
              onClick={handleBook}
              disabled={isButtonDisabled}
              className={`w-full font-bold py-3 rounded-xl transition shadow-lg ${
                isButtonDisabled
                  ? "bg-[#131c31] text-slate-500 cursor-not-allowed shadow-none border border-[#1e2b4a]"
                  : isSelectedLastMinute
                  ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white shadow-red-500/30"
                  : "bg-[#00b4ff] hover:bg-cyan-400 text-[#050814] shadow-cyan-500/20"
              }`}
            >
              {isBooking
                ? "⏳ Elaborazione..."
                : isSelectedLastMinute
                ? "🔥 Prenota Subito!"
                : "✓ Prenota Ora"}
            </button>

            <p className="text-[10px] text-slate-500 mt-5 text-center mb-8">
              Verrai reindirizzato a WhatsApp per confermare.
            </p>

            <div className="pt-6 border-t border-[#1e2b4a]">
              <WaitlistButton selectedDate={date} selectedService={selectedService} tenantId={tenantInfo.id} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#0b1221] max-w-md w-full rounded-3xl shadow-xl shadow-cyan-900/5 border border-[#1a2642] p-5 mt-6 text-center flex flex-col items-center gap-4 relative z-10">
        <div className="text-[10px] text-slate-400 tracking-wide leading-relaxed flex flex-col items-center gap-3">
          <p>
            Powered by{" "}
            <span className="font-bold text-slate-300">Neat</span><span className="font-bold text-[#00b4ff]">X</span>
            <br />
            Developed by{" "}
            <span className="text-[#00b4ff]/90 font-semibold">
              Bisceglie Lorenzo
            </span>
          </p>
          <Link 
            href="/dashboard"
            className="mt-1 inline-flex items-center justify-center gap-2 px-5 py-2 bg-[#131c31] hover:bg-[#1a2642] text-slate-300 hover:text-white border border-[#1e2b4a] hover:border-[#00b4ff]/50 rounded-xl transition-all font-bold uppercase tracking-widest shadow-lg shadow-black/20"
          >
            ⚙️ Dashboard
          </Link>
        </div>

        <div className="flex gap-4 text-[9px] font-medium uppercase tracking-widest mt-1">
          <a
            href="https://www.instagram.com/lorebisceglie?igsh=cTIzeG15aXEzZ2Ey&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-[#E1306C] transition"
          >
            Instagram
          </a>

          <span className="text-slate-700">•</span>

          <a
            href="https://wa.me/393480480942?text=Ciao%20Lorenzo!%20Ho%20visto%20la%20tua%20app%20NeatX%20e%20vorrei%20informazioni."
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-[#25D366] transition"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}