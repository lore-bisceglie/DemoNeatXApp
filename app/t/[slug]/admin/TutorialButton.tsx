"use client";
import { HelpCircle } from "lucide-react";
import { driver } from "driver.js";
import { useEffect, useState } from "react";

export default function TutorialButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Auto-start on very first visit
    const hasSeenTutorial = localStorage.getItem("neatx_tutorial_seen_v1");
    if (!hasSeenTutorial) {
      setTimeout(() => {
        startTour();
        localStorage.setItem("neatx_tutorial_seen_v1", "true");
      }, 1000);
    }
  }, []);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      allowClose: false,
      animate: true,
      stagePadding: 5,
      doneBtnText: "Ho capito! ✨",
      nextBtnText: "Avanti →",
      prevBtnText: "← Indietro",
      steps: [
        {
          popover: {
            title: "👋 Benvenuto nella tua Dashboard",
            description: "Questa è la tua centrale operativa. Da qui gestisci prenotazioni, clienti, staff e impostazioni del tuo salone.",
          }
        },
        {
          element: "#tour-header-actions",
          popover: {
            title: "📋 Team e Rubrica",
            description: "Da questo menu in alto puoi aggiungere collaboratori (Team) e visualizzare la lista dei tuoi clienti (Rubrica) con tutte le loro preferenze.",
            align: "start",
            side: "bottom"
          }
        },
        {
          element: "#tour-tab-gestione",
          popover: {
            title: "⚙️ Gestione & Link Prenotazione",
            description: "Clicca su questo tab per modificare i servizi, collegare Stripe e trovare il TUO LINK PERSONALE da mettere su Instagram per far prenotare i clienti in autonomia.",
            align: "start",
            side: "bottom"
          }
        },
        {
          popover: {
            title: "⏰ Consiglio: Intervalli di 15 minuti",
            description: "Quando imposti la durata dei servizi nella scheda Gestione, usa multipli di 15 minuti (15, 30, 45, 60...) per incastrare perfettamente gli appuntamenti nell'agenda.",
          }
        }
      ]
    });

    driverObj.drive();
  };

  if (!mounted) return null;

  return (
    <button
      onClick={startTour}
      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 text-sm font-bold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap"
      title="Guida rapida"
    >
      <HelpCircle size={16} /> Tutorial
    </button>
  );
}
