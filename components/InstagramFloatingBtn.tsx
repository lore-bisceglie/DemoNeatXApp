"use client";

import React from "react";
import { Camera } from "lucide-react";

type InstagramFloatingBtnProps = {
  compact?: boolean;
};

export default function InstagramFloatingBtn({ compact = false }: InstagramFloatingBtnProps) {
  const appUrl = "instagram://user?username=neatx_agenda";
  const webUrl = "https://www.instagram.com/neatx_agenda";

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.location.assign(appUrl);
      setTimeout(() => {
        window.location.href = webUrl;
      }, 1500);
    } else {
      window.open(webUrl, "_blank");
    }
  };

  return (
    <a 
      href={compact ? appUrl : webUrl}
      onClick={handleClick}
      aria-label="Apri Instagram NeatX"
      className={`flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform cursor-pointer transform-gpu will-change-transform ${
        compact ? "h-14 w-14" : "px-5 py-3"
      }`}
    >
      <Camera size={20} />
      <span className={compact ? "sr-only" : ""}>Scrivici su IG</span>
    </a>
  );
}
