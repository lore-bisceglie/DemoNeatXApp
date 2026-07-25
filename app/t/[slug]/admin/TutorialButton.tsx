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
      doneBtnText: "Finito ✨",
      nextBtnText: "Avanti →",
      prevBtnText: "← Prec.",
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
            title: "⚙️ Entriamo in Gestione",
            description: "Questo pulsante apre il cuore del tuo sistema. Clicchiamo Avanti per entrarci e scoprire cosa puoi configurare.",
            align: "start",
            side: "bottom"
          },
          onHighlightStarted: () => {
            const tab = document.getElementById('tour-tab-gestione');
            if(tab) tab.click();
          }
        },
        {
          element: "#tour-settings-panel",
          popover: {
            title: "🕒 Orari, Servizi e Team",
            description: "Da questo riquadro puoi configurare gli orari di apertura, i giorni di chiusura, i servizi offerti (con durata e prezzo) e gestire i membri del tuo staff.",
            align: "center",
            side: "top"
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
          element: "#tour-marketing-widget",
          popover: {
            title: "🎯 Mini-Marketing",
            description: "L'Intelligenza Artificiale di NeatX scova in automatico i clienti 'dormienti' (che non tornano da più di 30 giorni) e ti permette di recuperarli con 1 solo click.",
            align: "center",
            side: "bottom"
          }
        },
        {
          element: "#tour-review-widget",
          popover: {
            title: "⭐ Aumenta le tue Recensioni",
            description: "Incolla qui il link della tua pagina Google. NeatX invierà un messaggio automatico dopo ogni appuntamento per chiedergli 5 stelle, spingendoti in alto su Google!",
            align: "center",
            side: "top"
          }
        },
        {
          element: "#tour-tab-business",
          popover: {
            title: "📈 Passiamo a Business",
            description: "Ora clicchiamo avanti per entrare nella sezione Business, dove si gestiscono gli incassi.",
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
            title: "💰 Focus di Oggi",
            description: "Un colpo d'occhio immediato sui clienti attesi oggi, su chi ha già pagato online e sul potenziale incasso totale della giornata.",
            align: "center",
            side: "bottom"
          }
        },
        {
          element: "#tour-stripe-form",
          popover: {
            title: "💳 Pagamenti Online (Stripe)",
            description: "Vuoi eliminare chi prenota e non si presenta? Attiva i pagamenti! Puoi decidere di chiedere un Acconto, il Saldo Totale o solo il salvataggio della Carta di Credito.",
            align: "center",
            side: "top"
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
