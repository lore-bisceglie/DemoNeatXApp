"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, TouchEvent } from "react";

export default function SwipeableAgenda({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentOffset = parseInt(searchParams.get("weekOffset") || "0", 10);
  
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50; 

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null); 
    setTouchStart(e.targetTouches[0].clientX); 
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX); 
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      router.push(`/dashboard?weekOffset=${currentOffset + 1}`, { scroll: false });
    }
    if (isRightSwipe) {
      router.push(`/dashboard?weekOffset=${currentOffset - 1}`, { scroll: false });
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