"use client";

export default function TrustMarquee() {
  const items = [
    { text: "Per professionisti che lavorano su appuntamento" },
    { text: "✦" },
    { text: "Barbieri Top", highlight: "text-white" },
    { text: "✦" },
    { text: "Centri Estetici" },
    { text: "✦" },
    { text: "Studi Medici", highlight: "text-[#00b4ff]" },
    { text: "✦" },
    { text: "Consulenti" },
    { text: "✦" },
    { text: "Tattoo Studios", highlight: "text-purple-400" },
    { text: "✦" },
  ];

  const renderItems = (key: string) => (
    <div key={key} className="flex items-center gap-16 px-8 min-w-max text-slate-500 font-extrabold tracking-widest uppercase text-sm">
      {items.map((item, i) => (
        <span key={i} className={item.highlight || ""}>{item.text}</span>
      ))}
    </div>
  );

  return (
    <div className="w-full bg-[#050814] border-y border-[#1a2642] py-4 overflow-hidden relative z-10 flex">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#050814] to-transparent z-10"></div>
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#050814] to-transparent z-10"></div>
      <div className="flex animate-marquee w-max">
        {renderItems("set1")}
        {renderItems("set2")}
      </div>
    </div>
  );
}
