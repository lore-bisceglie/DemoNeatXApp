"use client";

import { useState } from "react";
import { MessageCircle, Camera, Mail, Check } from "lucide-react";

const WHATSAPP_NUMBER = "393480480942";
const WHATSAPP_MSG = "Ciao! Vorrei avere maggiori informazioni su NeatX per la mia attività.";
const EMAIL_ADDR = "info@neatx.store";

const links = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    href: null,
    gradient: "from-green-500 to-emerald-600",
    shadow: "shadow-green-500/25",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: Camera,
    href: "https://www.instagram.com/neatx_agenda",
    gradient: "from-purple-500 to-pink-500",
    shadow: "shadow-pink-500/25",
  },
  {
    id: "email",
    label: "Email",
    icon: Mail,
    href: null,
    gradient: "from-blue-500 to-cyan-500",
    shadow: "shadow-cyan-500/25",
  },
];

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export default function SocialFloatingGroup() {
  const [copied, setCopied] = useState(false);

  const handleClick = (id: string, e: React.MouseEvent) => {
    if (id === "whatsapp") {
      e.preventDefault();
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MSG)}`;
      window.open(url, "_blank");
      return;
    }

    if (id === "email") {
      e.preventDefault();
      if (isMobile()) {
        window.location.href = `mailto:${EMAIL_ADDR}`;
      } else {
        navigator.clipboard.writeText(EMAIL_ADDR);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 rounded-2xl bg-[#0b1221]/70 backdrop-blur-xl border border-white/5 px-3 py-2 sm:px-4 sm:py-2.5 shadow-2xl shadow-black/50">
      {links.map((link) => {
        const isActiveCopied = link.id === "email" && copied;
        const Icon = isActiveCopied ? Check : link.icon;

        return (
          <a
            key={link.id}
            href={link.href || undefined}
            target={link.href ? "_blank" : undefined}
            rel={link.href ? "noopener noreferrer" : undefined}
            onClick={(e) => handleClick(link.id, e)}
            aria-label={link.label}
            className={`flex items-center justify-center gap-1.5 bg-gradient-to-r ${link.gradient} text-white rounded-full font-semibold shadow-lg ${link.shadow} hover:scale-110 active:scale-95 transition-all duration-150 transform-gpu will-change-transform px-2.5 py-2 sm:px-4 sm:py-2`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline text-[11px] leading-none">
              {isActiveCopied ? "Copiato! ✓" : link.label}
            </span>
          </a>
        );
      })}
    </div>
  );
}
