"use client";

import { useState, useCallback, Children, ReactNode, isValidElement } from "react";
import { useSearchParams } from "next/navigation";

export default function AgendaLocationTabbedArea({
  locations,
  slug,
  children,
}: {
  locations: { id: string; name: string }[];
  slug: string;
  children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const initialLocation = searchParams.get("locationId") || "all";
  const [activeLocation, setActiveLocation] = useState(initialLocation);

  const handleTabClick = useCallback(
    (locId: string) => {
      setActiveLocation(locId);
      const params = new URLSearchParams(window.location.search);
      if (locId === "all") params.delete("locationId");
      else params.set("locationId", locId);
      
      params.set("tab", "agenda");
      
      window.history.replaceState(null, "", `/t/${slug}/admin?${params.toString()}`);
    },
    [slug]
  );

  const activeChild = Children.toArray(children).find((child) => {
    if (isValidElement<{ "data-location"?: string }>(child) && child.props["data-location"] === activeLocation) {
      return true;
    }
    return false;
  });

  return (
    <>
      <div className="mb-4 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 snap-x">
        <button
          onClick={() => handleTabClick("all")}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-150 snap-center active:scale-90 ${
            activeLocation === "all"
              ? "bg-[#00b4ff] text-[#050814] border-[#00b4ff] shadow-[0_0_8px_rgba(0,180,255,0.3)]"
              : "bg-[#131c31] text-slate-400 border-[#1e2b4a] hover:border-slate-500 hover:bg-[#1a2642]"
          }`}
        >
          Tutte le sedi
        </button>
        {locations.map((loc) => (
          <button
            key={loc.id}
            onClick={() => handleTabClick(loc.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-150 snap-center active:scale-90 ${
              activeLocation === loc.id
                ? "bg-[#00b4ff] text-[#050814] border-[#00b4ff] shadow-[0_0_8px_rgba(0,180,255,0.3)]"
                : "bg-[#131c31] text-slate-400 border-[#1e2b4a] hover:border-slate-500 hover:bg-[#1a2642]"
            }`}
          >
            {loc.name}
          </button>
        ))}
      </div>
      {activeChild}
    </>
  );
}
