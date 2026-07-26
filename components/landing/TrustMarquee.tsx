"use client";

export default function TrustMarquee() {
  const items = [
    { text: "Per professionisti che lavorano su appuntamento", highlight: "text-slate-400" },
    { text: "✦", highlight: "text-slate-600" },
    { text: "Barbieri Top", highlight: "text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500" },
    { text: "✦", highlight: "text-slate-600" },
    { text: "Centri Estetici", highlight: "text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500" },
    { text: "✦", highlight: "text-slate-600" },
    { text: "Studi Medici", highlight: "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500" },
    { text: "✦", highlight: "text-slate-600" },
    { text: "Personal Trainer", highlight: "text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500" },
    { text: "✦", highlight: "text-slate-600" },
    { text: "Parrucchieri", highlight: "text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-500" },
    { text: "✦", highlight: "text-slate-600" },
    { text: "Consulenti", highlight: "text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500" },
    { text: "✦", highlight: "text-slate-600" },
    { text: "Psicologi", highlight: "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500" },
    { text: "✦", highlight: "text-slate-600" },
    { text: "Tattoo Studios", highlight: "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500" },
    { text: "✦", highlight: "text-slate-600" },
    { text: "Make-up Artist", highlight: "text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-pink-500" },
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
          {renderItems("set3")}
        </div>
        
        {/* Metà 2 (Copia esatta per il loop) */}
        <div className="flex w-max">
          {renderItems("set4")}
          {renderItems("set5")}
          {renderItems("set6")}
        </div>
      </div>
    </div>
  );
}
