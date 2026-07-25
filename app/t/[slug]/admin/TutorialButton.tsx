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
          },
          onHighlightStarted: () => { document.getElementById('tour-tab-agenda')?.click(); }
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
            description: "Questo pulsante apre le impostazioni avanzate. Clicchiamo Avanti per entrarci e vedere come configurare il tuo salone.",
            align: "start",
            side: "bottom"
          },
          onHighlightStarted: () => {
            const tab = document.getElementById('tour-tab-gestione');
            if(tab) tab.click();
          }
        },
        {
          element: "#tour-link",
          popover: {
            title: "🔗 Il tuo Link Prenotazione",
            description: "Questo è il link d'oro. Copialo e mettilo nella Bio di Instagram o giralo su WhatsApp. I clienti prenoteranno in autonomia H24!",
            align: "center",
            side: "top"
          }
        },
        {
          element: "#tour-tab-business",
          popover: {
            title: "📈 Business & Pagamenti",
            description: "Entriamo nella sezione Business per vedere come incassare online e far crescere il fatturato.",
            align: "start",
            side: "bottom"
          },
          onHighlightStarted: () => {
            const tab = document.getElementById('tour-tab-business');
            if(tab) tab.click();
          }
        },
        {
          element: "#tour-business-focus",
          popover: {
            title: "🎯 Focus e Stripe",
            description: "Qui tieni d'occhio i pagamenti. Scorrendo in basso in questa scheda potrai collegare Stripe per ricevere acconti o saldi online in totale sicurezza.",
            align: "center",
            side: "bottom"
          }
        },
        {
          popover: {
            title: "🚀 Tip PRO: WhatsApp Business",
            description: "Consiglio d'oro: imposta su WhatsApp Business un messaggio automatico con il tuo LINK PRENOTAZIONE. Così, se un cliente ti scrive mentre lavori, WhatsApp gli risponde col link per prenotare da solo!",
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
