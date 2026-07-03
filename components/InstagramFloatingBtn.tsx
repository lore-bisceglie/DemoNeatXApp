"use client";

import React from "react";

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
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
      </svg>
      Scrivici su IG
    </a>
  );
}
