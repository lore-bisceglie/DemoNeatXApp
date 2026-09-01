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
  recipient: string;
  routeNote: string;
  recipientView: string;
  contact: string;
  contactStatus: string;
  avatar: string;
  tone: "booking" | "reminder" | "waitlist" | "moved" | "cancelled";
  messageTitle: string;
  rows: Array<{ label?: string; value: string }>;
  link?: string;
  footer: string;
  time: string;
  statusLabel: string;
};

const MESSAGE_SCENES: MessageScene[] = [
  {
    id: "prenotazione",
    shortLabel: "Prenotazione",
    eyebrow: "Prenotazione online",
    title: "Il cliente prenota. Tu lo sai subito.",
    description: "Dopo aver scelto servizio, giorno e orario, il cliente invia al negozio un riepilogo già completo.",
    sender: "Cliente",
    recipient: "La tua attività",
    routeNote: "Arriva direttamente nella chat WhatsApp della tua attività.",
    recipientView: "Vista del gestore",
    contact: "Cliente",
    contactStatus: "online",
    avatar: "C",
    tone: "booking",
    messageTitle: "📅 Nuova prenotazione!",
    rows: [
      { label: "Cliente", value: "Il tuo cliente" },
      { label: "Giorno", value: "Il tuo giorno" },
      { label: "Orario", value: "Il tuo orario" },
      { label: "Servizio", value: "Il servizio scelto" },
      { label: "Pagamento", value: "Come preferisci" },
    ],
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
    sender: "NeatX",
    recipient: "Cliente",
    routeNote: "Tu non devi scrivere, copiare o ricordarti di inviarlo.",
    recipientView: "Vista del cliente",
    contact: "NeatX",
    contactStatus: "account business",
    avatar: "X",
    tone: "reminder",
    messageTitle: "🔔 Promemoria appuntamento!",
    rows: [
      { label: "Giorno", value: "DOMANI · il tuo giorno" },
      { label: "Orario", value: "Il tuo orario" },
      { label: "Servizio", value: "Il servizio scelto" },
      { value: "Per annullare o spostare in autonomia:" },
    ],
    link: "la-tua-attivita.neatx.store/gestisci",
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
    sender: "NeatX",
    recipient: "Cliente in attesa",
    routeNote: "Il buco in agenda può riempirsi senza telefonate.",
    recipientView: "Vista del cliente",
    contact: "NeatX",
    contactStatus: "account business",
    avatar: "X",
    tone: "waitlist",
    messageTitle: "🎉 Posto liberato!",
    rows: [
      { value: "Ciao! Si è liberato un posto per il tuo giorno." },
      { value: "Prenota subito prima che venga occupato:" },
    ],
    link: "la-tua-attivita.neatx.store/prenota",
    footer: "Avviso automatico lista d’attesa NeatX.",
    time: "14:42",
    statusLabel: "AUTOMATICO",
  },
  {
    id: "spostamento",
    shortLabel: "Spostamento",
    eyebrow: "Spostamento autonomo",
    title: "Il cliente cambia orario. Il gestore viene avvisato.",
    description: "Il nuovo appuntamento viene registrato e al negozio arriva un messaggio chiaro con prima e dopo.",
    sender: "Cliente",
    recipient: "La tua attività",
    routeNote: "Niente scambi infiniti per trovare un nuovo orario.",
    recipientView: "Vista del gestore",
    contact: "Cliente",
    contactStatus: "online",
    avatar: "C",
    tone: "moved",
    messageTitle: "Ciao, ho spostato il mio appuntamento.",
    rows: [
      { label: "Da", value: "Il tuo giorno · il tuo orario" },
      { label: "A", value: "Il tuo giorno · il nuovo orario" },
    ],
    footer: "Lo spostamento è già registrato in NeatX.",
    time: "18:06",
    statusLabel: "AGGIORNATO",
  },
  {
    id: "annullamento",
    shortLabel: "Annullamento",
    eyebrow: "Annullamento autonomo",
    title: "Il cliente annulla. Lo spazio torna disponibile.",
    description: "Il gestore riceve la conferma e lo slot può essere proposto automaticamente alla lista d’attesa.",
    sender: "Cliente",
    recipient: "La tua attività",
    routeNote: "L’agenda si aggiorna e il posto non viene dimenticato.",
    recipientView: "Vista del gestore",
    contact: "Cliente",
    contactStatus: "online",
    avatar: "C",
    tone: "cancelled",
    messageTitle: "Ciao, ho annullato il mio appuntamento.",
    rows: [{ value: "Il tuo giorno · il tuo orario" }],
    footer: "L’annullamento è già registrato in NeatX.",
    time: "18:12",
    statusLabel: "AGGIORNATO",
  },
];

export default function CinematicHero() {
  const rootRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const readyWindow = window as Window & { __ready?: boolean };
    readyWindow.__ready = false;
    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        onUpdate: ({ progress }) => {
          const nextScene = Math.min(
            MESSAGE_SCENES.length - 1,
            Math.floor(progress * MESSAGE_SCENES.length),
          );
          setActiveScene((current) => (current === nextScene ? current : nextScene));
        },
      });

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
    const scenePosition = index / MESSAGE_SCENES.length + 0.02;
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
                      <small>Parte da</small>
                      <strong>{item.sender}</strong>
                    </div>
                    <span className={styles.directionArrow}><i /><b>›</b></span>
                    <div>
                      <small>Arriva a</small>
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

                <div className={styles.messageShowcase}>
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
                        <strong>{item.messageTitle}</strong>
                        {item.rows.map((row, rowIndex) => (
                          <span key={`${item.id}-${rowIndex}`}>
                            {row.label ? <b>{row.label}: </b> : null}{row.value}
                          </span>
                        ))}
                        {item.link ? <span className={styles.messageLink}>{item.link}</span> : null}
                        <small>{item.footer}</small>
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
            <span style={{ transform: `scaleX(${(activeScene + 1) / MESSAGE_SCENES.length})` }} />
          </span>
          <div className={styles.sceneButtons}>
            {MESSAGE_SCENES.map((item, index) => (
              <button
                key={item.id}
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
