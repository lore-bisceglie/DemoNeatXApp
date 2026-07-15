import React from "react";
import { PublicLocation } from "./types";

interface LocationPickerProps {
  locations: PublicLocation[];
  selectedLocationId: string;
  onSelectLocation: (id: string) => void;
}

export function LocationPicker({
  locations,
  selectedLocationId,
  onSelectLocation,
}: LocationPickerProps) {
  if (locations.length <= 1) return null;

  return (
    <div className="mb-6">
      <label className="block text-sm font-bold mb-2 text-slate-300">
        Scegli la sede
      </label>
      <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 snap-x">
        {locations.map((loc) => (
          <button
            key={loc.id}
            type="button"
            onClick={() => onSelectLocation(loc.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-150 snap-center active:scale-95 ${
              selectedLocationId === loc.id
                ? "bg-[#00b4ff] text-[#050814] border-[#00b4ff] shadow-[0_0_15px_rgba(0,180,255,0.35)]"
                : "bg-[#131c31] text-slate-300 border-[#1e2b4a] hover:border-slate-500 hover:bg-[#1a2642] hover:scale-[1.03]"
            }`}
          >
            {loc.name}
          </button>
        ))}
      </div>
    </div>
  );
}
