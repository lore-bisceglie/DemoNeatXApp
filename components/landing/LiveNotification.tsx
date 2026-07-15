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
      className={`fixed z-[99999] flex items-center gap-3 bg-[#1a2642]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 p-4 rounded-[20px] transform transition-all duration-500 ease-out
        top-4 left-4 right-4 mx-auto max-w-sm
        md:top-auto md:bottom-8 md:left-8 md:right-auto md:w-auto md:max-w-md md:rounded-2xl
        ${showNotification ? 'translate-y-0 opacity-100' : 'md:translate-y-10 -translate-y-[120%] opacity-0 pointer-events-none'}
      `}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
        <span className="text-white text-lg">✨</span>
      </div>
      <div className="flex flex-col">
        <span className="text-white text-sm font-bold leading-tight">NeatX</span>
        <p className="text-slate-300 text-xs sm:text-sm font-medium mt-0.5 leading-snug">
          {notification}
        </p>
      </div>
    </div>
  );
}
