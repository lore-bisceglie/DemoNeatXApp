"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  BarChart3, CalendarDays, Users, Receipt, 
  CreditCard, Gift, MoreVertical
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

  const menuItemClass = "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#131c31] hover:bg-[#1a2642] text-slate-300 font-bold px-4 py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 text-sm border border-[#1e2b4a] active:scale-95"
      >
        <MoreVertical size={16} /> <span className="hidden sm:inline">Gestione</span>
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
              className={menuItemClass + " hover:text-purple-400 hover:bg-purple-500/10"}
            >
              <BarChart3 size={16} /> Analytics
            </Link>
            <Link
              href={`/t/${slug}/admin/referral`}
              onClick={() => setIsOpen(false)}
              className={menuItemClass + " hover:text-rose-400 hover:bg-rose-500/10"}
            >
              <Gift size={16} /> Programma Invita
            </Link>

            <div className="h-px bg-[#1a2642] my-2" />

            <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Esportazione Dati
            </div>
            <a
              href={`/api/export/appointments?tenantId=${tenantId}`}
              onClick={() => setIsOpen(false)}
              className={menuItemClass + " hover:text-emerald-400 hover:bg-emerald-500/10"}
            >
              <CalendarDays size={16} /> Export Agenda
            </a>
            <a
              href={`/api/export/customers?tenantId=${tenantId}`}
              onClick={() => setIsOpen(false)}
              className={menuItemClass + " hover:text-amber-400 hover:bg-amber-500/10"}
            >
              <Users size={16} /> Export Clienti
            </a>
            <a
              href={`/api/export/timesheets?tenantId=${tenantId}`}
              onClick={() => setIsOpen(false)}
              className={menuItemClass + " hover:text-blue-400 hover:bg-blue-500/10"}
            >
              <Receipt size={16} /> Export Presenze
            </a>

            <div className="h-px bg-[#1a2642] my-2" />

            <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Account
            </div>
            <Link
              href={`/paywall/${slug}`}
              onClick={() => setIsOpen(false)}
              className={menuItemClass + " hover:text-cyan-400 hover:bg-cyan-500/10"}
            >
              <CreditCard size={16} /> Piano Pagamenti
            </Link>
            
            {hasStripe && (
              <div onClick={() => setIsOpen(false)}>
                <PortalButton 
                  slug={slug} 
                  className={menuItemClass + " hover:text-emerald-400 hover:bg-emerald-500/10"}
                />
              </div>
            )}

            <div onClick={() => setIsOpen(false)}>
              <LogoutButton 
                slug={slug} 
                className={menuItemClass + " text-red-400 hover:bg-red-500/10"}
              />
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
