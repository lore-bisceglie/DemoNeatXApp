"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { ArrowRight, CalendarPlus, MessageCircle } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./CinematicHero.module.css";

const REQUESTS = [
  { label: "Sede Centrale", left: "9%", top: "25%" },
  { label: "Taglio uomo · 30 min", left: "73%", top: "28%" },
  { label: "Martedì 18 agosto", left: "5%", top: "67%" },
  { label: "Orario · 09:00", left: "77%", top: "71%" },
  { label: "Pagamento in sede", left: "68%", top: "49%" },
  { label: "Marco · opzionale", left: "16%", top: "47%" },
];

const APPOINTMENTS = [
  ["09:00", "Marco R.", "Taglio uomo", "false"],
  ["10:30", "Giulia M.", "Colore", "true"],
  ["12:00", "Andrea F.", "Trattamento", "false"],
  ["14:30", "Luca B.", "Barba", "false"],
  ["16:00", "Sara P.", "Piega", "true"],
  ["17:30", "Matteo C.", "Taglio + barba", "false"],
];

const JOURNEY = ["Attività chiusa", "Il cliente prenota", "Prenotazione salvata", "Dashboard aggiornata", "Pagamento visibile"];

const SLOTS = [
  ["09:00", "Marco R.", "Taglio uomo", "false"],
  ["10:30", "Giulia M.", "Colore", "true"],
  ["12:00", "Andrea F.", "Trattamento", "false"],
  ["14:30", "Luca B.", "Barba", "false"],
  ["16:00", "Sara P.", "Piega", "true"],
  ["17:30", "Matteo C.", "Taglio + barba", "false"],
];

export default function CinematicHero() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const readyWindow = window as Window & { __ready?: boolean };
    readyWindow.__ready = false;
    const searchParams = new URLSearchParams(window.location.search);
    const forceMotion = searchParams.get("motion") === "full";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches && !forceMotion;
    const jump = searchParams.get("jump");

    if (forceMotion) root.dataset.motion = "full";

    if (reducedMotion) {
      readyWindow.__ready = true;
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const requests = gsap.utils.toArray<HTMLElement>(`.${styles.request}`);
      const slots = gsap.utils.toArray<HTMLElement>(`.${styles.slot}`);
      const appointments = gsap.utils.toArray<HTMLElement>(`.${styles.appointment}`);
      const beatHero = root.querySelector<HTMLElement>(`.${styles.beatHero}`);
      const beatRequests = root.querySelector<HTMLElement>(`.${styles.beatRequests}`);
      const beatOrder = root.querySelector<HTMLElement>(`.${styles.beatOrder}`);
      const beatFinal = root.querySelector<HTMLElement>(`.${styles.beatFinal}`);

      const envelope = (progress: number, start: number, inAt: number, outAt: number, end: number) => {
        if (progress < start || progress > end) return 0;
        if (progress < inAt) return (progress - start) / Math.max(0.001, inAt - start);
        if (progress <= outAt) return 1;
        return 1 - (progress - outAt) / Math.max(0.001, end - outAt);
      };

      const placeBeat = (element: HTMLElement | null, alpha: number) => {
        if (!element) return;
        gsap.set(element, { autoAlpha: alpha, y: (1 - alpha) * 28 });
      };

      gsap.set(requests, { opacity: 0, scale: 0.7 });
      gsap.set(slots, { opacity: 0, scale: 0.72 });
      gsap.set(appointments, { opacity: 0, y: 18 });
      gsap.set(`.${styles.phoneSuccess}`, { opacity: 0, y: 18 });

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.72,
          invalidateOnRefresh: true,
          onUpdate: ({ progress }) => {
            root.dataset.chapter = String(progress < .13 ? 0 : progress < .26 ? 1 : progress < .44 ? 2 : progress < .78 ? 3 : 4);
            placeBeat(beatHero, envelope(progress, 0, 0, 0.075, 0.145));
            placeBeat(beatRequests, envelope(progress, 0.13, 0.18, 0.29, 0.35));
            placeBeat(beatOrder, envelope(progress, 0.38, 0.43, 0.56, 0.62));
            placeBeat(beatFinal, envelope(progress, 0.78, 0.84, 1.08, 1.18));
          },
        },
      });

      timeline
        .to(`.${styles.scrollCue}`, { opacity: 0, duration: 0.25 }, 0.03)
        .to(`.${styles.cinematicBackdrop}`, { scale: 1.09, yPercent: -1.5, duration: 0.9 }, 0.1)
        .to(`.${styles.aurora}`, { scale: 1.4, opacity: 0.82, duration: 1.1 }, 0)
        .to(requests, { opacity: 1, scale: 1, duration: 0.45, stagger: 0.07 }, 0.35)
        .to(requests, {
          left: "50%",
          top: "58%",
          xPercent: -50,
          yPercent: -50,
          scale: 0.16,
          opacity: 0,
          duration: 0.9,
          stagger: 0.025,
        }, 1.05)
        .to(`.${styles.phone}`, { opacity: 1, scale: 1, rotateX: 0, rotateY: 0, duration: 0.7 }, 1.08)
        .to(`.${styles.phoneForm}`, { opacity: 0, y: -16, duration: 0.16 }, 1.5)
        .to(`.${styles.phoneSuccess}`, { opacity: 1, y: 0, duration: 0.28 }, 1.64)
        .to(`.${styles.cinematicBackdrop}`, { opacity: 0.16, scale: 1.22, duration: 0.65 }, 1.55)
        .to(`.${styles.phonePulse}`, { scale: 2.1, duration: 0.65 }, 1.82)
        .to(`.${styles.phone}`, { scale: 7.2, opacity: 0, duration: 0.75 }, 2.1)
        .to(`.${styles.tunnel}`, { opacity: 1, duration: 0.3 }, 2.32)
        .to(`.${styles.tunnelCore}`, { rotateX: 7, scale: 1, duration: 0.8 }, 2.32)
        .to(slots, { opacity: 1, scale: 1, duration: 0.45, stagger: 0.05 }, 2.38)
        .to(slots, { y: -18, duration: 1.15, stagger: 0.035 }, 2.62)
        .to(`.${styles.tunnelCore}`, { scale: 1.08, duration: 1.35 }, 2.4)
        .to(`.${styles.agendaConfirmed}`, { opacity: 1, scale: 1, duration: 0.38 }, 3.18)
        .to(`.${styles.tunnel}`, { opacity: 0, scale: 1.16, duration: 0.55 }, 3.64)
        .to(`.${styles.dashboard}`, { opacity: 1, scale: 1, rotateX: 0, yPercent: -6, duration: 0.85 }, 3.58)
        .to(appointments, { opacity: 1, y: 0, duration: 0.38, stagger: 0.055 }, 3.78)
        .to(`.${styles.dashboard}`, { xPercent: -62, scale: 0.76, duration: 0.85 }, 4.21)
        .to(`.${styles.chapterFill}`, { scaleX: 1, duration: 5.28 }, 0);

      requests.forEach((request, index) => {
        gsap.to(request, {
          y: index % 2 ? 11 : -12,
          x: index % 3 === 0 ? 8 : -6,
          duration: 1.8 + index * 0.12,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.08,
        });
      });
    }, root);

    const finishBoot = () => {
      ScrollTrigger.refresh();
      if (jump !== null) {
        window.history.scrollRestoration = "manual";
        window.scrollTo(0, Number(jump) || 0);
        ScrollTrigger.update();
      }
      ScrollTrigger.update();
      readyWindow.__ready = true;
    };
    finishBoot();

    return () => {
      context.revert();
      readyWindow.__ready = false;
      delete root.dataset.motion;
    };
  }, []);

  return (
    <section ref={rootRef} className={styles.film} data-chapter="0" aria-label="NeatX continua a lavorare mentre la tua attività riposa">
      <div ref={stageRef} className={styles.stage}>
        <div className={styles.aurora} />
        <div className={styles.cinematicBackdrop} aria-hidden="true">
          <Image
            src="/cinematic/neatx-night-shop.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className={styles.cinematicBackdropImage}
          />
          <div className={styles.closedBadge}><span /> Chiuso · 22:47</div>
        </div>

        <div className={styles.requests} aria-hidden="true">
          {REQUESTS.map((request) => (
            <div key={request.label} className={styles.request} style={{ left: request.left, top: request.top }}>
              <span className={styles.requestDot} />
              {request.label}
            </div>
          ))}
        </div>

        <div className={styles.phone} aria-hidden="true">
          <div className={styles.phoneScreen}>
            <div className={styles.phonePulse} />
            <div className={`${styles.phoneBooking} ${styles.phoneForm}`}>
              <span className={styles.phoneBrand}>Neat<span>X</span></span>
              <strong>La tua prenotazione</strong>
              <div><b>1</b><span>Taglio uomo · Marco</span></div>
              <div><b>2</b><span>Mar 18 ago · 09:00</span></div>
              <div><b>3</b><span>Pagamento in sede</span></div>
              <button>Prenota ora</button>
            </div>
            <div className={`${styles.phoneBooking} ${styles.phoneSuccess}`}>
              <span className={styles.phoneBrand}>Prenotazione salvata ✓</span>
              <strong>È già nella dashboard.</strong>
              <div><b><MessageCircle size={12} /></b><span>Invia i dettagli al gestore</span></div>
              <div><b><CalendarPlus size={12} /></b><span>Aggiungi al calendario</span></div>
            </div>
          </div>
        </div>

        <div className={styles.tunnel} aria-hidden="true">
          <div className={styles.tunnelCore}>
            <div className={styles.agendaHead}><span>Dashboard · Martedì 18</span><strong>Agenda di Marco</strong></div>
            {SLOTS.map(([time, customer, service, paid]) => (
              <div key={time} className={`${styles.slot} ${paid === "true" ? styles.slotPaid : ""}`}>
                <time>{time} {paid === "true" ? "✓" : ""}</time><strong>{customer}</strong><span>{service}{paid === "true" ? " · Già pagato" : " · In sede"}</span>
              </div>
            ))}
            <div className={styles.agendaConfirmed}><span>✓</span> Dashboard aggiornata</div>
          </div>
        </div>

        <div className={styles.dashboard} aria-hidden="true">
          <div className={styles.dashTop}>
            <div className={styles.dashBrand}>Neat<span>X</span></div>
            <div className={styles.live}>Giornata pronta</div>
          </div>
          <div className={styles.readyResult}>
            <div className={styles.readyCheck}>✓</div>
            <div className={styles.readyCopy}>
              <span>Dashboard · Vista giornaliera</span>
              <h3>La prenotazione è già qui.</h3>
              <p>Ora, cliente e operatore sono visibili subito. Il verde indica chi ha già pagato.</p>
            </div>
            <div className={styles.readySchedule}>
              {APPOINTMENTS.map(([time, customer, service, paid]) => (
                <div key={time} className={`${styles.appointment} ${paid === "true" ? styles.appointmentPaid : ""}`}><strong>{time} {paid === "true" ? "✓" : ""}</strong><span>{customer} · {service}</span></div>
              ))}
            </div>
            <div className={styles.readyStats}><strong>6</strong><span>prenotazioni in agenda</span><strong>2</strong><span>già pagate</span></div>
          </div>
        </div>

        <div className={`${styles.beat} ${styles.beatHero}`}>
          <div className={styles.eyebrow}><span className={styles.brandWord}>Neat<span>X</span></span> · Sempre operativo</div>
          <h1>Quando stacchi,<br /><span className={styles.brandWord}>Neat<span>X</span></span> <span className={styles.accent}>continua.</span></h1>
          <p>La tua pagina prende appuntamenti anche a serranda abbassata. Tu ritrovi tutto già in agenda.</p>
          <div className={styles.actions}>
            <Link href="/registrazione" className={styles.primary}>Crea la tua pagina <ArrowRight size={17} /></Link>
            <Link href="/t/demo-neatx" className={styles.secondary}>Prova una prenotazione</Link>
          </div>
        </div>

        <div className={`${styles.beat} ${styles.beatRequests}`}>
          <div className={styles.eyebrow}>Prenotazione online</div>
          <h2>Il cliente prenota.<br /><span className={styles.accent}>In autonomia.</span></h2>
          <p>Sceglie sede, servizio, professionista, giorno, orario e modalità di pagamento.</p>
        </div>

        <div className={`${styles.beat} ${styles.beatOrder}`}>
          <div className={styles.eyebrow}>Prenotazione salvata</div>
          <h2>Un tap. È già<br /><span className={styles.accent}>in dashboard.</span></h2>
          <p>Lo slot appare con orario, cliente e servizio. Verde e spunta soltanto se è già pagato.</p>
        </div>

        <div className={`${styles.beat} ${styles.beatFinal}`}>
          <div className={styles.eyebrow}>Sempre sotto controllo</div>
          <h2>Agenda e pagamenti.<br /><span className={styles.accent}>Tutto visibile.</span></h2>
          <p>Chi arriva, a che ora e chi ha già pagato. Senza dover inserire nulla a mano.</p>
          <div className={styles.actions}>
            <Link href="/registrazione" className={styles.primary}>Inizia gratis <ArrowRight size={17} /></Link>
          </div>
        </div>

        <div className={styles.journey} aria-label="Le fasi dell'animazione">
          {JOURNEY.map((item, index) => <div key={item} className={styles.journeyStep}><b>0{index + 1}</b><span>{item}</span></div>)}
          <span className={styles.journeyTrack}><span className={styles.chapterFill} /></span>
        </div>
        <div className={styles.scrollCue} aria-hidden="true">Scorri per entrare</div>
      </div>
    </section>
  );
}
