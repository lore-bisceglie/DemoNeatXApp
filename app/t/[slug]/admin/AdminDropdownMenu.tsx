"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  BarChart3, CalendarDays, Users, Receipt, 
  CreditCard, Gift, Settings2, ChevronDown
} from "lucide-react";
import PortalButton from "./PortalButton";
import LogoutButton from "./LogoutButton";

interface AdminDropdownMenuProps {
  slug: string;
  tenantId: string;
  hasStripe: boolean;
}

export default function AdminDropdownMenu({ slug, tenantId, hasStripe }: AdminDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getMenuItemClass = (colorClass: string) => 
    `flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${colorClass}`;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#131c31] hover:bg-slate-800/80 text-slate-300 hover:text-white font-bold px-4 py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 text-sm border border-[#2a3a5e] hover:border-slate-500/50 active:scale-95 shadow-md"
      >
        <Settings2 size={16} className="text-slate-400" /> 
        <span className="hidden sm:inline">Gestione</span>
        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[#0b1221] border border-[#1a2642] rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 space-y-1">
            
            <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Business & Crescita
            </div>
            <Link
              href={`/t/${slug}/admin/analytics`}
              onClick={() => setIsOpen(false)}
              className={getMenuItemClass("text-slate-300 hover:text-purple-300 hover:bg-purple-500/10")}
            >
              <div className="bg-purple-500/20 p-1.5 rounded-lg text-purple-400"><BarChart3 size={16} /></div> Analytics
            </Link>
            <Link
              href={`/t/${slug}/admin/referral`}
              onClick={() => setIsOpen(false)}
              className={getMenuItemClass("text-slate-300 hover:text-rose-300 hover:bg-rose-500/10")}
            >
              <div className="bg-rose-500/20 p-1.5 rounded-lg text-rose-400"><Gift size={16} /></div> Invita e Guadagna
            </Link>

            <div className="h-px bg-[#1a2642] my-2" />

            <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Esportazione Dati
            </div>
            <a
              href={`/api/export/appointments?tenantId=${tenantId}`}
              onClick={() => setIsOpen(false)}
              className={getMenuItemClass("text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10")}
            >
              <div className="bg-emerald-500/20 p-1.5 rounded-lg text-emerald-400"><CalendarDays size={16} /></div> Export Agenda
            </a>
            <a
              href={`/api/export/customers?tenantId=${tenantId}`}
              onClick={() => setIsOpen(false)}
              className={getMenuItemClass("text-slate-300 hover:text-amber-300 hover:bg-amber-500/10")}
            >
              <div className="bg-amber-500/20 p-1.5 rounded-lg text-amber-400"><Users size={16} /></div> Export Clienti
            </a>
            <a
              href={`/api/export/timesheets?tenantId=${tenantId}`}
              onClick={() => setIsOpen(false)}
              className={getMenuItemClass("text-slate-300 hover:text-blue-300 hover:bg-blue-500/10")}
            >
              <div className="bg-blue-500/20 p-1.5 rounded-lg text-blue-400"><Receipt size={16} /></div> Export Presenze
            </a>

            <div className="h-px bg-[#1a2642] my-2" />

            <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Account
            </div>
            <Link
              href={`/paywall/${slug}`}
              onClick={() => setIsOpen(false)}
              className={getMenuItemClass("text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10")}
            >
              <div className="bg-cyan-500/20 p-1.5 rounded-lg text-cyan-400"><CreditCard size={16} /></div> Piano Pagamenti
            </Link>
            
            {hasStripe && (
              <div onClick={() => setIsOpen(false)}>
                <PortalButton 
                  slug={slug} 
                  className={getMenuItemClass("text-slate-300 hover:text-teal-300 hover:bg-teal-500/10")}
                />
              </div>
            )}

            <div onClick={() => setIsOpen(false)}>
              <LogoutButton 
                slug={slug} 
                className={getMenuItemClass("text-red-400 hover:bg-red-500/10")}
              />
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
