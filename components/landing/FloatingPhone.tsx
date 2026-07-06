"use client";

import { useEffect, useState } from "react";
import IPhone17Pro from "./IPhone17Pro";

export default function FloatingPhone() {
  const allMessages = [
    "🔥 Marco R. ha prenotato Taglio e Barba",
    "💸 Giulia ha versato 50€ di anticipo",
    "✅ Appuntamento di Luca confermato",
    "🚀 Il Dott. Bianchi ha azzerato i No-Show",
    "📅 Sara ha prenotato per le 15:30",
    "💎 Anna ha acquistato un pacchetto Elite",
    "✂️ Prenotazione Veloce: Michele alle 17:00",
  ];

  // Inizializza vuoto per mostrare l'arrivo progressivo
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Primo messaggio quasi subito per rompere il ghiaccio
    const initialTimer = setTimeout(() => {
      setMessages([allMessages[0]]);
    }, 1000);

    const interval = setInterval(() => {
      setMessages(prev => {
        const nextMsg = allMessages[Math.floor(Math.random() * allMessages.length)];
        const newMessages = [...prev, nextMsg];
        if (newMessages.length > 5) newMessages.shift(); // keep only last 5
        return newMessages;
      });
    }, 2500);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative mx-auto mt-16 perspective-1000 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
      
      {/* Glow Dietro */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[650px] bg-gradient-to-r from-[#00b4ff]/20 to-purple-500/20 blur-[60px] rounded-full pointer-events-none opacity-80 animate-pulse"></div>

      <IPhone17Pro>
        {/* Screen Content - WhatsApp Simulation */}
        <div className="flex-1 bg-[#ebebeb] flex flex-col relative w-full h-full">
          
          {/* Header WhatsApp */}
          <div className="bg-[#075e54] pt-12 pb-3 px-4 shadow-md z-20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              NX
            </div>
            <div>
              <div className="text-white font-bold text-sm">Bot NeatX</div>
              <div className="text-white/70 text-[10px]">online</div>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 p-3 overflow-hidden flex flex-col justify-end gap-3 relative" style={{ backgroundColor: '#E5DDD5' }}>

            {messages.map((msg, idx) => (
              <div key={idx} className="relative z-10 animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm max-w-[85%] border border-slate-100">
                  <p className="text-xs text-slate-800 font-medium">{msg}</p>
                  <div className="text-[9px] text-slate-400 text-right mt-1">ora</div>
                </div>
              </div>
            ))}

          </div>

          {/* Input Bar WhatsApp */}
          <div className="bg-[#f0f0f0] p-2 flex items-center gap-2 relative z-20">
            <div className="flex-1 bg-white rounded-full h-8 flex items-center px-3">
              <span className="text-slate-400 text-xs">Messaggio</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#128C7E] flex items-center justify-center text-white">
              🎤
            </div>
          </div>

        </div>
      </IPhone17Pro>
    </div>
  );
}
