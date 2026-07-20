"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2, Clock, Calendar, Check, AlertCircle } from "lucide-react";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  return (
    <div className="relative w-full max-w-5xl mx-auto my-24 px-4 sm:px-6">
      
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap');
        .font-handwriting { font-family: 'Caveat', cursive; }
        
        /* Realistic Paper Texture */
        .paper-texture {
          background-color: #f5f0e1;
          background-image: 
            linear-gradient(90deg, transparent 79px, #abced4 79px, #abced4 81px, transparent 81px),
            linear-gradient(#e1b382 .1em, transparent .1em);
          background-size: 100% 1.2em;
        }
        
        .coffee-stain {
          position: absolute;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: 4px solid rgba(139, 69, 19, 0.15);
          background: rgba(139, 69, 19, 0.05);
          filter: blur(2px);
          transform: rotate(-15deg);
        }
      `}} />

      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
          Scegli come lavorare
        </h2>
        <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
          Continua a impazzire con fogli volanti, oppure passa a un sistema che lavora per te anche mentre dormi.
        </p>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full h-[450px] sm:h-[550px] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-800 select-none cursor-ew-resize bg-[#050814]"
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
        <div className="absolute inset-0 w-full h-full flex flex-col pt-12 px-6 sm:px-12 bg-gradient-to-br from-[#050814] via-[#0a1128] to-[#050814]">
          
          {/* Glassmorphism Title */}
          <div className="self-end mb-8 text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md">
              <SparklesIcon className="text-blue-400 w-4 h-4" />
              <span className="text-blue-400 font-bold text-sm tracking-wide">IL METODO NEATX</span>
            </div>
          </div>
          
          {/* App UI Replica */}
          <div className="w-[85%] sm:w-[60%] ml-auto space-y-4 relative">
            
            {/* Glowing background blob */}
            <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full opacity-50 pointer-events-none" />

            {/* Premium Appointment Card 1 */}
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 rounded-2xl shadow-xl hover:bg-white/[0.05] transition-all flex items-center justify-between group">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500 rounded-l-2xl shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <div className="flex gap-4 items-center pl-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-green-500/20">
                  MR
                </div>
                <div>
                  <div className="text-white font-bold text-base">Marco Rossi</div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs mt-1 font-medium">
                    <span className="flex items-center gap-1 text-slate-300"><Clock className="w-3 h-3 text-blue-400" /> 15:30</span>
                    <span>•</span>
                    <span>Taglio + Barba VIP</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" />
                  Pagato (55€)
                </div>
              </div>
            </div>
            
            {/* Premium Appointment Card 2 */}
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5 rounded-2xl shadow-xl flex items-center justify-between">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-2xl shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              <div className="flex gap-4 items-center pl-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
                  GM
                </div>
                <div>
                  <div className="text-white font-bold text-base">Giulia M.</div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs mt-1 font-medium">
                    <span className="flex items-center gap-1 text-slate-300"><Clock className="w-3 h-3 text-blue-400" /> 16:15</span>
                    <span>•</span>
                    <span>Schiariture + Piega</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                  <Check className="w-3 h-3" />
                  Confermato
                </div>
              </div>
            </div>

            {/* Smart Empty Slot Card */}
            <div className="relative bg-white/[0.01] border border-dashed border-white/[0.1] p-4 rounded-2xl flex items-center justify-center h-20 opacity-70">
              <div className="text-slate-500 text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Slot Libero (17:30) - In attesa di prenotazioni
              </div>
            </div>
          </div>
        </div>

        {/* LEFT SIDE: BEFORE (CHAOS) - Clipped Layer */}
        <div 
          className="absolute inset-0 w-full h-full flex flex-col pointer-events-none shadow-[20px_0_30px_rgba(0,0,0,0.7)] z-10"
          style={{ 
            clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
          }}
        >
          {/* Realistic Paper Background */}
          <div className="absolute inset-0 paper-texture opacity-100" />
          
          {/* Paper Edge Shadow */}
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-[rgba(0,0,0,0.1)] to-transparent" />
          
          {/* Coffee stains */}
          <div className="coffee-stain top-10 left-[-40px]" />
          <div className="coffee-stain bottom-20 left-[200px] opacity-50 scale-75 rotate-45" />

          <div className="relative w-full h-full pt-10 px-6 sm:px-10">
            {/* Grunge Title */}
            <div className="inline-block mb-10 transform -rotate-2">
              <span className="bg-red-600 text-white font-black text-sm px-3 py-1.5 rounded-sm uppercase tracking-widest shadow-sm">
                AGENDA CARTACEA
              </span>
            </div>
            
            {/* Messy Handwriting Notes */}
            <div className="relative font-handwriting text-2xl sm:text-3xl text-blue-900/90 font-bold leading-relaxed max-w-[80%]">
              
              {/* Note 1 */}
              <div className="relative mb-6 transform rotate-1">
                <div className="absolute top-1/2 left-[-10px] right-[-10px] h-[3px] bg-red-600/80 -rotate-2 mix-blend-multiply" />
                <span className="opacity-60">15:30 - Mario (o Marco?) </span>
                <span className="block text-xl opacity-60 ml-16">taglio boh</span>
                {/* Sticky Note overlapping */}
                <div className="absolute -right-16 sm:-right-24 top-2 bg-yellow-200 shadow-md p-2 transform rotate-6 w-32 font-handwriting text-lg text-red-600 border border-yellow-300">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-3 bg-red-500/20 backdrop-blur-sm" />
                  NON SI È PRESENTATO!! 🤬
                </div>
              </div>
              
              {/* Note 2 */}
              <div className="relative mb-8 transform -rotate-1 pl-4">
                16:15 - Giulia... colore?
                <br />
                <span className="text-xl text-red-600/80">
                  (LE HO SCRITTO SU IG??? NON RISPONDE)
                </span>
              </div>

              {/* Note 3 */}
              <div className="relative transform rotate-2">
                17:30 - 
                <span className="text-3xl mx-2">SCRITTO A MATITA</span>
                <br />
                <span className="text-xl opacity-50 ml-10">...CANCELLATO! BUCO!!!</span>
                <div className="mt-2 flex items-center gap-2 text-xl text-red-600">
                  <AlertCircle className="w-5 h-5 stroke-2" /> 
                  Chiama qualcuno per favore!!
                </div>
              </div>
              
            </div>
          </div>
        </div>

        {/* SLIDER HANDLE */}
        <div 
          className="absolute top-0 bottom-0 w-1.5 bg-white cursor-ew-resize flex items-center justify-center z-20 pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.8)]"
          style={{ left: `calc(${sliderPosition}% - 3px)` }}
        >
          <div className="w-12 h-12 bg-white text-blue-600 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center font-bold text-lg tracking-tighter border-4 border-slate-100 hover:scale-110 transition-transform">
            ◀▶
          </div>
        </div>

      </div>
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
