"use client";

import React from "react";
import { Mail } from "lucide-react";

type EmailFloatingBtnProps = {
  compact?: boolean;
};

export default function EmailFloatingBtn({ compact = false }: EmailFloatingBtnProps) {
  const emailUrl = "mailto:info@neatx.store";

  return (
    <a 
      href={emailUrl}
      aria-label="Invia un'email a NeatX"
      className={`flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-bold shadow-lg shadow-cyan-500/30 hover:scale-105 transition-transform cursor-pointer ${
        compact ? "h-14 w-14" : "px-5 py-3"
      }`}
    >
      <Mail size={20} />
      <span className={compact ? "sr-only" : ""}>Scrivici un'Email</span>
    </a>
  );
}
