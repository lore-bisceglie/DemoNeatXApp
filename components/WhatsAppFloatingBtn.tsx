"use client";

import React from "react";
import { MessageCircle } from "lucide-react";

export default function WhatsAppFloatingBtn() {
  const phoneNumber = "393480480942";
  const message = "Ciao! Vorrei avere maggiori informazioni su NeatX per la mia attività.";
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Assistenza WhatsApp"
      className="fixed bottom-6 right-4 md:right-8 z-[9999] flex items-center justify-center bg-gradient-to-r from-emerald-500 to-emerald-600 text-white w-14 h-14 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:scale-110 hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] transition-all duration-300 transform-gpu will-change-transform group"
    >
      <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500 opacity-20 group-hover:opacity-40"></div>
      <MessageCircle size={28} className="relative z-10" />
      
      {/* Tooltip per Desktop */}
      <span className="absolute right-[120%] bg-[#0b1221] border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
        Parla con noi
      </span>
    </a>
  );
}
