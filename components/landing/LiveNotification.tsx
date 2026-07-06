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
      className={`fixed bottom-40 left-6 z-50 bg-[#131c31]/95 backdrop-blur-md border border-[#1e2b4a] shadow-2xl shadow-cyan-900/20 p-4 rounded-2xl flex items-center gap-4 transform transition-all duration-500 ease-out ${
        showNotification ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
      }`}
    >
      <div className="w-2 h-2 rounded-full bg-green-500 animate-ping flex-shrink-0"></div>
      <p className="text-white text-sm font-bold m-0 p-0 leading-none">
        {notification}
      </p>
    </div>
  );
}
