"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./CinematicHero.module.css";

type MessageScene = {
  id: string;
  shortLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  sender: string;
  senderRole: string;
  recipient: string;
  recipientRole: string;
  flowDirection: "left" | "right";
  routeNote: string;
  recipientView: string;
  contact: string;
  contactStatus: string;
  avatar: string;
  tone: "booking" | "reminder" | "waitlist" | "moved" | "cancelled";
  messageTitle?: string;
  rows: Array<{ label?: string; value: string }>;
  link?: string;
  footer?: string;
  time: string;
  statusLabel: string;
};

function DirectionArrow({ direction }: { direction: MessageScene["flowDirection"] }) {
  const path = direction === "right"
    ? "M2 10H178M170 3l8 7-8 7"
    : "M178 10H2M10 3l-8 7 8 7";

  return (
    <svg viewBox="0 0 180 20" preserveAspectRatio="none" role="presentation">
      <path d={path} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

const MESSAGE_SCENES: MessageScene[] = [
  {
    id: "prenotazione",
    shortLabel: "Prenotazione",
    eyebrow: "Prenotazione online",
    title: "Il cliente prenota. Tu lo sai subito.",
    description: "Dopo la scelta di servizio, giorno e orario, il riepilogo arriva al salone già completo.",
    sender: "Martina R.",
    senderRole: "Cliente",
    recipient: "Salone di Elisa",
    recipientRole: "Salone",
    flowDirection: "right",
    routeNote: "Arriva già completa nella chat WhatsApp del salone.",
    recipientView: "Vista del salone",
    contact: "Martina R.",
    contactStatus: "online",
    avatar: "M",
    tone: "booking",
    messageTitle: "📅 Nuova Prenotazione!",
    rows: [
      { label: "👤 Cliente", value: "Martina R." },
      { label: "📱 Telefono", value: "333 456 7890" },
      { label: "📅 Data", value: "14/09/2026" },
      { label: "⏰ Ora", value: "10:30" },
      { label: "📌 Servizio", value: "Taglio + piega (45€)" },
      { label: "💳 Pagamento", value: "in salone" },
      { value: "❌ Per annullare in autonomia:" },
      { value: "Puoi usare questo link fino a 2 ore prima dell'appuntamento:" },
    ],
    link: "salone-di-elisa.neatx.store/cancel/…",
    footer: "Prenotazione gestita tramite NeatX. 🚀",
    time: "10:28",
    statusLabel: "RICEVUTO",
  },
  {
    id: "promemoria",
    shortLabel: "Promemoria",
    eyebrow: "Promemoria automatico",
    title: "NeatX ricorda l’appuntamento al cliente.",
    description: "Il giorno prima parte il promemoria con tutti i dettagli e il link per annullare o spostare in autonomia.",
    sender: "Salone di Elisa",
    senderRole: "Salone",
    recipient: "Martina R.",
    recipientRole: "Cliente",
    flowDirection: "left",
    routeNote: "Tu non devi scrivere, copiare o ricordarti di inviarlo.",
    recipientView: "Vista del cliente",
    contact: "Salone di Elisa",
    contactStatus: "account business",
    avatar: "S",
    tone: "reminder",
    messageTitle: "🔔 Promemoria Appuntamento!",
    rows: [
      { value: "🏢 Salone di Elisa" },
      { label: "👤 Cliente", value: "Martina R." },
      { label: "📅 Data", value: "DOMANI (14/09/2026)" },
      { label: "⏰ Ora", value: "10:30" },
      { label: "📌 Servizio", value: "Taglio + piega" },
      { value: "❌ Per annullare o spostare in autonomia:" },
      { value: "Puoi usare questo link:" },
    ],
    link: "salone-di-elisa.neatx.store/cancel/…",
    footer: "Prenotazione gestita tramite NeatX. 🚀",
    time: "18:00",
    statusLabel: "AUTOMATICO",
  },
  {
    id: "lista-attesa",
    shortLabel: "Lista d’attesa",
    eyebrow: "Lista d’attesa automatica",
    title: "Si libera un posto. NeatX avvisa chi aspetta.",
    description: "Quando qualcuno annulla, il primo cliente in lista riceve subito il collegamento per occupare lo spazio libero.",
    sender: "Salone di Elisa",
    senderRole: "Salone",
    recipient: "Giulia P.",
    recipientRole: "Cliente",
    flowDirection: "left",
    routeNote: "Il buco in agenda può riempirsi senza telefonate.",
    recipientView: "Vista del cliente",
    contact: "Salone di Elisa",
    contactStatus: "account business",
    avatar: "S",
    tone: "waitlist",
    messageTitle: "🎉 Posto liberato!",
    rows: [
      { value: "Ciao Giulia, si è liberato un posto per il 14/09/2026." },
      { value: "Prenota subito:" },
    ],
    link: "salone-di-elisa.neatx.store/prenota",
    time: "11:42",
    statusLabel: "AUTOMATICO",
  },
  {
    id: "spostamento",
    shortLabel: "Spostamento",
    eyebrow: "Spostamento autonomo",
    title: "Il cliente cambia orario. Il gestore viene avvisato.",
    description: "Il nuovo appuntamento viene registrato e al negozio arriva un messaggio chiaro con prima e dopo.",
    sender: "Martina R.",
    senderRole: "Cliente",
    recipient: "Salone di Elisa",
    recipientRole: "Salone",
    flowDirection: "right",
    routeNote: "Niente scambi infiniti per trovare un nuovo orario.",
    recipientView: "Vista del salone",
    contact: "Martina R.",
    contactStatus: "online",
    avatar: "M",
    tone: "moved",
    messageTitle: undefined,
    rows: [
      { value: "Ciao, ho spostato il mio appuntamento dal 14/09/2026 alle 10:30 al 14/09/2026 alle 16:00." },
    ],
    time: "09:12",
    statusLabel: "AGGIORNATO",
  },
  {
    id: "annullamento",
    shortLabel: "Annullamento",
    eyebrow: "Annullamento autonomo",
    title: "Il cliente annulla. Lo spazio torna disponibile.",
    description: "Il gestore riceve la conferma e lo slot può essere proposto automaticamente alla lista d’attesa.",
    sender: "Martina R.",
    senderRole: "Cliente",
    recipient: "Salone di Elisa",
    recipientRole: "Salone",
    flowDirection: "right",
    routeNote: "L’agenda si aggiorna e il posto non viene dimenticato.",
    recipientView: "Vista del salone",
    contact: "Martina R.",
    contactStatus: "online",
    avatar: "M",
    tone: "cancelled",
    messageTitle: undefined,
    rows: [
      { value: "Ciao, ho annullato il mio appuntamento del 14/09/2026 alle 10:30." },
    ],
    time: "09:16",
    statusLabel: "AGGIORNATO",
  },
];

export default function CinematicHero() {
  const rootRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<Array<HTMLDivElement | null>>([]);
  const sceneButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const progressIndicatorRef = useRef<HTMLSpanElement>(null);
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const readyWindow = window as Window & { __ready?: boolean };
    readyWindow.__ready = false;
    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const syncScenePosition = (progress: number) => {
        const maxSceneIndex = MESSAGE_SCENES.length - 1;
        const scenePosition = Math.min(maxSceneIndex, Math.max(0, progress * maxSceneIndex));
        const nearestScene = Math.round(scenePosition);
        const isMobileViewport = window.matchMedia("(max-width: 820px)").matches;
        const navigationPosition = isMobileViewport ? nearestScene : scenePosition;

        sceneRefs.current.forEach((scene, index) => {
          if (!scene) return;
          // Leave a tiny visual hand-off between consecutive messages so their
          // long headings never overlap while the scroll remains continuous.
          const intensity = isMobileViewport
            ? Number(index === nearestScene)
            : Math.max(0, 1 - Math.abs(index - scenePosition) * 2);
          scene.style.setProperty("--scene-intensity", intensity.toFixed(3));
          scene.style.setProperty("--message-intensity", index === nearestScene ? "1" : "0");
        });

        sceneButtonRefs.current.forEach((button, index) => {
          if (!button) return;
          const intensity = isMobileViewport
            ? Number(index === nearestScene)
            : Math.max(0, 1 - Math.abs(index - scenePosition));
          button.style.opacity = String(.42 + intensity * .58);
          button.style.transform = `translateY(${-3 * intensity}px)`;
        });

        if (progressIndicatorRef.current) {
          progressIndicatorRef.current.style.transform = `translate3d(${navigationPosition * 100}%, 0, 0)`;
        }

        setActiveScene((current) => (current === nearestScene ? current : nearestScene));
      };

      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        onUpdate: ({ progress }) => syncScenePosition(progress),
      });

      syncScenePosition(0);

      if (backdropRef.current) {
        gsap.to(backdropRef.current, {
          scale: 1.08,
          yPercent: -1.5,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });
      }
    }, root);

    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
    readyWindow.__ready = true;

    return () => {
      context.revert();
      readyWindow.__ready = false;
    };
  }, []);

  const goToScene = useCallback((index: number) => {
    const root = rootRef.current;
    if (!root) return;
    const availableScroll = root.offsetHeight - window.innerHeight;
    const scenePosition = index / (MESSAGE_SCENES.length - 1);
    window.scrollTo({
      top: root.offsetTop + availableScroll * scenePosition,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, []);

  return (
    <section
      ref={rootRef}
      className={styles.story}
      aria-label="I messaggi WhatsApp automatici di NeatX"
    >
      <div className={styles.stage}>
        <div ref={backdropRef} className={styles.backdrop} aria-hidden="true">
          <Image
            src="/cinematic/neatx-night-shop.png"
            alt=""
            fill
            priority
            suppressHydrationWarning
            sizes="100vw"
            className={styles.backdropImage}
          />
        </div>
        <div className={styles.ambientGlow} aria-hidden="true" />

        <div className={styles.scenes}>
          {MESSAGE_SCENES.map((item, sceneIndex) => {
            const isActive = sceneIndex === activeScene;
            return (
              <div
                key={item.id}
                ref={(element) => {
                  sceneRefs.current[sceneIndex] = element;
                }}
                className={`${styles.sceneGrid} ${isActive ? styles.sceneGridActive : ""}`}
                aria-hidden={!isActive}
              >
                <div className={styles.storyCopy}>
                  <div className={styles.sceneKicker}>
                    <span>{String(sceneIndex + 1).padStart(2, "0")}</span>
                    <i />
                    {item.eyebrow}
                  </div>

                  <h1>{item.title}</h1>
                  <p className={styles.description}>{item.description}</p>

                    <div className={styles.direction} aria-label={`${item.sender} invia a ${item.recipient}`}>
                      <div>
                      <small>{item.senderRole}</small>
                      <strong>{item.sender}</strong>
                    </div>
                    <span
                      className={`${styles.directionArrow} ${
                        item.flowDirection === "left" ? styles.directionArrowLeft : ""
                      }`}
                      aria-hidden="true"
                    >
                      <DirectionArrow direction={item.flowDirection} />
                    </span>
                    <div>
                      <small>{item.recipientRole}</small>
                      <strong>{item.recipient}</strong>
                    </div>
                  </div>

                  <p className={styles.routeNote}><span>✓</span>{item.routeNote}</p>

                  <div className={styles.actions}>
                    <Link href="/registrazione" className={styles.primary}>
                      Crea la tua pagina <ArrowRight size={17} />
                    </Link>
                    <Link href="/t/demo-neatx" className={styles.secondary}>Prova la demo</Link>
                  </div>
                </div>

                <div className={styles.messageShowcase} data-tone={item.tone}>
                  <div className={styles.viewLabel}><span />{item.recipientView}</div>
                  <div className={styles.whatsappWindow} data-tone={item.tone}>
                    <div className={styles.whatsappBar}>
                      <span className={styles.whatsappBack}>‹</span>
                      <span className={styles.whatsappAvatar}>{item.avatar}</span>
                      <span className={styles.whatsappContact}>
                        <strong>{item.contact}</strong>
                        <small>{item.contactStatus}</small>
                      </span>
                      <span className={styles.whatsappTools}>⌕&nbsp;&nbsp;⋮</span>
                    </div>
                    <div className={styles.whatsappChat}>
                      <span className={styles.whatsappDate}>OGGI</span>
                      <div className={styles.messageBubble}>
                        {item.messageTitle ? <strong>{item.messageTitle}</strong> : null}
                        {item.rows.map((row, rowIndex) => (
                          <span key={`${item.id}-${rowIndex}`}>
                            {row.label ? <b>{row.label}: </b> : null}{row.value}
                          </span>
                        ))}
                        {item.link ? <span className={styles.messageLink}>{item.link}</span> : null}
                        {item.footer ? <small>{item.footer}</small> : null}
                        <time>{item.time}</time>
                      </div>
                    </div>
                  </div>
                  <div className={styles.automationStamp}>
                    <span className={styles.stampPulse} />
                    <div><small>Flusso NeatX</small><strong>{item.sender} → {item.recipient}</strong></div>
                    <b>{item.statusLabel}</b>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <nav className={styles.sceneNav} aria-label="Seleziona il messaggio da vedere">
          <span className={styles.progressTrack}>
            <span ref={progressIndicatorRef} />
          </span>
          <div className={styles.sceneButtons}>
            {MESSAGE_SCENES.map((item, index) => (
              <button
                key={item.id}
                ref={(element) => {
                  sceneButtonRefs.current[index] = element;
                }}
                type="button"
                className={index === activeScene ? styles.activeScene : ""}
                onClick={() => goToScene(index)}
                aria-current={index === activeScene ? "step" : undefined}
              >
                <b>{String(index + 1).padStart(2, "0")}</b>
                <span>{item.shortLabel}</span>
              </button>
            ))}
          </div>
        </nav>

      </div>
    </section>
  );
}
