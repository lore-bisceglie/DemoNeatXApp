"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import styles from "./CinematicHero.module.css";

export default function CinematicHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => setPlaying(false));
  }, []);

  const updateTimeline = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    setProgress((video.currentTime / video.duration) * 100);
    setChapter(video.currentTime < 2.55 ? 0 : video.currentTime < 5.35 ? 1 : video.currentTime < 8.25 ? 2 : 3);
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    else {
      video.pause();
      setPlaying(false);
    }
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  return (
    <section className={styles.film} data-chapter={chapter} aria-label="Come NeatX gestisce una nuova prenotazione mentre il professionista lavora">
      <video
        ref={videoRef}
        className={styles.video}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/neatx-film-poster-v1.png"
        onCanPlay={() => setReady(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={updateTimeline}
      >
        <source src="/neatx-homepage-film-mobile-v1.mp4" media="(max-width: 760px)" type="video/mp4" />
        <source src="/neatx-homepage-film-v1.mp4" type="video/mp4" />
      </video>

      <div className={styles.grade} aria-hidden="true" />
      <div className={`${styles.loader} ${ready ? styles.loaderReady : ""}`} aria-hidden="true"><span /></div>

      <div className={`${styles.caption} ${styles.captionWork}`}>
        <span>La tua attenzione resta qui</span>
        <strong>Mentre ti occupi<br />di chi hai davanti…</strong>
      </div>
      <div className={`${styles.caption} ${styles.captionBooking}`}>
        <span>La pagina NeatX resta aperta</span>
        <strong>…un’altra cliente<br />prenota da sé.</strong>
      </div>

      <div className={styles.controls}>
        <button type="button" onClick={togglePlayback} aria-label={playing ? "Metti in pausa il film" : "Riproduci il film"}>
          {playing ? <Pause size={17} /> : <Play size={17} />}<span>{playing ? "Pausa" : "Riproduci"}</span>
        </button>
        <button type="button" onClick={restart} aria-label="Ricomincia il film">
          <RotateCcw size={16} /><span>Ricomincia</span>
        </button>
      </div>

      <div className={styles.progress} aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      <span className={styles.silent}>12 secondi · senza audio</span>
    </section>
  );
}
