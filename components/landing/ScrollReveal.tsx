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
          }
        },
      {
        threshold: 0,
        rootMargin: "0px 0px 50px 0px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const getTransform = () => {
    if (isVisible) return "translate-y-0 translate-x-0 scale-100";
    if (direction === "up") return "translate-y-24 scale-95";
    if (direction === "left") return "-translate-x-24 scale-95";
    if (direction === "right") return "translate-x-24 scale-95";
    return "";
  };

  return (
    <div
      ref={ref}
      style={{ overflowAnchor: 'none' }}
      className={`transition-all duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${getTransform()} ${className}`}
    >
      {children}
    </div>
  );
}
