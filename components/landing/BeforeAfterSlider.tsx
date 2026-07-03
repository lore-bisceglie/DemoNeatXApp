"use client";

import { useState, useRef, useEffect } from "react";

export default function BeforeAfterSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", () => setIsDragging(false));
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", () => setIsDragging(false));
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", () => setIsDragging(false));
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", () => setIsDragging(false));
    };
  }, [isDragging]);

  return (
    <div className="relative w-full max-w-4xl mx-auto my-20">
      
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Metti ordine nel tuo business</h2>
        <p className="text-slate-400 font-medium">Spazza via il caos dell'agenda cartacea e passa al livello successivo.</p>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full h-[300px] sm:h-[450px] rounded-3xl overflow-hidden shadow-2xl border border-[#1a2642] select-none cursor-ew-resize bg-[#111]"
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleMove(e.touches[0].clientX);
        }}
      >
        {/* RIGHT SIDE: AFTER (NEATX) - Base Layer */}
        <div className="absolute inset-0 w-full h-full bg-[#050814] flex flex-col pt-10 px-8">
          <div className="text-emerald-400 font-extrabold text-lg mb-6 text-right">IL METODO NEATX ✨</div>
          
          <div className="bg-[#131c31] rounded-xl p-4 border border-[#1e2b4a] w-3/4 ml-auto mb-4 flex justify-between shadow-lg">
            <div>
              <div className="text-white font-bold text-sm">Taglio + Barba VIP</div>
              <div className="text-slate-400 text-xs mt-1">Marco R. • 15:30</div>
            </div>
            <div className="text-emerald-400 font-bold">Pagato</div>
          </div>
          
          <div className="bg-[#131c31] rounded-xl p-4 border border-[#1e2b4a] w-3/4 ml-auto mb-4 flex justify-between shadow-lg">
            <div>
              <div className="text-white font-bold text-sm">Colore</div>
              <div className="text-slate-400 text-xs mt-1">Giulia M. • 16:15</div>
            </div>
            <div className="bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-md text-xs font-bold self-center">Notificato</div>
          </div>
          
          <div className="bg-[#131c31] rounded-xl p-4 border border-[#1e2b4a] w-3/4 ml-auto flex justify-between shadow-lg opacity-50">
            <div>
              <div className="text-white font-bold text-sm">Trattamento Viso</div>
              <div className="text-slate-400 text-xs mt-1">Disponibile • 17:30</div>
            </div>
          </div>
        </div>

        {/* LEFT SIDE: BEFORE (CHAOS) - Clipped Layer */}
        <div 
          className="absolute inset-0 w-full h-full bg-white flex flex-col pt-10 px-8 pointer-events-none border-r-2 border-white shadow-[10px_0_15px_rgba(0,0,0,0.5)]"
          style={{ 
            clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, #e5e7eb 39px, #e5e7eb 40px)',
            backgroundPosition: '0 10px'
          }}
        >
          <div className="text-red-700 font-extrabold text-lg mb-6 bg-white/80 inline-block px-2">AGENDA CARTACEA ❌</div>
          
          <div className="relative font-[cursive] text-lg text-[#333] mb-3 pb-0">
            <span className="line-through decoration-red-500 decoration-4">15:30 - Mario (o Marco?) taglio boh</span>
            <div className="absolute top-1 right-2 text-red-600 text-sm font-bold rotate-12">Non si è presentato!</div>
          </div>
          
          <div className="font-[cursive] text-lg text-[#333] mb-3 pb-0 mt-[10px]">
            16:15 - Giulia colore - LE HO SCRITTO SU IG???
          </div>

          <div className="font-[cursive] text-lg text-[#333] mb-3 pb-0 text-red-500 mt-[10px]">
            17:30 - BUCO ??? Chiama qualcuno!
          </div>
        </div>

        {/* SLIDER HANDLE */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center z-20 pointer-events-none shadow-[0_0_15px_rgba(255,255,255,0.5)]"
          style={{ left: `calc(${sliderPosition}% - 2px)` }}
        >
          <div className="w-10 h-10 bg-white text-[#111] rounded-full shadow-xl flex items-center justify-center font-bold text-xs tracking-tighter">
            ◀ ▶
          </div>
        </div>

      </div>
    </div>
  );
}
