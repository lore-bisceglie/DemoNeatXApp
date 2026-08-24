"use client";

export default function TrustMarquee() {
  const items = [
    { text: "Agenda per chi lavora su appuntamento", highlight: "text-slate-400" },
    { text: "✦", highlight: "text-slate-600" },
    { text: "Parrucchieri", highlight: "text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-500" },
    { text: "✦", highlight: "text-slate-600" },
    { text: "Barbieri", highlight: "text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500" },
    { text: "✦", highlight: "text-slate-600" },
    { text: "Centri estetici", highlight: "text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500" },
    { text: "✦", highlight: "text-slate-600" },
    { text: "Beauty & benessere", highlight: "text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500" },
    { text: "✦", highlight: "text-slate-600" },
    { text: "E anche altri professionisti", highlight: "text-slate-500" },
    { text: "✦", highlight: "text-slate-600" },
  ];

  const renderItems = (key: string) => (
    <div key={key} className="flex items-center gap-12 px-6 min-w-max text-slate-500 font-extrabold tracking-widest uppercase text-sm sm:text-base">
      {items.map((item, i) => (
        <span key={i} className={item.highlight || ""}>{item.text}</span>
      ))}
    </div>
  );

  return (
    <div className="w-full bg-[#050814] border-y border-[#1a2642] py-5 overflow-hidden relative z-10 flex">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050814] to-transparent z-10"></div>
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050814] to-transparent z-10 pointer-events-none"></div>
      
      <div className="flex animate-marquee hover:[animation-play-state:paused] w-max cursor-default">
        {/* Metà 1 (Scorre fino al centro) */}
        <div className="flex w-max">
          {renderItems("set1")}
          {renderItems("set2")}
        </div>
        
        {/* Metà 2 (Copia esatta per il loop) */}
        <div className="flex w-max">
          {renderItems("set3")}
          {renderItems("set4")}
        </div>
      </div>
    </div>
  );
}
