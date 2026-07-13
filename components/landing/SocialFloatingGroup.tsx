"use client";

import { useState } from "react";
import { MessageCircle, Camera, Mail, Check, X, Send } from "lucide-react";

const EMAIL_ADDR = "info@neatx.store";

const links = [
  {
    id: "contact",
    label: "Contattaci",
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
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleClick = (id: string, e: React.MouseEvent) => {
    if (id === "contact") {
      e.preventDefault();
      setShowModal(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSent(true);
      setForm({ name: "", email: "", message: "" });
      setTimeout(() => { setShowModal(false); setSent(false); }, 1500);
    } catch {
      // silent
    }
  };

  return (
    <>
      {/* Mobile: pill verticale larga quanto il mappamondo */}
      <div className="sm:hidden flex flex-col items-center gap-1.5 rounded-2xl bg-[#0b1221]/70 backdrop-blur-xl border border-white/5 px-1.5 py-2 shadow-2xl shadow-black/50">
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
              className={`flex items-center justify-center bg-gradient-to-r ${link.gradient} text-white rounded-full shadow-lg ${link.shadow} hover:scale-110 active:scale-95 transition-all duration-150 transform-gpu will-change-transform w-8 h-8`}
            >
              <Icon size={13} />
            </a>
          );
        })}
      </div>

      {/* Desktop: 3 cerchi separati (stessa misura del mappamondo) con tooltip hover */}
      <div className="hidden sm:flex flex-col items-center gap-2">
        {links.map((link) => {
          const isActiveCopied = link.id === "email" && copied;
          const Icon = isActiveCopied ? Check : link.icon;

          return (
            <div key={link.id} className="relative group">
              <a
                href={link.href || undefined}
                target={link.href ? "_blank" : undefined}
                rel={link.href ? "noopener noreferrer" : undefined}
                onClick={(e) => handleClick(link.id, e)}
                aria-label={link.label}
                className={`flex items-center justify-center bg-gradient-to-r ${link.gradient} text-white rounded-full shadow-lg ${link.shadow} hover:scale-110 active:scale-95 transition-all duration-150 transform-gpu will-change-transform w-11 h-11`}
              >
                <Icon size={18} />
              </a>
              <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#0b1221]/90 backdrop-blur-md border border-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
                {isActiveCopied ? "Copiato! ✓" : link.label}
              </span>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[10000] flex items-start sm:items-center justify-center p-4 pt-[12vh] sm:pt-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0b1221] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-white font-extrabold text-lg mb-1">Contattaci</h3>
            <p className="text-slate-400 text-xs mb-5">
              Ti risponderemo via email al più presto.
            </p>

            {sent ? (
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold py-8">
                <Check size={20} /> Richiesta inviata ✓
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  required
                  placeholder="Il tuo nome"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00b4ff]"
                />
                <input
                  required
                  type="email"
                  placeholder="La tua email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00b4ff]"
                />
                <textarea
                  required
                  rows={3}
                  placeholder="Il tuo messaggio"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00b4ff] resize-none"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl px-4 py-2.5 font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-green-500/25"
                >
                  <Send size={15} /> Invia richiesta
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
