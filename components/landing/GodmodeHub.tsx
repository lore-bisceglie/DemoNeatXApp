"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, LayoutDashboard, Crown, LogOut, Bot } from "lucide-react";

export default function GodmodeHub() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Controllo se esiste il cookie segreto
    if (document.cookie.includes("superadmin_god_eye=true")) {
      setIsVisible(true);
    }
  }, []);

  const handleLogout = () => {
    // Elimina il cookie settando una data passata
    document.cookie = "superadmin_god_eye=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setIsVisible(false);
    setIsOpen(false);
  };

  if (!isVisible || pathname?.startsWith("/staff/")) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 w-56 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="px-4 py-3 bg-indigo-500/10 border-b border-indigo-500/20">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Crown size={14} /> Godmode Hub
            </p>
          </div>
          <div className="flex flex-col py-2">
            <Link 
              href="/superadmin" 
              className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-3 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Crown size={16} className="text-indigo-400" />
              Pannello SuperAdmin
            </Link>
            <Link 
              href="/superadmin/ai" 
              className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-3 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Bot size={16} className="text-blue-400" />
              Cervello AI (Chatbot)
            </Link>
            <Link 
              href="/demo" 
              className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-3 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <LayoutDashboard size={16} className="text-emerald-400" />
              Negozio Demo
            </Link>
            <div className="h-px bg-slate-800 my-1"></div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2.5 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-3 transition-colors text-left w-full"
            >
              <LogOut size={16} />
              Nascondi Menu
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform hover:scale-110 active:scale-95"
      >
        <ShieldAlert size={24} />
      </button>
    </div>
  );
}
