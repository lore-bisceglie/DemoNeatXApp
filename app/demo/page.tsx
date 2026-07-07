"use client";

import { useState, useEffect, useMemo, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WaitlistButton from "../WaitlistButton";

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

const activityProfiles = [
  {
    id: "all",
    icon: "🚀",
    label: "Tutte",
    headline: "Demo NeatX Multi-Attività",
    description:
      "Prova la stessa agenda su barbieri, beauty, nails, massaggi, tattoo, studi e consulenze.",
    matchWords: [] as string[],
    demoName: "Cliente Vetrina",
    demoPhone: "3394455667",
  },
  {
    id: "barber",
    icon: "💈",
    label: "Barbiere",
    headline: "Demo NeatX Barbiere",
    description:
      "Tagli rapidi, servizi da 30 minuti, agenda piena e gestione pagamento.",
    matchWords: ["Barbiere"],
    demoName: "Marco Taglio",
    demoPhone: "3451112233",
  },
  {
    id: "beauty",
    icon: "✨",
    label: "Beauty",
    headline: "Demo NeatX Beauty",
    description:
      "Trattamenti viso, appuntamenti più lunghi, lista d'attesa e promemoria.",
    matchWords: ["Beauty", "Massaggi"],
    demoName: "Giulia Beauty",
    demoPhone: "3331234567",
  },
  {
    id: "nails",
    icon: "💅",
    label: "Nails",
    headline: "Demo NeatX Nails",
    description:
      "Servizi ricorrenti, clienti abituali e calendario ordinato per ogni slot.",
    matchWords: ["Nails"],
    demoName: "Sara Nails",
    demoPhone: "3471122334",
  },
  {
    id: "tattoo",
    icon: "🎨",
    label: "Tattoo",
    headline: "Demo NeatX Tattoo",
    description:
      "Consulenze, acconti demo e cancellazione autonoma con link personale.",
    matchWords: ["Tattoo"],
    demoName: "Luca Ink",
    demoPhone: "3497788990",
  },
  {
    id: "studio",
    icon: "🗓️",
    label: "Studio",
    headline: "Demo NeatX Studio",
    description:
      "Consulenze private, appuntamenti ordinati e storico clienti sempre visibile.",
    matchWords: ["Studio privato", "Fisioterapia"],
    demoName: "Andrea Studio",
    demoPhone: "3465557788",
  },
];

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
  const [demoModal, setDemoModal] = useState({
    show: false,
    date: "",
    time: "",
    serviceName: "",
    paymentLabel: "",
    customerName: "",
    customerPhone: "",
    cancelPath: "",
    price: 0,
  });
  const [showCancelBanner, setShowCancelBanner] = useState(false);
  const [honey, setHoney] = useState("");
  const [isHoliday, setIsHoliday] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // ✅ NUOVO STATO PER L'EASTER EGG DELL'IMMAGINE
  const [logoClicked, setLogoClicked] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"salon" | "online">("salon");
  const [selectedActivityId, setSelectedActivityId] = useState("all");
  const [showActivityModal, setShowActivityModal] = useState(true);
  
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [tenantInfo] = useState({
    id: "cmqtds1840000yyqbd23x1jdj",
    name: "Demo NeatX Multi-Attivita",
    address:
      "Agenda demo per barbieri, beauty, nails, massaggi, tattoo, studi e consulenze",
    phone: "393480480942",
    instagramUrl:
      "https://www.instagram.com/",
    isDemo: true,
  });

  const activeProfile =
    activityProfiles.find((profile) => profile.id === selectedActivityId) ||
    activityProfiles[0];

  const visibleServices = useMemo(() => {
    if (!activeProfile.matchWords.length) return services;

    const filtered = services.filter((service) =>
      activeProfile.matchWords.some((word) =>
        service.name.toLowerCase().includes(word.toLowerCase())
      )
    );

    return filtered.length > 0 ? filtered : services;
  }, [activeProfile, services]);

  const demoCustomers = [
    { name: "Giulia Demo", phone: "3331234567" },
    { name: "Marco Test", phone: "3459876543" },
    { name: "Sara Prova", phone: "3471122334" },
    { name: "Cliente Vetrina", phone: "3394455667" },
  ];

  const chooseActivity = (profileId: string) => {
    const nextProfile =
      activityProfiles.find((profile) => profile.id === profileId) ||
      activityProfiles[0];

    const matchingServices = nextProfile.matchWords.length
      ? services.filter((service) =>
          nextProfile.matchWords.some((word) =>
            service.name.toLowerCase().includes(word.toLowerCase())
          )
        )
      : services;

    setSelectedActivityId(profileId);

    const nextService = matchingServices[0] || services[0] || null;
    if (nextService) {
      setSelectedService(nextService);
      setSlots([]);
      setSelectedSlot("");
    }

    setFormError("");
    setShowActivityModal(false);
  };

  const fillDemoCustomer = () => {
    if (activeProfile.id !== "all") {
      setName(activeProfile.demoName);
      setPhone(activeProfile.demoPhone);
      setFormError("");
      return;
    }

    const randomCustomer =
      demoCustomers[Math.floor(Math.random() * demoCustomers.length)];
    setName(randomCustomer.name);
    setPhone(randomCustomer.phone);
    setFormError("");
  };

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
          setDateError("Nessun servizio configurato per questa demo.");
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
  setInitialLoad(false);
  return;
}

    if (date < today) {
  setDateError("Non puoi prenotare in una data passata.");
  setSlots([]);
  setIsHoliday(false);
  setInitialLoad(false);
  return;
}

    if (day === 0 || day === 1) {
  setDateError("La domenica e il lunedì sono chiuso! Scegli un altro giorno.");
  setSlots([]);
  setIsHoliday(false);
  setInitialLoad(false);
  return;
}

    if (festeNazionali.includes(giornoMese)) {
  setDateError("Il salone è chiuso in questa data per festività nazionale!");
  setSlots([]);
  setIsHoliday(false);
  setInitialLoad(false);
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

  const isSaturday = date ? new Date(date).getDay() === 6 : false;
  const isScarce = slots.length > 0 && slots.length <= 5;
  const isVeryScarce = slots.length > 0 && slots.length <= 2;
  const shownSlots = slots.slice(0, 3).join(", ");
  const slotSummary =
    slots.length > 3 ? `${shownSlots} e altri ${slots.length - 3}` : shownSlots;
  const demandMode = isVeryScarce
    ? {
        title: "Ultimi incastri disponibili",
        message:
          slots.length === 1
            ? `E rimasto solo l'orario delle ${slots[0]}.`
            : `Sono rimasti solo questi orari: ${slotSummary}.`,
        tone: "red" as const,
      }
    : isSaturday
    ? {
        title: isScarce ? "Sabato quasi pieno" : "Sabato molto richiesto",
        message: isScarce
          ? `Per sabato rimangono ${slots.length} incastri: ${slotSummary}.`
          : "Il sabato si riempie prima: nella demo vedi come spingere il cliente a scegliere subito.",
        tone: "cyan" as const,
      }
    : isScarce
    ? {
        title: "Giornata quasi piena",
        message: `Sono rimasti ${slots.length} incastri: ${slotSummary}.`,
        tone: "orange" as const,
      }
    : null;
  const demandClass =
    demandMode?.tone === "cyan"
      ? "from-cyan-500/10 to-blue-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(0,180,255,0.15)]"
      : demandMode?.tone === "red"
      ? "from-red-500/10 to-orange-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
      : "from-orange-500/10 to-red-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]";
  const demandAccent =
    demandMode?.tone === "cyan" ? "text-cyan-300" : "text-red-400";

  const handleBook = async () => {
    setFormError("");

    if (!name || !selectedSlot || !selectedService || (!tenantInfo.isDemo && !phone)) {
      setFormError(
        tenantInfo.isDemo
          ? "Per favore, seleziona un servizio, un orario e inserisci un nome demo."
          : "Per favore, seleziona un servizio, un orario e inserisci Nome e Telefono."
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

    const res = await fetch("/api/book", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerName: name,
        customerPhone: tenantInfo.isDemo && !phone ? "3330000000" : phone,
        date,
        time: selectedSlot,
        honey,
        tenantId: tenantInfo.id,
        serviceId: selectedService.id,
        duration: selectedService.duration,
        paymentMethod,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const cancelToken = data.cancelToken;

      if (tenantInfo.isDemo) {
        setDemoModal({
          show: true,
          date,
          time: selectedSlot,
          serviceName: selectedService.name,
          paymentLabel:
            paymentMethod === "online"
              ? "Pagamento online simulato"
              : "Pagamento in sede",
          customerName: name,
          customerPhone: tenantInfo.isDemo && !phone ? "3330000000" : phone,
          cancelPath: `/cancel/${cancelToken}`,
          price: selectedService.price || 0,
        });
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
    isBooking ||
    selectedSlot === "" ||
    name === "" ||
    (!tenantInfo.isDemo && phone === "");

  const isSelectedLastMinute = isScarce && selectedSlot !== "";

  // ✅ Messaggio dinamico quando non ci sono orari disponibili
  // Modifica qui l'orario di chiusura dell'attivita, se necessario.
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
    : isSaturday
    ? {
        icon: "📅",
        badge: "SABATO COMPLETO",
        badgeClass:
          "bg-red-500/10 text-red-300 border border-red-500/20",
        title: "Il sabato della demo e gia pieno.",
        text: "Questo mostra come NeatX comunica i giorni piu richiesti e spinge il cliente a scegliere un nuovo orario o la lista d'attesa.",
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
      <Link href="/" className="fixed top-4 left-4 z-40 bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 border border-slate-700/50 shadow-lg transition-all">
        <span className="text-lg">🏠</span> Home
      </Link>
      {tenantInfo.isDemo && showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b1221] border border-[#00b4ff]/30 p-6 rounded-3xl shadow-2xl shadow-cyan-900/20 max-w-lg w-full text-center animate-in fade-in zoom-in duration-200">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-xl font-extrabold text-white mb-2">
              Scegli che demo vuoi provare
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              Ogni profilo filtra i servizi e prepara dati finti coerenti con
              quell'attività. Puoi cambiare scelta anche dopo.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
              {activityProfiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => chooseActivity(profile.id)}
                  className="bg-[#131c31] hover:bg-[#1a2642] border border-[#1e2b4a] hover:border-[#00b4ff]/60 rounded-2xl px-3 py-3 text-left transition"
                >
                  <span className="block text-2xl mb-2">{profile.icon}</span>
                  <span className="block text-sm font-extrabold text-white">
                    {profile.label}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-1 leading-snug">
                    {profile.description}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowActivityModal(false)}
              className="text-xs font-bold text-slate-400 hover:text-white underline underline-offset-4"
            >
              Entra senza scegliere
            </button>
          </div>
        </div>
      )}

      {demoModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
          <div className="bg-[#0b1221] border border-[#00b4ff]/30 p-6 rounded-3xl shadow-2xl shadow-cyan-900/20 max-w-md w-full text-center transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Prenotazione Demo Salvata</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Hai prenotato <strong>{demoModal.serviceName}</strong> per il <strong>{demoModal.date.split("-").reverse().join("/")}</strong> alle <strong>{demoModal.time}</strong>.<br /><br />
              Metodo: <strong>{demoModal.paymentLabel}</strong>.
            </p>

            <div className="mb-4 rounded-2xl border border-emerald-500/25 bg-emerald-950/30 p-4 text-left">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-300">
                  Anteprima WhatsApp
                </p>
                <span className="text-[10px] text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                  simulata
                </span>
              </div>
              <div className="bg-[#075e54] rounded-2xl p-3 text-white text-[12px] leading-relaxed shadow-lg">
                <p className="font-bold mb-2">✨ Nuova Prenotazione!</p>
                <p>👤 Cliente: {demoModal.customerName}</p>
                <p>📞 Telefono: {demoModal.customerPhone || "3330000000"}</p>
                <p>📅 Data: {demoModal.date.split("-").reverse().join("/")}</p>
                <p>⏰ Ora: {demoModal.time}</p>
                <p>💼 Servizio: {demoModal.serviceName}</p>
                <p className="mt-2">
                  ❌ Link annullo: {demoModal.cancelPath}
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-[#1e2b4a] bg-[#131c31] p-4 text-left">
              <p className="text-xs font-extrabold text-white mb-1">
                {demoModal.paymentLabel.includes("online")
                  ? "Pagamento demo completato"
                  : "Pagamento segnato in sede"}
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {demoModal.paymentLabel.includes("online")
                  ? `Nella dashboard lo vedrai gia come pagato: ${demoModal.price} EUR simulati, senza addebiti reali.`
                  : "Nella dashboard il titolare potra segnarlo pagato con un tocco."}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard"
                className="w-full bg-[#00b4ff] hover:bg-cyan-400 text-[#050814] font-bold py-3 rounded-xl transition shadow-lg"
              >
                Vedi in dashboard
              </Link>
              <button 
                onClick={() =>
                  setDemoModal({
                    show: false,
                    date: "",
                    time: "",
                    serviceName: "",
                    paymentLabel: "",
                    customerName: "",
                    customerPhone: "",
                    cancelPath: "",
                    price: 0,
                  })
                }
                className="w-full bg-[#131c31] hover:bg-[#1a2642] text-white border border-[#1e2b4a] hover:border-[#00b4ff]/50 font-bold py-3 rounded-xl transition shadow-lg"
              >
                Resta qui
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00b4ff] opacity-[0.04] blur-[120px] pointer-events-none rounded-full"></div>

      <div className="bg-[#0b1221] max-w-md w-full rounded-3xl shadow-2xl shadow-cyan-900/10 border border-[#1a2642] p-6 sm:p-8 relative z-10">
        {tenantInfo.isDemo && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-xs p-3 rounded-xl font-semibold leading-relaxed">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-center sm:text-left">
                Ambiente demo: usa nomi e numeri finti. Ogni prenotazione si
                salva nella dashboard titolare.
              </p>
              <Link
                href="/dashboard"
                className="shrink-0 bg-yellow-300 text-[#050814] hover:bg-yellow-200 px-3 py-2 rounded-lg font-extrabold text-center"
              >
                Apri dashboard
              </Link>
            </div>
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
          
          <div className="flex flex-col items-center justify-center mb-10 relative">
            <style>{`
              @keyframes demoHaloSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }

              @keyframes demoSoftPulse {
                0%, 100% { opacity: .35; transform: scale(.96); }
                50% { opacity: .72; transform: scale(1.06); }
              }

              @keyframes demoSweep {
                0% { transform: translateX(-140%) rotate(22deg); opacity: 0; }
                35% { opacity: .85; }
                100% { transform: translateX(140%) rotate(22deg); opacity: 0; }
              }

              @keyframes demoSpark {
                0% { opacity: 0; transform: translate3d(0, 0, 0) scale(.4); }
                22% { opacity: 1; }
                100% { opacity: 0; transform: translate3d(var(--spark-x), var(--spark-y), 0) scale(1.15); }
              }
            `}</style>

            <button
              type="button"
              onClick={handleLogoClick}
              aria-label="Attiva effetto logo demo NeatX"
              className="group relative w-32 h-32 rounded-full flex items-center justify-center cursor-pointer focus:outline-none"
              style={{
                transition: "transform 1000ms cubic-bezier(0.16, 1, 0.3, 1)",
                transform: logoClicked
                  ? "rotate(360deg) scale(1.06)"
                  : "rotate(0deg) scale(1)",
                zIndex: 51,
              }}
            >
              <span
                className="absolute inset-0 rounded-full blur-xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(0,180,255,.5), rgba(236,72,153,.18) 42%, transparent 72%)",
                  animation: logoClicked
                    ? "demoSoftPulse .7s ease-in-out infinite"
                    : "demoSoftPulse 3.2s ease-in-out infinite",
                }}
              />

              <span
                className="absolute inset-3 rounded-full"
                style={{
                  background:
                    "conic-gradient(from 90deg, rgba(0,180,255,.05), rgba(0,180,255,1), rgba(255,255,255,.9), rgba(236,72,153,.95), rgba(0,180,255,.05))",
                  filter: "drop-shadow(0 0 12px rgba(0,180,255,.6))",
                  animation: logoClicked
                    ? "demoHaloSpin .75s linear infinite"
                    : "demoHaloSpin 7s linear infinite",
                }}
              />

              <span className="absolute inset-[18px] rounded-full bg-[#050814]" />

              <span
                className="absolute inset-[14px] rounded-full opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,180,255,.45), transparent 38%, rgba(236,72,153,.35) 70%, rgba(255,255,255,.28))",
                  filter: "blur(5px)",
                }}
              />

              <span className="relative w-24 h-24 rounded-full p-1 bg-[#0b1221] shadow-[0_20px_42px_rgba(0,180,255,.26)] overflow-hidden">
                <img
                  src="/apple-icon.png"
                  alt="Logo Demo NeatX"
                  className="w-full h-full object-cover rounded-full border-4 border-[#0b1221]"
                />

                <span
                  className={`absolute inset-y-[-20%] left-0 w-10 bg-white/35 blur-sm ${
                    logoClicked ? "block" : "hidden"
                  }`}
                  style={{ animation: "demoSweep .9s ease-out both" }}
                />
              </span>

              {logoClicked && (
                <>
                  {[
                    ["left-5 top-8", "-22px", "-18px", "bg-cyan-200"],
                    ["right-6 top-9", "24px", "-16px", "bg-pink-200"],
                    ["bottom-7 left-8", "-18px", "22px", "bg-white"],
                    ["bottom-8 right-7", "20px", "18px", "bg-cyan-100"],
                  ].map(([position, x, y, color], index) => (
                    <span
                      key={`${position}-${x}`}
                      className={`absolute ${position} h-1.5 w-1.5 rounded-full ${color} shadow-[0_0_12px_rgba(255,255,255,.9)]`}
                      style={
                        {
                          "--spark-x": x,
                          "--spark-y": y,
                          animation: `demoSpark .9s ${index * 0.06}s ease-out both`,
                        } as CSSProperties
                      }
                    />
                  ))}
                </>
              )}
            </button>

            {logoClicked && (
              <div className="absolute -bottom-8 text-sm font-bold text-[#00b4ff] animate-in fade-in slide-in-from-top-2 zoom-in duration-500 z-10 whitespace-nowrap">
                Demo pronta da provare 🚀
              </div>
            )}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex justify-center items-center gap-3 flex-wrap">
            <span className="text-slate-100">{activeProfile.headline}</span>
          </h1>

          <p className="text-slate-400 text-[13px] font-medium mb-5 leading-relaxed">
            {activeProfile.description}
          </p>

          <div className="mb-6 flex flex-col items-center justify-center gap-4 transition-all duration-500">
            <p className="text-blue-300 text-sm flex items-center justify-center gap-1 animate-in fade-in duration-300 text-center">
              {tenantInfo.address}
            </p>

            <div className="grid grid-cols-2 gap-2 w-full">
              {[
                "Slot automatici",
                "Lista d'attesa",
                "Pagamento demo",
                "Dashboard titolare",
              ].map((badge) => (
                <span
                  key={badge}
                  className="bg-[#131c31] border border-[#1e2b4a] text-slate-300 rounded-xl px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide"
                >
                  {badge}
                </span>
              ))}
            </div>

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

        {tenantInfo.isDemo && (
          <div className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <label className="block text-sm font-bold text-slate-300">
                Tipo attività demo
              </label>
              <button
                type="button"
                onClick={() => setShowActivityModal(true)}
                className="text-[10px] font-bold text-cyan-300 hover:text-cyan-100 underline underline-offset-4"
              >
                Guida rapida
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {activityProfiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => chooseActivity(profile.id)}
                  className={`rounded-xl border px-2 py-2 text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                    selectedActivityId === profile.id
                      ? "bg-[#00b4ff]/10 border-[#00b4ff] text-[#00b4ff]"
                      : "bg-[#131c31] border-[#1e2b4a] text-slate-400 hover:border-slate-500 hover:text-white"
                  }`}
                >
                  <span>{profile.icon}</span>
                  <span>{profile.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {services.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-bold mb-2 text-slate-300">
              Scegli il servizio
            </label>

            <select
              value={selectedService?.id || ""}
              onChange={(e) => {
                const s = visibleServices.find((srv) => srv.id === e.target.value);
                setSelectedService(s || null);
                setSlots([]);
                setSelectedSlot("");
                setFormError("");
              }}
              className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition appearance-none cursor-pointer"
            >
              {visibleServices.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name} ({srv.duration} min) - {srv.price ? `${srv.price}€` : "Gratis"}
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
              L'attività è chiusa in questa data. Per favore, seleziona un altro giorno dal calendario.
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
            {demandMode && (
              <div
                className={`mb-5 bg-gradient-to-r ${demandClass} border rounded-xl p-4 animate-in zoom-in duration-300`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>

                    <span
                      className={`${demandAccent} text-[11px] font-black tracking-widest uppercase text-center sm:text-left`}
                    >
                      {demandMode.title}
                    </span>
                  </div>

                  <span className="text-orange-100 text-xs font-medium text-center sm:text-right">
                    {slots.length === 1
                      ? "1 incastro rimasto"
                      : `${slots.length} incastri rimasti`}
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed mt-2 text-center sm:text-left">
                  {demandMode.message}
                </p>
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

              {tenantInfo.isDemo && (
                <button
                  type="button"
                  onClick={fillDemoCustomer}
                  className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl px-4 py-3 text-xs font-extrabold transition"
                >
                  Riempimento demo casuale
                </button>
              )}

              <input
                type="text"
                value={honey}
                onChange={(e) => setHoney(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold mb-3 text-slate-300 text-center">
                Simula metodo di pagamento
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("salon")}
                  className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === "salon"
                      ? "bg-[#00b4ff]/10 border-[#00b4ff] text-[#00b4ff] shadow-[0_0_15px_rgba(0,180,255,0.15)]"
                      : "bg-[#131c31] border-[#1e2b4a] text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <span className="text-xs font-bold">In sede</span>
                  <span className="text-[9px] opacity-70">Pagamento dopo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("online")}
                  className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === "online"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      : "bg-[#131c31] border-[#1e2b4a] text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <span className="text-xs font-bold">Online demo</span>
                  <span className="text-[9px] opacity-70">
                    {selectedService?.price
                      ? `${selectedService.price} EUR simulati`
                      : "Simulazione"}
                  </span>
                </button>
              </div>

              {paymentMethod === "online" && (
                <div className="mt-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-left">
                  <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-1">
                    Pagamento online simulato
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Nella demo non viene aperto Stripe e non ci sono addebiti:
                    l'appuntamento viene salvato come gia pagato per mostrare
                    la dashboard.
                  </p>
                </div>
              )}
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
                : paymentMethod === "online"
                ? "Prenota e simula pagamento"
                : isSelectedLastMinute
                ? "🔥 Prenota Subito!"
                : "✓ Prenota Ora"}
            </button>

            <p className="text-[10px] text-slate-500 mt-5 text-center mb-8">
              {tenantInfo.isDemo
                ? "In demo non apriamo WhatsApp: lo slot viene salvato nel calendario demo."
                : "Verrai reindirizzato a WhatsApp per confermare."}
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
              NeatX Team
            </span>
          </p>
          <Link 
            href="/dashboard"
            className="mt-1 inline-flex items-center justify-center gap-2 px-5 py-2 bg-[#131c31] hover:bg-[#1a2642] text-slate-300 hover:text-white border border-[#1e2b4a] hover:border-[#00b4ff]/50 rounded-xl transition-all font-bold uppercase tracking-widest shadow-lg shadow-black/20"
          >
            ⚙️ Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
