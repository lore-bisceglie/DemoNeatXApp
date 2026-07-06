"use client";

import React from "react";
import { MessageCircle } from "lucide-react";

export default function WhatsAppFloatingBtn() {
  const phoneNumber = "393510000000"; // Sostituisci con il numero reale
  const message = "Ciao! Vorrei avere maggiori informazioni su NeatX per la mia attività.";
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Assistenza WhatsApp"
      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3 rounded-full font-bold shadow-lg shadow-green-500/30 hover:scale-105 transition-transform cursor-pointer"
    >
      <MessageCircle size={20} />
      <span>Assistenza WhatsApp</span>
    </a>
  );
}
