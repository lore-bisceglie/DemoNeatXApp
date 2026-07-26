"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "right";
}

export default function ScrollReveal({ children, className = "", direction = "up" }: ScrollRevealProps) {
  // Animazione disabilitata temporaneamente per risolvere il bug di iOS Safari
  return (
    <div className={className}>
      {children}
    </div>
  );
}
