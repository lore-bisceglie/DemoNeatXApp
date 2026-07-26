"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "right";
}

export default function ScrollReveal({ children, className = "", direction = "up" }: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      {
        threshold: 0,
        rootMargin: "0px 0px 200px 0px", // Trigger 200px prima che entri nello schermo
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    // Safety fallback: se dopo 2.5 secondi non è ancora visibile, mostralo comunque
    // Questo previene l'effetto "schermo nero" se l'observer fallisce su iOS o se l'utente scrolla velocissimo
    const fallbackTimer = setTimeout(() => {
      setIsVisible(true);
    }, 2500);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
      clearTimeout(fallbackTimer);
    };
  }, []);

  const getTransform = () => {
    if (isVisible) return "translate-y-0 translate-x-0 scale-100";
    if (direction === "up") return "translate-y-32 scale-95";
    if (direction === "left") return "-translate-x-48 scale-95";
    if (direction === "right") return "translate-x-48 scale-95";
    return "";
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${getTransform()} ${className}`}
    >
      {children}
    </div>
  );
}
