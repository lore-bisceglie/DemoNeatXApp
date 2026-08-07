"use client";
import { HelpCircle } from "lucide-react";
import { driver } from "driver.js";
import { useEffect, useState } from "react";

export default function TutorialButton({
  showInstallStep = false,
  slug,
  tutorialSeen,
}: {
  showInstallStep?: boolean;
  slug?: string;
  tutorialSeen?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  // Marca "tutorial visto" nel database del negozio (una sola volta per negozio)
  const markSeen = () => {
    if (!slug) return;
    try {
      fetch("/api/tenant/tutorial-seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
    } catch {
      // Se la rete fallisce, il localStorage resta come backup per non ripetere
    }
  };

  useEffect(() => {
    setMounted(true);

    const isDemo = slug === "demo-neatx";

    // Demo: mai da sola (aperta a tutti). Solo dal tasto.
    if (isDemo) return;

    // Negozio vero: decide il database. tutorialSeen è `false` solo se mai visto.
    if (slug && tutorialSeen !== undefined) {
      if (tutorialSeen) return; // già visto → mai più da sola
      const t = setTimeout(() => {
        startTour();
        markSeen();
      }, 1000);
      return () => clearTimeout(t);
    }

    // Fallback (componente usato altrove senza props): vecchio comportamento con localStorage
    const hasSeenTutorial = localStorage.getItem("neatx_tutorial_seen_v4");
    if (!hasSeenTutorial) {
      const t = setTimeout(() => {
        startTour();
        localStorage.setItem("neatx_tutorial_seen_v4", "true");
      }, 1000);
      return () => clearTimeout(t);
    }
  }, []);

  const startTour = () => {
    const installStep = showInstallStep
      ? [{
          element: "#tour-install-app",
          popover: {
            title: "📲 Installa NeatX sul dispositivo",
            description: "Questo pulsante crea un’icona di NeatX sulla schermata Home: così puoi aprire direttamente la tua agenda, senza cercare ogni volta il sito nel browser. L’app si apre in una finestra dedicata e non modifica account, clienti o appuntamenti. Se il browser non mostra il comando automatico, dopo il clic ti spieghiamo dove trovarlo.",
            align: "end" as const,
            side: "bottom" as const
          }
        }]
      : [];

    const driverObj = driver({
      showProgress: true,
      allowClose: true, // Allow user to skip if they want
      animate: true,
      stagePadding: 8,
      popoverOffset: 32,
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
          element: "#tour-team-button",
          popover: {
            title: "👥 Team e Rubrica",
            description: "Qui gestisci i collaboratori. Il pannello si apre ora: vedrai dove impostare i turni e come consegnare la loro agenda personale.",
            align: "start",
            side: "bottom"
          },
          onDeselected: () => { document.getElementById("tour-team-button")?.click(); }
        },
        {
          element: "#tour-team-schedule",
          waitForElement: 1000,
          popover: {
            title: "Un solo calendario, sempre aggiornato",
            description: "Turni fissi, ferie, pause e permessi sono nativi. Quando approvi un'assenza, NeatX nasconde quegli orari ai clienti: non devi aggiornare fogli o tabelle a mano.",
            align: "center",
            side: "left"
          }
        },
        {
          element: "#tour-first-staff-schedule",
          popover: {
            title: "Imposta i turni di ogni persona",
            description: "L'icona dell'orologio apre il calendario del collaboratore. Da qui imposti orari settimanali, ferie, pause e permessi parziali.",
            align: "end",
            side: "left"
          }
        },
        {
          element: "#tour-staff-link",
          popover: {
            title: "Invia la sua agenda personale",
            description: "Genera il link e invialo al dipendente una sola volta. Senza password, lui vede solo i suoi turni e clienti, chiede ferie o permessi dal telefono e puo ritirare una richiesta in attesa. Tu approvi o rifiuti da qui.",
            align: "center",
            side: "left"
          },
          onDeselected: () => { document.querySelector<HTMLButtonElement>('[aria-label="Chiudi Team"]')?.click(); }
        },
        ...installStep,
        {
          element: "#tour-dashboard-cards",
          popover: {
            title: "📊 Statistiche & Prossimo Cliente",
            description: "Tieni sempre d'occhio chi è il prossimo cliente in arrivo e il fatturato stimato del mese calcolato dinamicamente.",
            align: "center",
            side: "bottom"
          },
          onHighlightStarted: () => { document.querySelector<HTMLButtonElement>('[aria-label="Chiudi Team"]')?.click(); }
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
            title: "⭐ Aiutaci a Crescere (Recensioni)",
            description: "Ti piace NeatX? Lasciaci una recensione in questo riquadro! Le recensioni a 5 stelle verranno pubblicate sulla nostra Home Page, dando visibilità gratuita al tuo salone (inseriremo il tuo nome).",
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
