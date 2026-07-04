"use client";

import React from "react";
import { Camera } from "lucide-react";

export default function InstagramFloatingBtn() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Prova ad aprire l'app
      window.location.href = "instagram://user?username=neatx_agenda";
      // Fallback sul browser se l'app non è installata
      setTimeout(() => {
        window.location.href = "https://www.instagram.com/neatx_agenda";
      }, 500);
    } else {
      // Su Desktop apri normalmente
      window.open("https://www.instagram.com/neatx_agenda", "_blank");
    }
  };

  return (
    <a 
      href="https://www.instagram.com/neatx_agenda"
      onClick={handleClick}
      className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-3 rounded-full font-bold shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform cursor-pointer"
    >
      <Camera size={20} />
      Scrivici su IG
    </a>
  );
}
