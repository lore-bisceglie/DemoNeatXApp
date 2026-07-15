import React from "react";
import { PublicStaffMember, Service } from "./types";

interface StaffPickerProps {
  isPremium: boolean;
  selectedService: Service | null;
  filteredStaff: PublicStaffMember[];
  selectedStaffId: string;
  onSelectStaff: (staffId: string) => void;
  onClearSlots: () => void;
}

export function StaffPicker({
  isPremium,
  selectedService,
  filteredStaff,
  selectedStaffId,
  onSelectStaff,
  onClearSlots,
}: StaffPickerProps) {
  if (!isPremium || !selectedService || !filteredStaff || filteredStaff.length === 0) {
    return null;
  }

  const capableStaff = filteredStaff.filter((s) =>
    s.services.some((srv) => srv.id === selectedService.id)
  );

  if (capableStaff.length === 0) return null;

  return (
    <div className="mb-6">
      <label className="block text-sm font-bold mb-2 text-slate-300">
        Scegli il professionista (Opzionale)
      </label>
      <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 snap-x">
        {capableStaff.map((staff) => (
          <button
            key={staff.id}
            type="button"
            onClick={() => {
              onSelectStaff(staff.id);
              onClearSlots();
            }}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-150 snap-center active:scale-95 ${
              selectedStaffId === staff.id
                ? "bg-[#00b4ff] text-[#050814] border-[#00b4ff] shadow-[0_0_15px_rgba(0,180,255,0.35)]"
                : "bg-[#131c31] text-slate-300 border-[#1e2b4a] hover:border-slate-500 hover:bg-[#1a2642] hover:scale-[1.03]"
            }`}
          >
            {staff.name}
          </button>
        ))}
      </div>
    </div>
  );
}
