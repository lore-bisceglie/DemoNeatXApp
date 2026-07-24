"use client";
import { HelpCircle } from "lucide-react";
import { driver } from "driver.js";
import { useEffect, useState } from "react";

export default function TutorialButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Auto-start on very first visit
    const hasSeenTutorial = localStorage.getItem("neatx_tutorial_seen_v3");
    if (!hasSeenTutorial) {
      setTimeout(() => {
        startTour();
        localStorage.setItem("neatx_tutorial_seen_v3", "true");
      }, 1000);
    }
  }, []);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      allowClose: true, // Allow user to skip if they want
      animate: true,
      stagePadding: 8,
      doneBtnText: "Ho capito! ✨",
      nextBtnText: "Avanti →",
      prevBtnText: "← Indietro",
      steps: [
        {
          popover: {
            title: "👋 Benvenuto nella tua Dashboard",
            description: "Questa è la tua centrale operativa premium. Da qui hai il controllo totale su prenotazioni, clienti, staff e incassi.",
          }
        },
        {
          element: "#tour-header-actions",
          popover: {
            title: "👥 Team e Rubrica",
            description: "Aggiungi collaboratori al tuo Team e visualizza la rubrica completa dei tuoi clienti. Puoi assegnare permessi specifici a ogni membro.",
            align: "start",
            side: "bottom"
          }
        },
        {
          element: "#tour-dashboard-cards",
          popover: {
            title: "📊 Statistiche & Prossimo Cliente",
            description: "Tieni sempre d'occhio chi è il prossimo cliente in arrivo e il fatturato stimato del mese calcolato dinamicamente.",
            align: "center",
            side: "bottom"
          }
        },
        {
          element: "#tour-waitlist",
          popover: {
            title: "📋 Lista d'Attesa Intelligente",
            description: "Niente più buchi in agenda. Se qualcuno disdice, avvisa con un click i clienti in lista d'attesa per riempire il posto.",
            align: "center",
            side: "top"
          }
        },
        {
          element: "#tour-agenda-dynamic",
          popover: {
            title: "📅 Agenda Dinamica",
            description: "Gestisci gli appuntamenti con swipe e drag. Sulla sinistra trovi i buchi liberi per piazzare incastri al volo, e ogni servizio ha un colore personalizzato.",
            align: "center",
            side: "top"
          }
        },
        {
          element: "#tour-tab-gestione",
          popover: {
            title: "⚙️ Gestione Orari e Servizi",
            description: "Clicca qui per modificare orari di apertura, aggiungere servizi, gestire i giorni di chiusura e trovare il tuo LINK PRENOTAZIONE da dare ai clienti.",
            align: "start",
            side: "bottom"
          }
        },
        {
          element: "#tour-tab-business",
          popover: {
            title: "📈 Business & Pagamenti",
            description: "Il cuore del guadagno. Qui colleghi Stripe per farti pagare online dai clienti, attivi il marketing automatico e gestisci le recensioni Google.",
            align: "start",
            side: "bottom"
          }
        },
        {
          popover: {
            title: "🚀 Tip PRO: WhatsApp Business",
            description: "Per massimizzare la resa e abbattere il tempo perso al telefono, usa WhatsApp Business impostando un messaggio automatico di benvenuto con il tuo LINK PRENOTAZIONE. Così il cliente prenota da solo senza farti impazzire! (Consiglio Extra: in Gestione usa durate di 15 in 15 minuti).",
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
      className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/40 text-sm font-bold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap"
      title="Guida rapida"
    >
      <HelpCircle size={16} /> Tutorial
    </button>
  );
}
