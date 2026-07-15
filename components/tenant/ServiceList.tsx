import React from "react";
import { Service, PublicLocation, PublicStaffMember } from "./types";

interface ServiceListProps {
  services: Service[];
  filteredServices: Service[];
  filteredStaff: PublicStaffMember[];
  selectedService: Service | null;
  selectedLocation: PublicLocation | null;
  fieldErrors: string[];
  onSelectService: (service: Service | null, staffId: string) => void;
  onClearSlots: () => void;
  onClearErrors: () => void;
}

export function ServiceList({
  services,
  filteredServices,
  filteredStaff,
  selectedService,
  selectedLocation,
  fieldErrors,
  onSelectService,
  onClearSlots,
  onClearErrors,
}: ServiceListProps) {
  if (filteredServices.length > 0) {
    return (
      <div className="mb-6">
        <label className="block text-sm font-bold mb-2 text-slate-300">
          Scegli il servizio
        </label>
        <select
          value={selectedService?.id || ""}
          onChange={(e) => {
            const s = filteredServices.find((srv) => srv.id === e.target.value);
            let defaultStaff = "any";
            if (s && filteredStaff && filteredStaff.length > 0) {
              const capableStaff = filteredStaff.find((st) =>
                st.services.some((srv) => srv.id === s.id)
              );
              if (capableStaff) defaultStaff = capableStaff.id;
            }
            onSelectService(s || null, defaultStaff);
            onClearSlots();
            onClearErrors();
          }}
          className={`w-full bg-[#131c31] border ${
            fieldErrors.includes("servizio") ? "border-red-500" : "border-[#1e2b4a]"
          } text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition appearance-none cursor-pointer`}
        >
          {filteredServices.map((srv) => {
            const slPrice = selectedLocation
              ? srv.locations?.find((l) => l.locationId === selectedLocation.id)
                  ?.price
              : null;
            return (
              <option key={srv.id} value={srv.id}>
                {srv.name} ({srv.duration} min) -{" "}
                {slPrice ?? srv.price ? `${slPrice ?? srv.price}€` : "Gratis"}
              </option>
            );
          })}
        </select>
      </div>
    );
  }

  if (services.length > 0) {
    return (
      <div className="mb-6 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-medium px-4 py-3 rounded-xl text-center">
        Nessun servizio disponibile per la sede selezionata.
      </div>
    );
  }

  return null;
}
