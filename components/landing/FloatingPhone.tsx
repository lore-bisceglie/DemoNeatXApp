"use client";

import { useEffect, useRef, useState } from "react";
import IPhone17Pro from "./IPhone17Pro";

export default function FloatingPhone() {
  const allMessages = [
    "🔥 Prenotazione Taglio e Barba ricevuta",
    "💸 Hai ricevuto 50€ di acconto con Stripe",
    "✅ Appuntamento di domani confermato",
    "🚀 Zero No-Show questa settimana!",
    "📅 Nuovo appuntamento inserito a sistema",
    "💎 Venduto un pacchetto trattamenti Elite",
    "✂️ Slot vuoto delle 17:00 appena riempito",
    "📱 Nuovo cliente acquisito da Instagram",
    "📈 Incassi di oggi aggiornati: +15%",
  ];

  // Inizializza vuoto per mostrare l'arrivo progressivo
  const [messages, setMessages] = useState<{text: string, time: string}[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(containerRef.current);

    // Primo messaggio quasi subito per rompere il ghiaccio
    const initialTimer = setTimeout(() => {
      setMessages([{
        text: allMessages[0], 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
    }, 1000);

    const interval = setInterval(() => {
      // Non aggiornare se il componente non è visibile
      if (!isVisibleRef.current) return;

      setMessages(prev => {
        let nextMsgText;
        do {
          nextMsgText = allMessages[Math.floor(Math.random() * allMessages.length)];
        } while (prev.length > 0 && prev[prev.length - 1].text === nextMsgText);
        
        const newMsgObj = {
          text: nextMsgText,
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        
        const newMessages = [...prev, newMsgObj];
        if (newMessages.length > 5) newMessages.shift();
        return newMessages;
      });
    }, 2500);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className="relative mx-auto mt-16 perspective-1000 ">
      
      {/* Glow Dietro */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] md:w-[350px] h-[500px] md:h-[650px] bg-gradient-to-r from-[#00b4ff]/20 to-purple-500/20 blur-[30px] md:blur-[60px] rounded-full pointer-events-none opacity-80 animate-pulse"></div>

      <IPhone17Pro>
        {/* Screen Content - Premium Dark Simulation */}
        <div className="flex-1 bg-[#050814] flex flex-col relative w-full h-full border-x border-b border-white/5">
          
          {/* Header Premium */}
          <div className="bg-emerald-500/10  pt-12 pb-3 px-4 border-b border-emerald-500/20 z-20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[#050814] text-xs font-black shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              NX
            </div>
            <div>
              <div className="text-white font-bold text-sm">Assistente NeatX</div>
              <div className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase">online</div>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 p-3 overflow-hidden flex flex-col justify-end gap-3 relative bg-[#050814]">
            
            {/* Sfondo sfumato interno */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/5 pointer-events-none"></div>

            {messages.map((msg, idx) => (
              <div key={idx} className="relative z-10 animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className="bg-[#131c31]/90  p-3.5 rounded-2xl rounded-tl-sm shadow-[0_5px_15px_rgba(0,0,0,0.3)] max-w-[85%] border border-[#2a3a5a]">
                  <p className="text-xs text-slate-100 font-medium leading-relaxed">{msg.text}</p>
                  <div className="text-[9px] text-emerald-400 font-bold text-right mt-1.5 uppercase tracking-widest">{msg.time}</div>
                </div>
              </div>
            ))}

          </div>

          {/* Input Bar Premium */}
          <div className="bg-[#0b1221] p-3 flex items-center gap-2 relative z-20 border-t border-[#1a2642]">
            <div className="flex-1 bg-[#050814] border border-[#1a2642] rounded-full h-9 flex items-center px-4">
              <span className="text-slate-500 text-xs font-medium">Scrivi un messaggio...</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
            </div>
          </div>

        </div>
      </IPhone17Pro>
    </div>
  );
}
