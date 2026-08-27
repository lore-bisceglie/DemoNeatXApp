"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { ArrowRight, CalendarPlus, MessageCircle } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./CinematicHero.module.css";

const REQUESTS = [
  { label: "Prenotazioni · 24/7", left: "60%", top: "24%" },
  { label: "Giulia sceglie Colore", left: "72%", top: "39%" },
  { label: "Domani · 10:30", left: "62%", top: "57%" },
  { label: "Pagamento online", left: "75%", top: "72%" },
];

const APPOINTMENTS = [
  ["09:00", "Marco R.", "Taglio uomo", "false"],
  ["10:30", "Giulia M.", "Colore", "true"],
  ["12:00", "Andrea F.", "Trattamento", "false"],
  ["14:30", "Luca B.", "Barba", "false"],
  ["16:00", "Sara P.", "Piega", "true"],
  ["17:30", "Matteo C.", "Taglio + barba", "false"],
];

const JOURNEY = ["Scopre", "Sceglie", "Prenota", "Tu lavori"];

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
    const disableMotion = searchParams.get("motion") === "off";
    // The cinematic hero is the product's primary introduction, so it runs by
    // default even when a desktop browser advertises reduced motion. Keep an
    // explicit URL opt-out for users who need a static presentation.
    const reducedMotion = disableMotion && !forceMotion;
    const isMobile = window.matchMedia("(max-width: 760px)").matches;
    const jump = searchParams.get("jump");

    if (!disableMotion || forceMotion) root.dataset.motion = "full";

    if (reducedMotion) {
      readyWindow.__ready = true;
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const requests = gsap.utils.toArray<HTMLElement>(`.${styles.request}`);
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
        const lines = element.querySelectorAll<HTMLElement>(`.${styles.beatLine}`);
        const supporting = element.querySelectorAll<HTMLElement>(`.${styles.eyebrow}, p, .${styles.actions}, .${styles.proofs}, .${styles.autopilotStrip}`);
        gsap.set(element, { autoAlpha: alpha, y: (1 - alpha) * 28, scale: 0.985 + alpha * 0.015 });
        lines.forEach((line, index) => {
          const lineAlpha = Math.max(0, Math.min(1, (alpha - index * 0.12) / 0.76));
          gsap.set(line, { opacity: lineAlpha, y: (1 - lineAlpha) * 34, rotateX: (1 - lineAlpha) * -8 });
        });
        const supportAlpha = Math.max(0, Math.min(1, (alpha - 0.3) / 0.7));
        gsap.set(supporting, { opacity: supportAlpha, y: (1 - supportAlpha) * 16 });
      };

      gsap.set(requests, { opacity: 0, scale: 0.7 });
      if (isMobile) {
        const mobileRequestPositions = [
          { left: "5%", top: "58%" },
          { left: "57%", top: "55%" },
          { left: "6%", top: "73%" },
          { left: "58%", top: "70%" },
        ];
        requests.forEach((request, index) => gsap.set(request, mobileRequestPositions[index]));
      }
      gsap.set(appointments, { opacity: 0, y: 18 });
      gsap.set(`.${styles.phoneSuccess}`, { opacity: 0, y: 18 });
      gsap.set(`.${styles.bookingTicket}`, { opacity: 0, scale: 0.84, y: 18 });

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.72,
          invalidateOnRefresh: true,
          onUpdate: ({ progress }) => {
            root.dataset.chapter = String(progress < .16 ? 0 : progress < .38 ? 1 : progress < .72 ? 2 : 3);
            placeBeat(beatHero, envelope(progress, 0, 0, 0.085, 0.16));
            placeBeat(beatRequests, envelope(progress, 0.14, 0.2, 0.31, 0.37));
            placeBeat(beatOrder, envelope(progress, 0.36, 0.42, 0.64, 0.72));
            placeBeat(beatFinal, envelope(progress, 0.66, 0.72, 1.08, 1.18));
          },
        },
      });

      timeline
        .to(`.${styles.scrollCue}`, { opacity: 0, duration: 0.25 }, 0.03)
        .to(`.${styles.cinematicBackdrop}`, { scale: 1.08, yPercent: -1.5, duration: 1.15 }, 0.08)
        .to(`.${styles.aurora}`, { scale: 1.4, opacity: 0.82, duration: 1.1 }, 0)
        .to(requests, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08 }, 0.38)
        .to(requests, {
          left: isMobile ? "50%" : "69%",
          top: isMobile ? "69%" : "55%",
          xPercent: -50,
          yPercent: -50,
          scale: 0.12,
          opacity: 0,
          duration: 0.72,
          stagger: 0.025,
        }, 1.02)
        .to(`.${styles.phone}`, { opacity: 1, scale: 1, rotateX: 0, rotateY: 0, duration: 0.68 }, 1.02)
        .to(`.${styles.phoneForm}`, { opacity: 0, y: -18, scale: 0.98, duration: 0.22 }, 1.58)
        .to(`.${styles.phoneSuccess}`, { opacity: 1, y: 0, scale: 1, duration: 0.32 }, 1.52)
        .to(`.${styles.phonePulse}`, { scale: 1.55, duration: 0.5 }, 1.62)
        .to(`.${styles.bookingTicket}`, { opacity: 1, scale: 1, y: 0, duration: 0.34 }, 2.04)
        .to(`.${styles.phone}`, { scale: isMobile ? 0.8 : 0.88, xPercent: isMobile ? 0 : 38, opacity: 0, duration: 0.68 }, 2.12)
        .to(`.${styles.cinematicBackdrop}`, { opacity: 0.13, scale: 1.16, duration: 0.7 }, 2.08)
        // Reveal the dashboard once at its final visual scale. The previous
        // overlapping scale(1) -> scale(.5) tweens caused a visible jump on
        // mobile (and a brief overshoot on desktop).
        .to(`.${styles.dashboard}`, {
          opacity: 1,
          top: isMobile ? "92%" : "51%",
          xPercent: isMobile ? -50 : -70,
          yPercent: isMobile ? -50 : -6,
          scale: isMobile ? 0.78 : 0.72,
          rotateX: 0,
          duration: 1.05,
        }, 2.52)
        .to(`.${styles.bookingTicket}`, { left: isMobile ? "50%" : "31%", top: isMobile ? "74%" : "68%", scale: 0.42, opacity: 0, duration: 0.66 }, 2.62)
        .to(appointments, { opacity: 1, y: 0, duration: 0.38, stagger: 0.06 }, 2.72)
        .to(`.${styles.chapterFill}`, { scaleX: 1, duration: 4.4, ease: "none" }, 0);

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
      window.history.scrollRestoration = "manual";
      window.scrollTo(0, jump !== null ? Number(jump) || 0 : 0);
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
    <section ref={rootRef} className={styles.film} data-chapter="0" aria-label="NeatX gestisce prenotazioni e agenda mentre lavori">
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
          <div className={styles.closedBadge}><span /> Prenotazioni · 24/7</div>
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
              <div><b>1</b><span>Colore · Giulia</span></div>
              <div><b>2</b><span>Domani · 10:30</span></div>
              <div><b>3</b><span>Pagamento online</span></div>
              <button>Prenota ora</button>
            </div>
            <div className={`${styles.phoneBooking} ${styles.phoneSuccess}`}>
              <span className={styles.phoneBrand}>Prenotazione salvata ✓</span>
              <strong>È già nella dashboard.</strong>
              <div><b><MessageCircle size={12} /></b><span>Promemoria programmato</span></div>
              <div><b><CalendarPlus size={12} /></b><span>Aggiungi al calendario</span></div>
            </div>
          </div>
        </div>

        <div className={styles.bookingTicket} aria-hidden="true">
          <span>Nuova prenotazione</span>
          <strong>10:30 · Giulia M.</strong>
          <small>Colore · Già pagato</small>
        </div>

        <div className={styles.dashboard} aria-hidden="true">
          <div className={styles.dashTop}>
            <div className={styles.dashBrand}>Neat<span>X</span></div>
            <div className={styles.live}>Agenda aggiornata</div>
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

        {/* A compact, phone-first version of the final dashboard scene. */}
        <div className={styles.mobileFinalPreview} aria-hidden="true">
          <div className={styles.mobileFinalHead}>
            <span className={styles.mobileFinalLive} />
            Agenda aggiornata
            <strong>oggi</strong>
          </div>
          <div className={styles.mobileFinalRow}><b>10:30</b><span>Prenotazione acquisita</span><em>✓</em></div>
          <div className={styles.mobileFinalRow}><b>16:00</b><span>Pagamento visibile</span><em>✓</em></div>
          <div className={styles.mobileFinalWait}><span>↗</span> Posto libero? Il primo in lista viene avvisato.</div>
        </div>

        <div className={`${styles.beat} ${styles.beatHero}`}>
          <div className={styles.eyebrow}><span className={styles.brandWord}>Neat<span>X</span></span> · Agenda online senza commissioni</div>
          <h1><span className={styles.beatLine}>Meno telefonate.</span><span className={`${styles.beatLine} ${styles.accent}`}>Più tempo per i clienti.</span></h1>
          <p>Prenotazioni, promemoria e lista d&apos;attesa lavorano mentre tu sei con chi hai davanti.</p>
          <div className={styles.actions}>
            <Link href="/registrazione" className={styles.primary}>Crea la tua pagina gratis <ArrowRight size={17} /></Link>
            <Link href="/t/demo-neatx" className={styles.secondary}>Guarda una demo reale</Link>
          </div>
          <div className={styles.proofs} aria-label="Condizioni della prova">
            <span>14 giorni gratis</span>
            <span>0% commissioni</span>
            <span>Nessuna carta</span>
          </div>
          <div className={styles.autopilotStrip} aria-label="Attività automatizzate da NeatX">
            <div className={styles.autopilotStatus}>
              <span className={styles.liveDot} />
              <small>NeatX è al lavoro</small>
              <strong>Tu puoi restare con i clienti</strong>
            </div>
            <div className={styles.autopilotEvent}>
              <small>Adesso</small>
              <strong>Prenotazione acquisita</strong>
              <span>Senza telefonata</span>
            </div>
            <div className={styles.autopilotEvent}>
              <small>In automatico</small>
              <strong>Promemoria programmato</strong>
              <span>Cliente già in agenda</span>
            </div>
            <div className={styles.autopilotEvent}>
              <small>Posto liberato</small>
              <strong>Lista d&apos;attesa avvisata</strong>
              <span>Nessun buco dimenticato</span>
            </div>
          </div>
        </div>

        <div className={`${styles.beat} ${styles.beatRequests}`}>
          <div className={styles.eyebrow}>Quando vuole, senza chiamare</div>
          <h2><span className={styles.beatLine}>Il cliente trova</span><span className={`${styles.beatLine} ${styles.accent}`}>il suo posto da solo.</span></h2>
          <p>Vede servizi, prezzi e disponibilità reali. Sceglie in pochi secondi, anche quando sei occupato.</p>
          <div className={styles.slideProofs}><span>Servizi sempre aggiornati</span><span>Disponibilità reale</span><span>24/7</span></div>
          <div className={styles.slideMiniCard}><span className={styles.miniDot} /><div><b>Pagina sempre aperta</b><small>Il cliente prenota anche mentre sei occupato.</small></div></div>
        </div>

        <div className={`${styles.beat} ${styles.beatOrder}`}>
          <div className={styles.eyebrow}>Una prenotazione, zero passaggi a mano</div>
          <h2><span className={styles.beatLine}>Prenota.</span><span className={`${styles.beatLine} ${styles.accent}`}>L&apos;agenda si aggiorna.</span></h2>
          <p>Orario, servizio, professionista e pagamento finiscono subito al posto giusto.</p>
          <div className={styles.slideProofs}><span>Orario bloccato</span><span>Pagamento visibile</span><span>Nessun doppio inserimento</span></div>
          <div className={styles.slideMiniCard}><span className={styles.miniDot} /><div><b>Agenda aggiornata</b><small>Nuova prenotazione acquisita <em>Nuovo</em></small></div></div>
        </div>

        <div className={`${styles.beat} ${styles.beatFinal}`}>
          <div className={styles.eyebrow}>Il risultato che conta</div>
          <h2><span className={styles.beatLine}>Meno buchi.</span><span className={`${styles.beatLine} ${styles.accent}`}>Più controllo.</span></h2>
          <p>Promemoria automatici, lista d&apos;attesa e turni del team tengono l&apos;agenda piena e aggiornata.</p>
          <div className={styles.slideProofs}><span>Promemoria automatici</span><span>Lista d&apos;attesa attiva</span><span>Team sincronizzato</span></div>
          <div className={styles.slideMiniCard}><span className={styles.miniDot} /><div><b>Un posto si libera?</b><small>NeatX avvisa automaticamente il primo in lista.</small></div></div>
          <div className={styles.actions}>
            <Link href="/registrazione" className={styles.primary}>Inizia gratis per 14 giorni <ArrowRight size={17} /></Link>
          </div>
        </div>

        <div className={styles.journey} aria-label="Le fasi dell'animazione">
          {JOURNEY.map((item, index) => <div key={item} className={styles.journeyStep}><b>0{index + 1}</b><span>{item}</span></div>)}
          <span className={styles.journeyTrack}><span className={styles.chapterFill} /></span>
        </div>
        <div className={styles.scrollCue} aria-hidden="true">
          <span className={styles.scrollCueDot} />
          Scorri per scoprire
          <b className={styles.scrollCueCount}>4 momenti</b>
        </div>
      </div>
    </section>
  );
}
