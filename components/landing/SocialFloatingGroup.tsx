"use client";

import { MessageCircle, Camera, Mail } from "lucide-react";

const links = [
  {
    href: "https://wa.me/393480480942?text=Ciao!%20Vorrei%20avere%20maggiori%20informazioni%20su%20NeatX%20per%20la%20mia%20attivit%C3%A0.",
    label: "WhatsApp",
    icon: MessageCircle,
    gradient: "from-green-500 to-emerald-600",
    shadow: "shadow-green-500/25",
  },
  {
    href: "https://www.instagram.com/neatx_agenda",
    label: "Instagram",
    icon: Camera,
    gradient: "from-purple-500 to-pink-500",
    shadow: "shadow-pink-500/25",
  },
  {
    href: "mailto:info@neatx.store",
    label: "Email",
    icon: Mail,
    gradient: "from-blue-500 to-cyan-500",
    shadow: "shadow-cyan-500/25",
  },
];

export default function SocialFloatingGroup() {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 rounded-2xl bg-[#0b1221]/70 backdrop-blur-xl border border-white/5 px-3 py-2 sm:px-4 sm:py-2.5 shadow-2xl shadow-black/50">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          className={`flex items-center justify-center gap-1.5 bg-gradient-to-r ${link.gradient} text-white rounded-full font-semibold shadow-lg ${link.shadow} hover:scale-110 active:scale-95 transition-all duration-150 transform-gpu will-change-transform px-2.5 py-2 sm:px-4 sm:py-2`}
        >
          <link.icon size={15} />
          <span className="hidden sm:inline text-[11px] leading-none">{link.label}</span>
        </a>
      ))}
    </div>
  );
}
