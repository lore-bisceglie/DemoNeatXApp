"use client";
import { HelpCircle } from "lucide-react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, useState } from "react";

export default function TutorialButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      allowClose: false, // Prevents accidental closing by clicking outside
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
            align: "start"
          }
        },
        {
          element: "#tour-tab-gestione",
          popover: {
            title: "⚙️ Gestione",
            description: "Cliccando qui puoi modificare i servizi, gli orari di apertura, e collegare Stripe per ricevere pagamenti online.",
            align: "start"
          }
        },
        {
          element: "#tour-link",
          popover: {
            title: "📎 Link Prenotazione",
            description: "Questo è il tuo link personale! Copialo e mettilo su Instagram o WhatsApp per far prenotare i clienti in autonomia.",
            align: "center"
          }
        },
        {
          popover: {
            title: "⏰ Consiglio: Intervalli di 15 minuti",
            description: "Quando imposti la durata dei servizi, usa multipli di 15 minuti (15, 30, 45, 60...) per massimizzare gli appuntamenti nell'agenda.",
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
