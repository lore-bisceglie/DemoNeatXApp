"use client";

import Link from "next/link";

export default function DayNavigator({ currentDate, slug, isMultiStaff, locationId }: { currentDate: string, slug: string, isMultiStaff: boolean, locationId?: string }) {
  if (!isMultiStaff) return null; // In Single Staff mostriamo l'agenda orizzontale classica

  const d = new Date(currentDate);
  
  const prevDate = new Date(d);
  prevDate.setDate(d.getDate() - 1);
  
  const nextDate = new Date(d);
  nextDate.setDate(d.getDate() + 1);

  const format = (dateObj: Date) => dateObj.toISOString().split("T")[0];

  const dateFormatter = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  
  const formattedDate = dateFormatter.format(d);

  return (
    <div className="flex items-center justify-between bg-[#131c31] border border-[#1e2b4a] rounded-2xl p-4 mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
      <Link 
        href={`/t/${slug}/admin?date=${format(prevDate)}${locationId ? `&locationId=${locationId}` : ''}`}
        className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-[#00b4ff] hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all duration-150 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,180,255,0.15)] hover:shadow-[0_0_20px_rgba(0,180,255,0.3)] active:scale-95"
      >
        &larr; Ieri
      </Link>
      
      <div className="text-center">
        <h2 className="text-xl font-extrabold text-white capitalize">{formattedDate}</h2>
        <p className="text-xs text-cyan-500 font-bold tracking-widest uppercase mt-1">Multi-Staff Day View</p>
      </div>

      <Link 
        href={`/t/${slug}/admin?date=${format(nextDate)}${locationId ? `&locationId=${locationId}` : ''}`}
        className="px-4 py-2 bg-gradient-to-r from-[#00b4ff] to-cyan-500 hover:from-cyan-400 hover:to-cyan-300 text-white font-bold rounded-xl transition-all duration-150 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,180,255,0.15)] hover:shadow-[0_0_20px_rgba(0,180,255,0.3)] active:scale-95"
      >
        Domani &rarr;
      </Link>
    </div>
  );
}
