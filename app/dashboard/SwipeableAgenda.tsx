"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, TouchEvent } from "react";

export default function SwipeableAgenda({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentOffset = parseInt(searchParams.get("weekOffset") || "0", 10);
  
  // ✅ Ora tracciamo sia la X (orizzontale) che la Y (verticale)
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number, y: number } | null>(null);

  // Aumentata leggermente la tolleranza
  const minSwipeDistance = 60; 

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null); 
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    }); 
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    }); 
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    
    // ✅ IL BLOCCO DIREZIONALE: 
    // Se lo spostamento verticale (Y) è maggiore di quello orizzontale (X),
    // l'utente sta scorrendo la pagina. Abortiamo il cambio settimana!
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    const isLeftSwipe = deltaX > minSwipeDistance;
    const isRightSwipe = deltaX < -minSwipeDistance;
    
    if (isLeftSwipe || isRightSwipe) {
      const newOffset = isLeftSwipe ? currentOffset + 1 : currentOffset - 1;
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      current.set("weekOffset", newOffset.toString());
      
      const search = current.toString();
      const query = search ? `?${search}` : "";
      
      router.push(`${pathname}${query}`, { scroll: false });
    }
  };

  return (
    <div 
      onTouchStart={onTouchStart} 
      onTouchMove={onTouchMove} 
      onTouchEnd={onTouchEnd}
      className="w-full relative"
    >
      <div className="md:hidden flex justify-center w-full mb-3 text-[10px] text-slate-500 font-medium tracking-widest uppercase">
        <span className="flex items-center gap-2">← Scorri per cambiare settimana →</span>
      </div>
      
      {children}
    </div>
  );
}