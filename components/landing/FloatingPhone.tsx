"use client";

import { useEffect, useState } from "react";

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
    <div 
      className="relative mx-auto mt-16 perspective-1000 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500"
      style={{ width: '320px', height: '650px', flexShrink: 0 }}
    >
      
      {/* Glow Dietro */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[650px] bg-gradient-to-r from-[#00b4ff]/20 to-purple-500/20 blur-[60px] rounded-full pointer-events-none opacity-80 animate-pulse"></div>

      {/* Floating Animation Wrapper */}
      <div 
        className="w-full h-full relative"
        style={{
          animation: 'float 6s ease-in-out infinite',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(10deg) rotateY(-15deg)'
        }}
      >
        <style>{`
          @keyframes float {
            0% { transform: translateY(0px) rotateX(10deg) rotateY(-15deg); }
            50% { transform: translateY(-20px) rotateX(15deg) rotateY(-10deg); }
            100% { transform: translateY(0px) rotateX(10deg) rotateY(-15deg); }
          }
        `}</style>
        
        {/* iPhone Chassis */}
        <div className="absolute inset-0 bg-[#111] rounded-[45px] shadow-2xl border-[8px] border-[#333] overflow-hidden flex flex-col relative z-10"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 2px rgba(255,255,255,0.1)'
          }}
        >
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-50 flex items-center justify-between px-2">
            <div className="w-2 h-2 rounded-full bg-[#111]"></div>
            <div className="w-2 h-2 rounded-full bg-[#111]"></div>
          </div>

          {/* Screen Content - WhatsApp Simulation */}
          <div className="flex-1 bg-[#ebebeb] flex flex-col relative">
            
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
            <div className="flex-1 p-3 overflow-hidden flex flex-col justify-end gap-3 relative" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'cover' }}>
              
              <div className="absolute inset-0 bg-white/60 pointer-events-none"></div>

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

          {/* Reflections */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-50"></div>
        </div>
      </div>
    </div>
  );
}
