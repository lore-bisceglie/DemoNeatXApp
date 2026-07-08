"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Service = {
  id: string;
  name: string;
};

type StaffMember = {
  id: string;
  name: string;
  services: Service[];
};

export default function TeamDrawer({
  tenantId,
  isPremium,
  allServices,
}: {
  tenantId: string;
  isPremium: boolean;
  allServices: Service[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  
  // Per l'aggiunta di un nuovo membro
  const [newStaffName, setNewStaffName] = useState("");
  const [adding, setAdding] = useState(false);
  
  // Per l'aggiornamento dei servizi
  const [savingServices, setSavingServices] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStaff();
    }
  }, [isOpen, tenantId]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff?tenantId=${tenantId}`);
      const data = await res.json();
      setStaffList(data);
      if (selectedStaff) {
        const updated = data.find((s: StaffMember) => s.id === selectedStaff.id);
        if (updated) setSelectedStaff(updated);
      }
    } catch (error) {
      console.error("Errore caricamento staff", error);
    }
    setLoading(false);
  };

  const openStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    if (!isPremium && staffList.length >= 1) {
      alert("Il piano Basic include un solo collaboratore. Passa al Premium per sbloccare i membri illimitati!");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newStaffName, tenantId }),
      });
      if (res.ok) {
        setNewStaffName("");
        await fetchStaff();
        router.refresh();
      }
    } catch (error) {
      console.error("Errore aggiunta staff", error);
    }
    setAdding(false);
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo collaboratore?")) return;
    
    try {
      const res = await fetch(`/api/staff?id=${staffId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedStaff?.id === staffId) setSelectedStaff(null);
        await fetchStaff();
        router.refresh();
      }
    } catch (error) {
      console.error("Errore eliminazione staff", error);
    }
  };

  const handleToggleService = async (serviceId: string, hasService: boolean) => {
    if (!selectedStaff) return;
    setSavingServices(true);
    
    const currentServiceIds = selectedStaff.services.map((s) => s.id);
    let newServiceIds = [];
    if (hasService) {
      // Remove
      newServiceIds = currentServiceIds.filter((id) => id !== serviceId);
    } else {
      // Add
      newServiceIds = [...currentServiceIds, serviceId];
    }

    try {
      const res = await fetch("/api/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: selectedStaff.id,
          serviceIds: newServiceIds,
        }),
      });

      if (res.ok) {
        const updatedStaff = await res.json();
        setSelectedStaff(updatedStaff);
        setStaffList(current => current.map(s => s.id === updatedStaff.id ? updatedStaff : s));
      }
    } catch (error) {
      console.error("Errore salvataggio servizi", error);
    }
    setSavingServices(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-indigo-500/30 transition flex justify-center items-center gap-2 whitespace-nowrap shadow-lg snap-center"
        title="Gestione Team e Servizi"
      >
        <span>👥</span> Team
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 w-full max-w-xl bg-[#0b1221] shadow-2xl border-l border-[#1e2b4a] z-[101] transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-[#1e2b4a] flex items-center justify-between bg-[#131c31]">
          <h2 className="text-white font-extrabold text-lg flex items-center gap-2">
            <span>👥</span> Gestione Team & Servizi
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1e2b4a] text-slate-300 hover:text-white hover:bg-red-500 transition"
          >
            x
          </button>
        </div>

        {!isPremium && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 p-4">
            <p className="text-amber-200 text-sm font-medium flex items-center gap-2">
              <span>🔒</span>
              Piano Basic. Passa al Premium (59€) per sbloccare collaboratori illimitati e la gestione avanzata dei servizi.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] min-h-0 flex-1">
          {/* Lista Staff */}
          <div className="flex flex-col border-r border-[#1e2b4a]">
            <div className="p-4 border-b border-[#1e2b4a] bg-[#0b1221]">
              <form onSubmit={handleAddStaff} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome collaboratore"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  disabled={!isPremium && staffList.length >= 1}
                  className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={adding || (!isPremium && staffList.length >= 1)}
                  className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-3 py-2 rounded-xl text-sm transition disabled:opacity-50 shrink-0"
                >
                  +
                </button>
              </form>
            </div>

            <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <span className="text-2xl mb-2 animate-spin">...</span>
                </div>
              ) : staffList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <p className="text-sm">Nessun collaboratore.</p>
                </div>
              ) : (
                staffList.map((staff) => (
                  <div
                    key={staff.id}
                    className={`w-full bg-[#131c31] border rounded-xl p-3 flex items-center justify-between transition group ${
                      selectedStaff?.id === staff.id
                        ? "border-indigo-500/70 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                        : "border-[#1e2b4a] hover:border-indigo-500/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => openStaff(staff)}
                      className="flex-1 text-left min-w-0 pr-2"
                    >
                      <div className="text-white font-bold text-sm capitalize group-hover:text-indigo-400 transition-colors truncate">
                        {staff.name}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">
                        {staff.services.length} {staff.services.length === 1 ? 'servizio' : 'servizi'}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(staff.id)}
                      className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition shrink-0"
                      title="Elimina"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dettagli e Servizi */}
          <div className="p-5 overflow-y-auto custom-scrollbar bg-[#070b14]">
            {!selectedStaff ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                <span className="text-4xl mb-3">👥</span>
                <p className="text-sm font-bold">Seleziona collaboratore</p>
                <p className="text-xs mt-1">
                  Scegli chi fa cosa nel tuo salone.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-white text-2xl font-extrabold capitalize mb-1">
                    {selectedStaff.name}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Abilita i servizi che questo operatore può svolgere.
                  </p>
                </div>

                <div className="space-y-2 relative">
                  {savingServices && (
                    <div className="absolute inset-0 bg-[#070b14]/50 z-10 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
                      <span className="text-indigo-400 font-bold animate-pulse">Salvataggio...</span>
                    </div>
                  )}

                  {allServices.length === 0 ? (
                    <p className="text-slate-500 text-sm italic">Nessun servizio creato nel salone.</p>
                  ) : (
                    allServices.map((service) => {
                      const hasService = selectedStaff.services.some((s) => s.id === service.id);
                      
                      return (
                        <label
                          key={service.id}
                          className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition border ${
                            hasService
                              ? "bg-indigo-500/10 border-indigo-500/30"
                              : "bg-[#131c31] border-[#1e2b4a] hover:border-indigo-500/30 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <span className={`font-bold text-sm ${hasService ? "text-indigo-300" : "text-slate-300"}`}>
                            {service.name}
                          </span>
                          
                          {/* Toggle Switch */}
                          <div className={`w-12 h-6 rounded-full relative transition-colors ${hasService ? "bg-indigo-500" : "bg-[#1e2b4a]"}`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${hasService ? "left-7" : "left-1"}`} />
                          </div>

                          <input
                            type="checkbox"
                            className="hidden"
                            checked={hasService}
                            onChange={() => {
                              handleToggleService(service.id, hasService)
                            }}
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
