"use client";

import { Sparkles, Camera, Calendar, ArrowRight, Lock } from "lucide-react";

export default function SocialAITeaser() {
  return (
    <div className="py-24 bg-[#050814] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-br from-[#0b1221] to-[#0f192b] border border-purple-500/30 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-12 group">
          
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} className="animate-pulse" />
              Prossimamente nel piano Elite
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
              Il tuo <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Social Media Manager</span> con Intelligenza Artificiale.
            </h2>
            
            <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
              Dimentica lo stress di dover pensare a cosa scrivere su Instagram. Scatta una foto al tuo lavoro e lascia che NeatX scriva la caption perfetta, metta gli hashtag giusti e pubblichi per te in automatico.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
                  <Camera size={20} />
                </div>
                Caption Auto-Generate
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                <div className="bg-pink-500/20 p-2 rounded-lg text-pink-400">
                  <Calendar size={20} />
                </div>
                Calendario Pubblicazioni
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#131c31] shadow-2xl transform rotate-2 group-hover:rotate-0 transition-transform duration-500">
              <div className="p-4 bg-[#0b1221] border-b border-white/5 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Anteprima</div>
              </div>
              <div className="p-6 relative">
                {/* Simulated UI */}
                <div className="w-full h-32 bg-slate-800 rounded-xl mb-4 flex items-center justify-center border border-slate-700">
                  <span className="text-4xl">📸</span>
                </div>
                <div className="h-4 bg-slate-700 rounded-full w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-700 rounded-full w-1/2 mb-6"></div>
                
                <div className="w-full bg-gradient-to-r from-purple-600 to-pink-600 h-10 rounded-lg opacity-50 flex items-center justify-center">
                  <span className="text-white text-xs font-bold flex items-center gap-2">
                    <Sparkles size={14} /> Scrivi con AI
                  </span>
                </div>

                {/* Lock Overlay */}
                <div className="absolute inset-0 bg-[#0b1221]/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 text-white shadow-2xl shadow-purple-500/20">
                    <Lock size={32} className="mx-auto mb-2 text-purple-400" />
                    <p className="text-xs font-bold text-center uppercase tracking-widest">In Arrivo</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative floaters */}
            <div className="absolute -bottom-6 -left-6 bg-[#131c31] border border-white/10 p-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce shadow-purple-500/10">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Post Generato</p>
                <p className="text-xs text-white font-medium">Pronto per Instagram!</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
