"use client";

import { useState, useEffect, useMemo, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTenantAdminUrl } from "@/lib/domains";
import { TenantHeader } from "@/components/tenant/TenantHeader";
import { LocationPicker } from "@/components/tenant/LocationPicker";
import { ServiceList } from "@/components/tenant/ServiceList";
import { StaffPicker } from "@/components/tenant/StaffPicker";
import { BookingForm } from "@/components/tenant/BookingForm";
import { ActivitySelectionModal } from "@/components/tenant/modals/ActivitySelectionModal";
import { DemoSuccessModal, DemoModalState } from "@/components/tenant/modals/DemoSuccessModal";
import { BookingInitialData, Service, TenantInfoType, ThemeConfig } from "@/components/tenant/types";
import { activityProfiles } from "@/components/tenant/constants";
import { parseClosedDays } from "@/lib/opening-hours";

const ROME_DATE_FORMATTER = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Rome",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const ROME_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Rome",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  hourCycle: "h23",
});

function getRomeDate(value: Date): string {
  return ROME_DATE_FORMATTER.format(value);
}

function getRomeClock(value: Date): { date: string; minutes: number } {
  const parts = ROME_TIME_FORMATTER.formatToParts(value);
  const hours = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minutes = Number(parts.find((part) => part.type === "minute")?.value || 0);
  return { date: getRomeDate(value), minutes: hours * 60 + minutes };
}

function toTenantInfo(data: BookingInitialData): TenantInfoType {
  return {
    id: data.id,
    name: data.name,
    address: data.address || "",
    phone: data.phone || "",
    openTime: data.openTime || "09:00",
    closeTime: data.closeTime || "19:00",
    breakStart: data.breakStart || "",
    breakEnd: data.breakEnd || "",
    closedDays: parseClosedDays(data.closedDays),
    instagramUrl: data.instagramUrl || "",
    mapsLink: data.mapsLink || (data.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}` : ""),
    tiktokUrl: data.tiktokUrl || "",
    bookingUrl: data.bookingUrl || "",
    trialEndsAt: data.trialEndsAt,
    isDemo: data.isDemoData,
    trialExpired: data.trialExpired,
    trialStatus: data.trialStatus,
    category: data.category,
    description: data.description || "",
    city: data.city || "",
    isPremium: data.isPremium,
    staff: data.staff,
    logoUrl: data.logoUrl || "",
    themeColor: data.themeColor || "cyan",
    storeSettings: data.storeSettings,
  };
}

export function BookingClient({ slug, initialData }: { slug: string; initialData: BookingInitialData }) {
  const [calendarBounds] = useState(() => {
    const now = new Date();
    return {
      today: getRomeDate(now),
      maxDate: getRomeDate(new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)),
    };
  });
  const { today, maxDate } = calendarBounds;

  const services = initialData.services;
  const locations = initialData.locations;
  const firstService = services[0] || null;
  const firstCapableStaff = firstService
    ? initialData.staff.find((staff) => staff.services.some((service) => service.id === firstService.id))
    : null;
  const tenantInfo = useMemo(() => toTenantInfo(initialData), [initialData]);

  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState(
    services.length ? "" : "Nessun servizio configurato per questo negozio."
  );
  const [honey, setHoney] = useState("");
  const [emailCopied, setEmailCopied] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [demoModal, setDemoModal] = useState<DemoModalState>({
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
  const [isHoliday, setIsHoliday] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);
  const [romeClock, setRomeClock] = useState<{ date: string; minutes: number } | null>(null);

  const [logoClicked, setLogoClicked] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"salon" | "online">("salon");
  const [selectedActivityId, setSelectedActivityId] = useState("all");
  const [showActivityModal, setShowActivityModal] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState(
    locations.length === 1 ? locations[0].id : ""
  );

  const router = useRouter();

  const themeMap: Record<string, ThemeConfig> = {
    cyan: {
      mainHex: '00b4ff',
      btnBg: 'bg-[#00b4ff] hover:bg-cyan-400 text-[#050814]',
      textMain: 'text-[#00b4ff]',
      textHover: 'hover:text-cyan-400',
      borderMain: 'border-[#00b4ff]/30',
      shadowMain: 'shadow-cyan-900/20',
      avatarShadow: 'shadow-[0_20px_42px_rgba(0,180,255,.26)]',
      badgeBg: 'bg-cyan-950/40',
      selection: 'selection:bg-cyan-500/30'
    },
    rose: {
      mainHex: 'f43f5e',
      btnBg: 'bg-rose-500 hover:bg-rose-400 text-white',
      textMain: 'text-rose-500',
      textHover: 'hover:text-rose-400',
      borderMain: 'border-rose-500/30',
      shadowMain: 'shadow-rose-900/20',
      avatarShadow: 'shadow-[0_20px_42px_rgba(244,63,94,.26)]',
      badgeBg: 'bg-rose-950/40',
      selection: 'selection:bg-rose-500/30'
    },
    emerald: {
      mainHex: '10b981',
      btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-white',
      textMain: 'text-emerald-500',
      textHover: 'hover:text-emerald-400',
      borderMain: 'border-emerald-500/30',
      shadowMain: 'shadow-emerald-900/20',
      avatarShadow: 'shadow-[0_20px_42px_rgba(16,185,129,.26)]',
      badgeBg: 'bg-emerald-950/40',
      selection: 'selection:bg-emerald-500/30'
    },
    violet: {
      mainHex: '8b5cf6',
      btnBg: 'bg-violet-500 hover:bg-violet-400 text-white',
      textMain: 'text-violet-500',
      textHover: 'hover:text-violet-400',
      borderMain: 'border-violet-500/30',
      shadowMain: 'shadow-violet-900/20',
      avatarShadow: 'shadow-[0_20px_42px_rgba(139,92,246,.26)]',
      badgeBg: 'bg-violet-950/40',
      selection: 'selection:bg-violet-500/30'
    },
    amber: {
      mainHex: 'f59e0b',
      btnBg: 'bg-amber-500 hover:bg-amber-400 text-[#050814]',
      textMain: 'text-amber-500',
      textHover: 'hover:text-amber-400',
      borderMain: 'border-amber-500/30',
      shadowMain: 'shadow-amber-900/20',
      avatarShadow: 'shadow-[0_20px_42px_rgba(245,158,11,.26)]',
      badgeBg: 'bg-amber-950/40',
      selection: 'selection:bg-amber-500/30'
    }
  };

  const [selectedService, setSelectedService] = useState<Service | null>(firstService);
  const [selectedStaffId, setSelectedStaffId] = useState(firstCapableStaff?.id || "any");
  const isPlaygroundDemo = tenantInfo.isDemo && tenantInfo.trialStatus === "demo";
  const th = themeMap[tenantInfo.themeColor] || themeMap.cyan;

  const selectedLocation = useMemo(() =>
    locations.find(l => l.id === selectedLocationId) || null,
    [locations, selectedLocationId]
  );

  const bookingTenantInfo = useMemo(
    () => {
      const locationSettings = selectedLocation?.settings;
      return {
        ...tenantInfo,
        storeSettings: locationSettings && locationSettings.paymentStrategy !== "OFF"
        ? {
            ...locationSettings,
            stripeOnboardingComplete: tenantInfo.storeSettings?.stripeOnboardingComplete,
            stripeConnected:
              locationSettings.stripeConnected ||
              tenantInfo.storeSettings?.stripeOnboardingComplete ||
              tenantInfo.storeSettings?.stripeConnected,
          }
        : tenantInfo.storeSettings,
      };
    },
    [tenantInfo, selectedLocation]
  );

  const filteredStaff = useMemo(() => {
    if (!selectedLocationId) return tenantInfo.staff;
    return tenantInfo.staff.filter((s) => {
      if (s.locations && s.locations.length > 0) {
        return s.locations.some(l => l.locationId === selectedLocationId);
      }
      if (s.locationId) return s.locationId === selectedLocationId;
      return true;
    });
  }, [tenantInfo.staff, selectedLocationId]);

  const effectiveCloseTime = selectedLocation?.closeTime || tenantInfo.closeTime;
  const effectiveOpenTime = selectedLocation?.openTime || tenantInfo.openTime;
  const effectiveBreakStart = selectedLocation?.breakStart ?? tenantInfo.breakStart;
  const effectiveBreakEnd = selectedLocation?.breakEnd ?? tenantInfo.breakEnd;
  const effectiveClosedDays = useMemo(
    () => selectedLocation ? parseClosedDays(selectedLocation.closedDays) : tenantInfo.closedDays,
    [selectedLocation, tenantInfo.closedDays],
  );

  const effectiveServicePrice = useMemo(() => {
    if (!selectedLocation || !selectedService) return selectedService?.price ?? 0;
    const sl = selectedService.locations?.find(l => l.locationId === selectedLocation.id);
    return sl?.price ?? selectedService.price;
  }, [selectedLocation, selectedService]);

  const shopInitials = tenantInfo.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "NX";

  const trustBadges = isPlaygroundDemo
    ? ["Slot automatici", "Lista d'attesa", "Pagamento demo", "Dashboard titolare"]
    : ["Prenotazione online", "Lista d'attesa", "Promemoria automatici", "Agenda aggiornata"];

  const activeProfile =
    activityProfiles.find((profile) => profile.id === selectedActivityId) ||
    activityProfiles[0];

  const visibleServices = useMemo(() => {
    if (!isPlaygroundDemo || !activeProfile.matchWords.length) return services;

    const filtered = services.filter((service) =>
      activeProfile.matchWords.some((word) =>
        service.name.toLowerCase().includes(word.toLowerCase())
      )
    );

    return filtered.length > 0 ? filtered : services;
  }, [activeProfile, isPlaygroundDemo, services]);

  const filteredServices = useMemo(() => {
    if (!selectedLocationId) return visibleServices;
    const hasLocationData = visibleServices.some(s => s.locations && s.locations.length > 0);
    if (!hasLocationData) return visibleServices;
    return visibleServices.filter(s =>
      !s.locations || s.locations.length === 0 ||
      s.locations.some(l => l.locationId === selectedLocationId)
    );
  }, [visibleServices, selectedLocationId]);

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

  const handleLogoClick = () => {
    if (logoClicked) return;
    setLogoClicked(true);

    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    setTimeout(() => setLogoClicked(false), 2000);
  };

  useEffect(() => {
    const refreshClock = () => setRomeClock(getRomeClock(new Date()));
    refreshClock();
    const timer = window.setInterval(refreshClock, 60_000);
    return () => window.clearInterval(timer);
  }, []);

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
    if (!date || !selectedService) return;

    const day = new Date(`${date}T12:00:00Z`).getUTCDay();

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

    if (effectiveClosedDays.includes(day)) {
      setDateError("Oggi siamo chiusi! Scegli un altro giorno.");
      setSlots([]);
      setIsHoliday(false);
      setInitialLoad(false);
      return;
    }

    // Il controllo sulle festività specifiche è ora demandato esclusivamente
    // all'API backend (/api/slots), che legge le impostazioni del tenant
    // permettendo eccezioni (es. aperture straordinarie).

    setDateError("");
    setLoading(true);

    const controller = new AbortController();

    let url = `/api/availability?date=${encodeURIComponent(date)}&duration=${selectedService.duration}&serviceId=${encodeURIComponent(selectedService.id)}&tenantId=${encodeURIComponent(tenantInfo.id)}&locationId=${encodeURIComponent(selectedLocationId)}`;
    if (selectedStaffId && selectedStaffId !== "any") {
      url += `&staffId=${selectedStaffId}`;
    }

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Errore nel recupero degli slot");
        return res.json();
      })
      .then((data) => {
        setIsHoliday(Boolean(data.isHoliday));
        if (data.isHoliday) {
          setSlots([]);
        } else {
          setSlots(data.slots || []);
        }
        setInitialLoad(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error(err);
          setInitialLoad(false);
          setDateError("Errore nel caricamento degli orari. Riprova tra poco.");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [date, selectedService, tenantInfo.id, effectiveClosedDays, selectedStaffId, selectedLocationId, maxDate, today]);

  const handleFirstAvailable = () => {
    if (slots.length > 0) {
      setSelectedSlot(slots[0]);
      setFormError("");
      setFieldErrors([]);
    }
  };

  const handleBook = async () => {
    if (honey) return;

    const errors = [];
    if (!name.trim()) errors.push("nome");
    if (!isPlaygroundDemo && !phone.trim()) errors.push("telefono");
    if (!selectedService) errors.push("servizio");
    if (!selectedSlot) errors.push("orario");

    if (errors.length > 0) {
      setFieldErrors(errors);
      setFormError("Compila tutti i campi obbligatori per continuare.");
      return;
    }

    setIsBooking(true);
    setFormError("");

    try {
      if (isPlaygroundDemo) {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        let pathName = "/t/demo-studio";
        if (typeof window !== "undefined") {
          pathName = window.location.pathname;
        }

        setDemoModal({
          show: true,
          date,
          time: selectedSlot,
          serviceName: selectedService?.name || "",
          paymentLabel: paymentMethod === "online" ? "Simulazione Pagamento Online" : "Pagamento in sede",
          customerName: name,
          customerPhone: phone,
          cancelPath: `${pathName}/cancel?token=simulated_token_123`,
          price: effectiveServicePrice,
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

      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          date,
          time: selectedSlot,
          serviceId: selectedService?.id,
          tenantId: tenantInfo.id,
          staffId: selectedStaffId !== "any" ? selectedStaffId : null,
          locationId: selectedLocationId || null,
          paymentMethod: bookingTenantInfo.storeSettings?.paymentMandatory ? "online" : paymentMethod,
          privacyAccepted,
          honey,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        const shouldCheckout = Boolean(
          !isPlaygroundDemo &&
          bookingTenantInfo.storeSettings?.paymentStrategy !== "OFF" &&
          (bookingTenantInfo.storeSettings?.paymentMandatory || paymentMethod === "online")
        );
        if (shouldCheckout) {
          const checkoutRes = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              appointmentId: data.appointment.id,
              bookingToken: data.cancelToken,
            }),
          });

          const checkoutData = await checkoutRes.json().catch(() => ({}));

          if (checkoutRes.ok && checkoutData.url) {
            window.location.href = checkoutData.url;
            // IMPORTANT: Do NOT setIsBooking(false) here to prevent multiple clicks
            // while Stripe is loading. The page will unload.
            return;
          }

          if (bookingTenantInfo.storeSettings?.paymentMandatory) {
            await fetch("/api/cancel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: data.cancelToken }),
            }).catch(() => {});
          }

          setFormError(
            checkoutData.error ||
              "Prenotazione salvata, ma l'acconto online non è disponibile. Avvisa il negoziante."
          );
          setIsBooking(false);
          return;
        }

        // Se il pagamento è in salone, apriamo WhatsApp in una nuova scheda
        const baseUrl = window.location.origin;
        const cancelUrl = `${baseUrl}/cancel/${data.cancelToken}`;
        const priceString = effectiveServicePrice ? ` (${effectiveServicePrice}€)` : "";

        const confirmText = `📅 *Nuova Prenotazione!*\n\n` +
          `👤 *Cliente:* ${name}\n` +
          `📱 *Telefono:* ${phone || "Non inserito"}\n` +
          `📅 *Data:* ${date.split("-").reverse().join("/")}\n` +
          `⏰ *Ora:* ${selectedSlot}\n` +
          `📌 *Servizio:* ${selectedService?.name}${priceString}\n` +
          `💳 *Pagamento:* in salone\n\n` +
          `❌ *Per annullare in autonomia:*\n` +
          `Puoi usare questo link fino a 2 ore prima dell'appuntamento:\n${cancelUrl}\n\n` +
          `_Prenotazione gestita tramite NeatX._ 🚀`;

        const tenantPhone = selectedLocation?.phone || tenantInfo.phone;
        const cleanPhone = tenantPhone.replace(/\D/g, "");
        const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
          confirmText
        )}`;

        const link = document.createElement("a");
        link.href = waLink;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Subito dopo aver aperto WhatsApp, la scheda corrente va alla pagina di successo
        if (data.appointment?.id) {
          window.location.href = `/t/${slug}/success?app_id=${data.appointment.id}`;
          return;
        }

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
        try {
          const errorData = await res.json();
          setFormError(errorData.error || "Si è verificato un errore di connessione, riprova!");
        } catch (e) {
          setFormError(`Errore server: ${res.statusText}`);
        }
        setIsBooking(false);
      }
    } catch (networkError) {
      console.error("Errore di rete durante la prenotazione:", networkError);
      setFormError("Errore di connessione. Controlla la rete e riprova.");
      setIsBooking(false);
    }
  };

  const isButtonDisabled =
    isBooking ||
    selectedSlot === "" ||
    name === "" ||
    (!isPlaygroundDemo && phone === "") ||
    !privacyAccepted;

  const isSaturday = new Date(`${date}T12:00:00Z`).getUTCDay() === 6;
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
          : isPlaygroundDemo
          ? "Il sabato si riempie prima: nella demo vedi come spingere il cliente a scegliere subito."
          : "Il sabato si riempie prima: scegli subito un orario disponibile.",
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
  const isSelectedLastMinute = isScarce && selectedSlot !== "";

  const [closingHourStr, closingMinuteStr] = (effectiveCloseTime || "19:00").split(":").map(Number);
  const closingHour = closingHourStr;
  const closingMinute = closingMinuteStr;

  const closingTotalMinutes = closingHour * 60 + closingMinute;

  const isTodaySelected = date === romeClock?.date;
  const isSalonClosedNow =
    Boolean(romeClock && isTodaySelected && romeClock.minutes >= closingTotalMinutes);

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
        title: isPlaygroundDemo ? "Il sabato della demo è già pieno." : "Il sabato è già pieno.",
        text: isPlaygroundDemo
          ? "Questo mostra come NeatX comunica i giorni più richiesti e spinge il cliente a scegliere un nuovo orario o la lista d'attesa."
          : "Il sabato è molto richiesto: scegli un nuovo giorno o entra in lista d'attesa.",
      }
    : {
        icon: "📅",
        badge: "TUTTO PRENOTATO",
        badgeClass:
          "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
        title: "Nessun orario disponibile per questa data.",
        text: "La giornata è al completo o non c'è abbastanza tempo per il servizio selezionato. Prova a scegliere un altro giorno.",
      };

  if (tenantInfo.trialExpired) {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center text-5xl mb-6 border border-red-500/20">
          🔒
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-4">Prenotazioni Sospese</h1>
        <p className="text-slate-400 mb-8 max-w-sm">
          Le prenotazioni online per <strong>{tenantInfo.name}</strong> sono temporaneamente non disponibili. L'abbonamento del salone è scaduto o in fase di rinnovo. Riprova più tardi.
        </p>
      </div>
    );
  }

  if (initialLoad) {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center font-sans">
        <div className="relative flex justify-center items-center mb-6">
          <div className="absolute w-20 h-20 border-4 border-[#1a2642] border-t-[#00b4ff] rounded-full animate-spin"></div>
          <span className="text-2xl mt-1">🚀</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          {tenantInfo.name}
        </h2>
        <p className="text-slate-500 text-sm mt-3 font-medium animate-pulse">
          Sincronizzazione agenda in corso...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col items-center py-10 px-4 font-sans text-slate-200 selection:bg-cyan-500/30 relative overflow-hidden animate-in fade-in duration-200">
      {tenantInfo.isDemo && !isPlaygroundDemo && tenantInfo.trialEndsAt && (
        <div className="mb-5 w-full max-w-md rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-center text-xs font-extrabold uppercase tracking-widest text-emerald-300">
          Prova gratuita attiva fino al{" "}
          {new Date(tenantInfo.trialEndsAt).toLocaleDateString("it-IT", {
            timeZone: "Europe/Rome",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </div>
      )}

      {isPlaygroundDemo && (
        <ActivitySelectionModal
          show={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          onChooseActivity={chooseActivity}
          th={th}
        />
      )}

      <DemoSuccessModal
        demoModal={demoModal}
        setDemoModal={setDemoModal}
        isPlaygroundDemo={isPlaygroundDemo}
        tenantAdminUrl={getTenantAdminUrl(slug)}
        th={th}
      />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00b4ff] opacity-[0.04] blur-[120px] pointer-events-none rounded-full"></div>

      <div className={`bg-[#0b1221] max-w-md md:max-w-lg lg:max-w-xl w-full rounded-3xl shadow-2xl border border-[#1a2642] p-6 sm:p-8 relative z-10 transition-all ${th.shadowMain}`}>
        {isPlaygroundDemo && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-xs p-3 rounded-xl font-semibold leading-relaxed">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-center sm:text-left">
                Ambiente demo: usa nomi e numeri finti. Ogni prenotazione si salva nella dashboard titolare.
              </p>
              <Link
                href={getTenantAdminUrl(slug)}
                className="shrink-0 bg-yellow-300 text-[#050814] hover:bg-yellow-200 px-3 py-2 rounded-lg font-extrabold text-center"
              >
                Apri dashboard
              </Link>
            </div>
          </div>
        )}

        {showCancelBanner && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-center animate-in fade-in zoom-in duration-150">
            <span className="block text-2xl mb-1">✅</span>
            <span className="font-bold block text-sm">Appuntamento annullato</span>
            <span className="text-xs text-emerald-200">
              Il tuo slot è stato liberato con successo.
            </span>
          </div>
        )}

        <TenantHeader
          tenantInfo={tenantInfo}
          selectedLocation={selectedLocation}
          th={th}
          logoClicked={logoClicked}
          handleLogoClick={handleLogoClick}
          isPlaygroundDemo={isPlaygroundDemo}
          effectiveServicePrice={effectiveServicePrice}
          hasSelectedService={Boolean(selectedService)}
        />

        {isPlaygroundDemo && (
          <div className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <label className="block text-sm font-bold text-slate-300">
                Tipo attività demo
              </label>
              <button
                type="button"
                onClick={() => setShowActivityModal(true)}
                className={`text-[10px] font-bold underline underline-offset-4 ${th.textMain} ${th.textHover}`}
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
                  className={`rounded-xl border px-2 py-2 text-xs font-extrabold transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-90 ${
                    selectedActivityId === profile.id
                      ? `bg-[#00b4ff]/10 border-[#00b4ff] ${th.textMain} shadow-[0_0_10px_rgba(0,180,255,0.2)]`
                      : "bg-[#131c31] border-[#1e2b4a] text-slate-400 hover:border-slate-500 hover:text-white hover:scale-[1.05]"
                  }`}
                >
                  <span>{profile.icon}</span>
                  <span>{profile.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <LocationPicker
          locations={locations}
          selectedLocationId={selectedLocationId}
          onSelectLocation={(id) => {
            setSelectedLocationId(id);
            setSlots([]);
            setSelectedSlot("");
          }}
        />

        <ServiceList
          services={services}
          filteredServices={filteredServices}
          filteredStaff={filteredStaff}
          selectedService={selectedService}
          selectedLocation={selectedLocation}
          fieldErrors={fieldErrors}
          onSelectService={(s, defaultStaff) => {
            setSelectedService(s);
            setSelectedStaffId(defaultStaff);
          }}
          onClearSlots={() => {
            setSlots([]);
            setSelectedSlot("");
          }}
          onClearErrors={() => {
            setFormError("");
            setFieldErrors([]);
          }}
        />

        <StaffPicker
          isPremium={tenantInfo.isPremium}
          selectedService={selectedService}
          filteredStaff={filteredStaff}
          selectedStaffId={selectedStaffId}
          onSelectStaff={(id) => setSelectedStaffId(id)}
          onClearSlots={() => {
            setSlots([]);
            setSelectedSlot("");
          }}
        />

        {selectedService && (
          <BookingForm
            date={date}
            setDate={setDate}
            today={today}
            maxDate={maxDate}
            dateError={dateError}
            isHoliday={isHoliday}
            loading={loading}
            slots={slots}
            selectedSlot={selectedSlot}
            setSelectedSlot={setSelectedSlot}
            name={name}
            setName={setName}
            phone={phone}
            setPhone={setPhone}
            honey={honey}
            setHoney={setHoney}
            privacyAccepted={privacyAccepted}
            setPrivacyAccepted={setPrivacyAccepted}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            formError={formError}
            setFormError={setFormError}
            fieldErrors={fieldErrors}
            setFieldErrors={setFieldErrors}
            isBooking={isBooking}
            isButtonDisabled={isButtonDisabled}
            isSelectedLastMinute={isSelectedLastMinute}
            isScarce={isScarce}
            tenantInfo={bookingTenantInfo}
            selectedService={selectedService}
            isPlaygroundDemo={isPlaygroundDemo}
            th={th}
            noSlotsMessage={noSlotsMessage}
            demandMode={demandMode}
            demandClass={demandClass}
            demandAccent={demandAccent}
            handleFirstAvailable={handleFirstAvailable}
            fillDemoCustomer={fillDemoCustomer}
            handleBook={handleBook}
          />
        )}
      </div>

      {/* Banner Promozionale NeatX (Marketing Virale) */}
      <div className="bg-[#131c31] max-w-md md:max-w-lg lg:max-w-xl w-full rounded-3xl shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-[#1a2642] p-6 mt-6 text-center flex flex-col items-center gap-2 relative z-10">
        <h3 className="text-white font-extrabold text-lg mb-1 tracking-wide">La tua attività. Senza limiti.</h3>
        <p className="text-slate-300 text-xs font-medium">I clienti dimenticano. <span className="font-bold text-white">Neat<span className="text-[#007aff]">X</span></span> ricorda. La tua agenda si riempie.</p>
        <p className="text-slate-400 text-[11px] mb-2">C'è un motivo se funziona.</p>

        <Link href="https://www.neatx.store"
              target="_blank"
              className="mt-2 w-full py-3 bg-gradient-to-r from-[#1e40af] to-[#06b6d4] hover:from-[#1e3a8a] hover:to-[#0891b2] text-white rounded-xl font-bold text-sm transition-all shadow-[0_0_25px_rgba(6,182,212,0.35)] flex items-center justify-center gap-2">
          <span>🚀</span> Scopri di più
        </Link>
      </div>

      <div className="bg-[#0b1221] max-w-md md:max-w-lg lg:max-w-xl w-full rounded-3xl p-6 mt-4 text-center flex flex-col items-center gap-4 relative z-10 border border-[#1a2642] shadow-lg">
        <div className="text-[11px] text-slate-400 tracking-wide leading-relaxed flex flex-col items-center gap-3">
          <p>
            Powered by <span className="font-bold text-white">Neat<span className="text-[#007aff]">X</span></span>
          </p>
          <p className="text-[10px]">
            <button onClick={() => { navigator.clipboard.writeText('neatx.info@gmail.com').then(() => { setEmailCopied(true); setTimeout(() => setEmailCopied(false), 2000); }); }} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer font-inherit text-inherit text-[10px]">{emailCopied ? 'Copiato! ✓' : 'neatx.info@gmail.com'}</button>
            <span className="mx-2 text-slate-600">·</span>
            <span>© 2026</span>
          </p>
          <Link
            href={getTenantAdminUrl(slug)}
            className="mt-1 inline-flex items-center justify-center gap-2 px-5 py-2 bg-[#131c31] hover:bg-[#1a2642] text-slate-300 hover:text-white border border-[#1e2b4a] hover:border-[#00b4ff]/50 rounded-xl transition-all font-bold uppercase tracking-widest shadow-lg shadow-black/20"
          >
            ⚙️ Accesso Staff
          </Link>
        </div>
      </div>
    </div>
  );
}
