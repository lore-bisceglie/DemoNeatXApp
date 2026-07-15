"use client";

import { useEffect, useState } from "react";

const FAKE_NOTIFICATIONS = [
  "Marco R. ha appena prenotato Taglio + Barba",
  "Giulia ha versato 50 euro di anticipo",
  "Promemoria inviato: appuntamento confermato",
  "Nuovo cliente arrivato da Instagram",
  "Slot delle 15:30 riempito in automatico",
];

export default function LiveNotification() {
  const [notification, setNotification] = useState("");
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const showRandomNotification = () => {
      const randomText = FAKE_NOTIFICATIONS[Math.floor(Math.random() * FAKE_NOTIFICATIONS.length)];
      setNotification(randomText);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4000);
      setTimeout(showRandomNotification, Math.random() * 10000 + 10000);
    };
    const timer = setTimeout(showRandomNotification, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`fixed z-[9990] flex items-center gap-3 bg-[#0b1221]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 px-4 py-3 rounded-2xl transform transition-all duration-500 ease-out
        bottom-[110px] left-1/2 -translate-x-1/2 w-[90%] max-w-[340px]
        md:bottom-24 md:left-6 md:translate-x-0 md:w-auto md:max-w-md
        ${showNotification ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}
      `}
    >
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0"></div>
      <p className="text-white text-xs sm:text-sm font-semibold m-0 p-0 leading-snug">
        {notification}
      </p>
    </div>
  );
}
