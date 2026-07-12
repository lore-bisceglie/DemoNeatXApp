"use client";

import { useState, useEffect } from "react";
import { MapPin, ChevronDown } from "lucide-react";

interface LocationSelectorProps {
  locations: { id: string; name: string; slug: string; isMain: boolean; isActive: boolean }[];
  selectedLocationId: string | "all";
  onChange: (locationId: string | "all") => void;
  className?: string;
}

export default function LocationSelector({ 
  locations, 
  selectedLocationId, 
  onChange,
  className = ""
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeLocations = locations.filter(l => l.isActive);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.location-selector')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (locationId: string | "all") => {
    onChange(locationId);
    setIsOpen(false);
  };

  const selectedLocation = activeLocations.find(l => l.id === selectedLocationId);
  const selectedName = selectedLocationId === "all" 
    ? "Tutte le sedi" 
    : selectedLocation?.name || "Seleziona sede";

  return (
    <div className={`location-selector relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#131c31] border border-[#1e2b4a] rounded-xl text-white font-medium text-sm hover:border-cyan-500/50 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <MapPin size={16} className="text-cyan-400" />
        <span className="truncate max-w-[180px]">{selectedName}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-[#0b1221] border border-[#1e2b4a] rounded-xl shadow-xl shadow-cyan-900/20 overflow-hidden z-50">
          <li>
            <button
              type="button"
              onClick={() => handleSelect("all")}
              className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                selectedLocationId === "all"
                  ? "bg-cyan-500/10 text-cyan-400 font-medium"
                  : "text-slate-300 hover:bg-cyan-500/5"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Tutte le sedi
              </span>
            </button>
          </li>
          {activeLocations.map((loc) => (
            <li key={loc.id}>
              <button
                type="button"
                onClick={() => handleSelect(loc.id)}
                className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                  selectedLocationId === loc.id
                    ? "bg-cyan-500/10 text-cyan-400 font-medium"
                    : "text-slate-300 hover:bg-cyan-500/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${loc.isMain ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                  {loc.name}
                  {loc.isMain && <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">Principale</span>}
                  {!loc.isActive && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Inattiva</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}