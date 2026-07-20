"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquareQuote } from "lucide-react";

const FALLBACK_REVIEWS = [
  {
    name: "Marco D.",
    role: "Titolare Barber Shop",
    content: "Da quando usiamo NeatX, i telefoni hanno smesso di squillare in continuazione. I clienti prenotano da soli e io a fine mese scarico il foglio per il commercialista in un click. Fantastico.",
    stars: 5,
    highlight: "Il commercialista ringrazia"
  },
  {
    name: "Silvia R.",
    role: "Centro Estetico",
    content: "Prima usavamo un'altra app che ci tratteneva il 25% su ogni nuovo cliente. Con NeatX paghiamo solo l'abbonamento fisso ed è tutto nostro. Le caparre con Stripe hanno azzerato i clienti che non si presentano.",
    stars: 5,
    highlight: "Zero commissioni"
  },
  {
    name: "Alessandro F.",
    role: "Personal Trainer",
    content: "Molto comodo. Condivido il link nella bio di Instagram e i clienti prenotano gli slot liberi in automatico. La gestione delle disdette è facilissima.",
    stars: 5,
    highlight: "Facile da usare"
  }
];

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<any[]>(FALLBACK_REVIEWS);

  useEffect(() => {
    fetch("/api/platform-reviews")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Format DB reviews to match UI structure
          const formatted = data.map(r => ({
            name: r.tenant?.ownerName || "Titolare",
            role: r.tenant?.name || "Professionista",
            content: r.text,
            stars: r.rating,
            highlight: "Partner Verificato",
            logoUrl: r.tenant?.logoUrl
          }));
          
          // Pad with fallbacks if less than 3
          if (formatted.length < 3) {
            setReviews([...formatted, ...FALLBACK_REVIEWS.slice(0, 3 - formatted.length)]);
          } else {
            setReviews(formatted.slice(0, 6)); // Show max 6
          }
        }
      })
      .catch(() => console.error("Failed to load reviews"));
  }, []);

  return (
    <section id="testimonials" className="relative z-10 overflow-hidden bg-[#07111f] py-24">
      {/* Linee di separazione */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      
      {/* Glow background */}
      <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-emerald-300">
            <MessageSquareQuote size={13} />
            Cosa dicono di noi
          </div>
          <h2 className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Sviluppato con chi{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              lavora sul campo.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-relaxed text-slate-400">
            Dimentica le app fatte da corporazioni che non hanno mai messo piede nel tuo locale. NeatX è costruito attorno alle reali esigenze dei professionisti italiani.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {reviews.map((review, i) => (
            <div 
              key={i} 
              className="glow-card flex flex-col justify-between rounded-3xl border border-emerald-500/30 bg-[#050814] p-8 shadow-[0_0_20px_rgba(16,185,129,0.05)] transition-all duration-300 hover:border-emerald-500/60 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
            >
              <div>
                {/* Header card */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {review.logoUrl ? (
                      <img src={review.logoUrl} alt={review.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30">
                        {review.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-extrabold text-white">{review.name}</h3>
                      <p className="text-xs font-medium text-slate-500">{review.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {[...Array(review.stars)].map((_, idx) => (
                      <Star key={idx} size={12} className="fill-emerald-400 text-emerald-400" />
                    ))}
                  </div>
                </div>
                
                {/* Highlight Badge */}
                <div className="mb-4 inline-block rounded-lg bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 border border-white/10">
                  {review.highlight}
                </div>
                
                {/* Recensione testo */}
                <p className="text-sm leading-relaxed text-slate-400 italic">
                  "{review.content}"
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action fiduciaria */}
        <div className="mt-12 text-center">
          <p className="text-sm font-medium text-slate-500">
            Entra anche tu a far parte dei professionisti che hanno scelto l'indipendenza.
          </p>
        </div>
      </div>
    </section>
  );
}
