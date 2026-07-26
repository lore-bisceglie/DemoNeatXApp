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
      className={`hidden md:flex fixed z-[9998] items-center gap-3.5 bg-[#0b1221]/90 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] p-3 pr-6 rounded-2xl transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
        bottom-28 right-8 max-w-md
        ${showNotification ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95 pointer-events-none'}
      `}
    >
      <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
      </div>
      <div className="flex flex-col">
        <p className="text-white text-[13px] sm:text-sm font-medium leading-snug">
          {notification}
        </p>
        <span className="text-cyan-400 text-[10px] font-bold tracking-widest uppercase mt-0.5">
          Appena successo
        </span>
      </div>
    </div>
  );
}
