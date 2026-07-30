"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "right";
}

export default function ScrollReveal({ children, className = "", direction = "up" }: ScrollRevealProps) {
  // Parte VISIBILE: il server manda HTML già visibile, niente buco nero
  const [isVisible, setIsVisible] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight + 100;

    if (isInViewport) {
      // Già visibile sullo schermo: resta così, nessuna animazione
      setIsVisible(true);
      setHydrated(true);
      return;
    }

    // Fuori dallo schermo: nascondi e prepara l'animazione
    setIsVisible(false);
    setHydrated(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0,
        rootMargin: "0px 0px 200px 0px",
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  const getTransform = () => {
    if (isVisible || !hydrated) return "translate-y-0 translate-x-0 scale-100";
    if (direction === "up") return "translate-y-12 scale-[0.97]";
    if (direction === "left") return "-translate-x-12 scale-[0.97]";
    if (direction === "right") return "translate-x-12 scale-[0.97]";
    return "";
  };

  return (
    <div
      ref={ref}
      style={{ overflowAnchor: 'none' }}
      className={`${hydrated ? "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" : ""} ${
        isVisible || !hydrated ? "opacity-100" : "opacity-0"
      } ${getTransform()} ${className}`}
    >
      {children}
    </div>
  );
}

