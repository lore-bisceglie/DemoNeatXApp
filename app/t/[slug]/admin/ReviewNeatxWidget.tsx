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
      <div className="bg-gradient-to-br from-[#0b1221] to-[#0f192b] p-6 sm:p-8 rounded-3xl shadow-2xl border border-emerald-500/30 flex flex-col items-center justify-center text-center h-full min-h-[320px]">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 text-emerald-400">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-extrabold text-white mb-2">Grazie per il feedback!</h3>
        <p className="text-sm text-slate-400 max-w-[250px]">
          {initialReview?.isApproved 
            ? "La tua recensione è pubblica sulla nostra Home Page!"
            : "Abbiamo ricevuto la tua recensione. La vedrai presto sulla nostra Home Page."}
        </p>
        <button 
          onClick={() => setIsSubmitted(false)}
          className="mt-6 text-xs text-slate-500 hover:text-white underline transition-colors"
        >
          Modifica recensione
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#0b1221] to-[#0f192b] p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/5 flex flex-col h-full min-h-[320px] relative overflow-hidden group transition-all hover:border-[#00b4ff]/30 hover:shadow-[#00b4ff]/10">
      <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-500">
        <MessageSquareQuote />
      </div>

      <h2 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2 group-hover:text-[#00b4ff] transition-colors">
        <span className="p-1.5 rounded-lg bg-[#00b4ff]/10 text-[#00b4ff] shadow-[0_0_10px_rgba(0,180,255,0.2)]">
          <Star size={14} className="fill-current" />
        </span>
        Aiutaci a crescere
      </h2>

      <p className="text-sm text-white font-medium mb-4 z-10 relative">
        Ti sta aiutando NeatX? Lascia una recensione sincera, la metteremo in vetrina!
      </p>

      <div className="flex items-center gap-1 mb-4 z-10 relative">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              size={24}
              className={`${
                star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-600"
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Es. Azzerato i no-show, agenda sempre perfetta..."
        className="w-full bg-[#030810] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#00b4ff]/50 focus:ring-1 focus:ring-[#00b4ff]/50 min-h-[80px] resize-none z-10 relative mb-4"
        maxLength={300}
      />

      {error && <p className="text-rose-400 text-xs mb-3 z-10 relative">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !text.trim()}
        className="mt-auto w-full bg-[#00b4ff]/10 hover:bg-[#00b4ff]/20 border border-[#00b4ff]/30 text-[#00b4ff] font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10 relative flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Invia Recensione"}
      </button>
    </div>
  );
}
