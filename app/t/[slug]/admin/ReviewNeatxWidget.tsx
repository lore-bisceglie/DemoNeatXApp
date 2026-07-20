"use client";

import { useState } from "react";
import { Star, MessageSquareQuote, CheckCircle2, Loader2 } from "lucide-react";

interface ReviewNeatxWidgetProps {
  slug: string;
  initialReview: { rating: number; text: string; isApproved: boolean } | null;
}

export default function ReviewNeatxWidget({ slug, initialReview }: ReviewNeatxWidgetProps) {
  const [rating, setRating] = useState(initialReview?.rating || 5);
  const [text, setText] = useState(initialReview?.text || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(!!initialReview);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError("Scrivi almeno due righe per aiutarci!");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/platform-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, rating, text }),
      });

      if (!res.ok) throw new Error("Errore durante il salvataggio");
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted && !isSubmitting && !error) {
    return (
      <div className="bg-gradient-to-br from-[#0b1221] to-[#0f192b] p-6 sm:p-10 rounded-3xl shadow-2xl border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group transition-all">
         <div className="flex items-center gap-6 z-10 text-center md:text-left flex-col md:flex-row">
           <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
             <CheckCircle2 size={32} />
           </div>
           <div>
             <h3 className="text-xl font-extrabold text-white mb-1">Grazie per il feedback!</h3>
             <p className="text-sm text-slate-400 max-w-md">
               {initialReview?.isApproved 
                 ? "La tua recensione è pubblica sulla nostra Home Page, grazie per il supporto!"
                 : "Abbiamo ricevuto la tua recensione. La vedrai presto sulla nostra Home Page."}
             </p>
           </div>
         </div>
        
         <button 
           onClick={() => setIsSubmitted(false)}
           className="z-10 text-xs font-bold px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors shrink-0"
         >
           Modifica recensione
         </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#0b1221] to-[#0f192b] p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/5 flex flex-col md:flex-row gap-6 lg:gap-10 relative overflow-hidden group transition-all hover:border-[#00b4ff]/30 hover:shadow-[#00b4ff]/10">
      <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-500">
        <MessageSquareQuote />
      </div>

      <div className="flex-1 z-10 flex flex-col justify-center">
        <h2 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2 group-hover:text-[#00b4ff] transition-colors">
          <span className="p-1.5 rounded-lg bg-[#00b4ff]/10 text-[#00b4ff] shadow-[0_0_10px_rgba(0,180,255,0.2)]">
            <Star size={14} className="fill-current" />
          </span>
          Aiutaci a crescere
        </h2>

        <h3 className="text-xl md:text-2xl font-extrabold text-white mb-3">Ti sta aiutando NeatX?</h3>
        <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-md">
          Lascia una recensione sincera sul tuo livello di soddisfazione e sui risultati che stai ottenendo. Le recensioni migliori verranno messe in vetrina sulla nostra Home Page ufficiale, dando anche <strong className="text-slate-300">visibilità gratuita al tuo salone</strong>!
        </p>
      </div>

      <div className="flex-1 bg-[#050812]/50 border border-white/5 rounded-2xl p-5 z-10 flex flex-col backdrop-blur-sm shadow-inner">
        <div className="flex items-center gap-2 mb-5 justify-center md:justify-start">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                size={28}
                className={`${
                  star <= rating ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" : "text-slate-600"
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Es. Da quando uso NeatX ho azzerato i no-show e l'agenda è sempre perfetta..."
          className="w-full bg-[#030810] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#00b4ff]/50 focus:ring-1 focus:ring-[#00b4ff]/50 min-h-[110px] resize-none mb-4 shadow-inner"
          maxLength={300}
        />

        {error && <p className="text-rose-400 text-xs mb-3 font-medium">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !text.trim()}
          className="mt-auto w-full bg-gradient-to-r from-[#00b4ff]/10 to-[#00b4ff]/5 hover:from-[#00b4ff]/20 hover:to-[#00b4ff]/10 border border-[#00b4ff]/30 text-[#00b4ff] font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_15px_rgba(0,180,255,0.2)]"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Pubblica Recensione"}
        </button>
      </div>
    </div>
  );
}
