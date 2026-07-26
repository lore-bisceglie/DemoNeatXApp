"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.innerWidth < 768) return;

    let mouseX = 0;
    let mouseY = 0;
    
    // Performance: usa requestAnimationFrame e modifica gli stili direttamente
    const updateCursor = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }
      requestAnimationFrame(updateCursor);
    };
    requestAnimationFrame(updateCursor);

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === "a" ||
        target.tagName.toLowerCase() === "button" ||
        target.closest("a") ||
        target.closest("button") ||
        target.closest(".glow-card")
      ) {
        if (cursorRef.current) {
          cursorRef.current.style.width = "40px";
          cursorRef.current.style.height = "40px";
          cursorRef.current.style.backgroundColor = "rgba(0, 180, 255, 0.4)";
        }
      } else {
        if (cursorRef.current) {
          cursorRef.current.style.width = "12px";
          cursorRef.current.style.height = "12px";
          cursorRef.current.style.backgroundColor = "rgba(0, 180, 255, 1)";
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", onMouseOver);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
    };
  }, []);

  if (typeof window !== "undefined" && window.innerWidth < 768) return null;

  return (
    <>
      <style>{`
        body {
          cursor: none;
        }
        a, button, .glow-card {
          cursor: none !important;
        }
      `}</style>
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full mix-blend-screen shadow-[0_0_15px_rgba(0,180,255,0.8)]"
        style={{
          width: "12px",
          height: "12px",
          backgroundColor: "rgba(0, 180, 255, 1)",
          transition: "width 0.2s ease-out, height 0.2s ease-out, background-color 0.2s ease-out",
        }}
      />
    </>
  );
}
