"use client";

import { Sparkles, Lock, MessageCircle } from "lucide-react";

export default function SocialAIWidget({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col gap-8 items-center justify-center py-12 md:py-24">
      <div className="bg-gradient-to-br from-[#0b1221] to-[#0f192b] p-8 md:p-12 rounded-3xl shadow-2xl border border-purple-500/30 max-w-3xl w-full text-center relative overflow-hidden group">
        
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none group-hover:bg-purple-600/30 transition-colors" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 text-white shadow-2xl shadow-purple-500/20 mb-6">
            <Lock size={48} className="text-purple-400 mb-2" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm font-bold uppercase tracking-wider mb-6">
            <Sparkles size={16} className="animate-pulse" />
            Esclusiva Piano Elite
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            Il tuo <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Generatore AI</span> per Instagram.
          </h2>

          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Non sai cosa scrivere sui social? Carica la foto del tuo lavoro e la nostra Intelligenza Artificiale scriverà per te una caption perfetta e super persuasiva, già completa di hashtag, pronta per essere copiata e incollata su Instagram!
          </p>

          <a 
            href={`https://wa.me/393330000000?text=Ciao,%20vorrei%20sbloccare%20il%20modulo%20Social%20AI%20per%20il%20salone%20${slug}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 px-10 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all flex items-center justify-center gap-3 text-lg hover:scale-105 active:scale-95"
          >
            <MessageCircle size={24} /> Contattaci per lo sblocco
          </a>
          
          <p className="text-slate-500 text-sm mt-6 font-medium max-w-lg mx-auto">
            Disponibile esclusivamente con il Piano Elite. Contatta la nostra assistenza su WhatsApp per fare l'upgrade e attivarlo.
          </p>
        </div>
      </div>
    </div>
  );
}
