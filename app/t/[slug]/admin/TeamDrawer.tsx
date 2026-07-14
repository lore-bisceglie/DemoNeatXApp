"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScheduleEditor from "@/components/ScheduleEditor";

type Service = {
  id: string;
  name: string;
};

type Location = {
  id: string;
  name: string;
};

type StaffMember = {
  id: string;
  name: string;
  services: Service[];
  locations: { locationId: string }[];
};

export default function TeamDrawer({
  tenantId,
  isPremium,
  allServices,
  initialStaffSheetUrl,
  locations: initialLocations,
}: {
  tenantId: string;
  isPremium: boolean;
  allServices: Service[];
  initialStaffSheetUrl: string | null;
  locations?: Location[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [staffSheetUrl, setStaffSheetUrl] = useState(initialStaffSheetUrl || "");
  const [savingUrl, setSavingUrl] = useState(false);

  const [newStaffName, setNewStaffName] = useState("");
  const [adding, setAdding] = useState(false);

  const [scheduleEditorStaff, setScheduleEditorStaff] = useState<StaffMember | null>(null);

  const [savingServices, setSavingServices] = useState(false);
  const [savingLocations, setSavingLocations] = useState(false);

  const [allLocations, setAllLocations] = useState<Location[]>(initialLocations || []);

  useEffect(() => {
    if (isOpen) {
      fetchStaff();
      if (!initialLocations) fetchLocations();
    }
  }, [isOpen, tenantId]);

  const fetchLocations = async () => {
    try {
      const res = await fetch(`/api/locations?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setAllLocations(data);
      }
    } catch (e) {
      console.error("Errore caricamento sedi:", e);
    }
  };

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
      alert("Il piano Basic include un solo collaboratore. Passa all'Elite (59€) per sbloccare i membri illimitati!");
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
      newServiceIds = currentServiceIds.filter((id) => id !== serviceId);
    } else {
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

  const handleToggleLocation = async (locationId: string) => {
    if (!selectedStaff) return;
    setSavingLocations(true);

    const currentLocationIds = selectedStaff.locations.map((l) => l.locationId);
    let newLocationIds: string[];
    if (currentLocationIds.includes(locationId)) {
      newLocationIds = currentLocationIds.filter((id) => id !== locationId);
    } else {
      newLocationIds = [...currentLocationIds, locationId];
    }

    try {
      const res = await fetch("/api/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: selectedStaff.id,
          serviceIds: selectedStaff.services.map((s) => s.id),
          locationIds: newLocationIds,
        }),
      });

      if (res.ok) {
        const updatedStaff = await res.json();
        setSelectedStaff(updatedStaff);
        setStaffList(current => current.map(s => s.id === updatedStaff.id ? updatedStaff : s));
      }
    } catch (error) {
      console.error("Errore salvataggio sedi", error);
    }
    setSavingLocations(false);
  };

  const handleSaveSheetUrl = async () => {
    setSavingUrl(true);
    try {
      const res = await fetch(`/api/tenant/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, staffSheetUrl }),
      });
      if (res.ok) {
        alert("Link salvato con successo!");
        router.refresh();
      } else {
        alert("Errore nel salvataggio del link.");
      }
    } catch (e) {
      console.error(e);
      alert("Errore di rete.");
    }
    setSavingUrl(false);
  };

  const selectedLocationIds = selectedStaff?.locations?.map((l) => l.locationId) || [];

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
              Piano Basic. Passa all'Elite (59€) per sbloccare collaboratori illimitati e la gestione avanzata dei servizi.
            </p>
          </div>
        )}

        <div className="p-4 border-b border-[#1e2b4a] bg-[#0b1221]">
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
            Link Orari (Google Sheet)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Incolla qui il link di condivisione pubblica"
              value={staffSheetUrl}
              onChange={(e) => setStaffSheetUrl(e.target.value)}
              className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm placeholder:text-slate-600"
            />
            <button
              onClick={handleSaveSheetUrl}
              disabled={savingUrl}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition disabled:opacity-50 whitespace-nowrap"
            >
              {savingUrl ? "..." : "Salva"}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            1. Crea una copia del <a href="https://docs.google.com/spreadsheets/d/1eyOExG-DexeWZeYKWk3FjNxzIQ-hITWGh7S5fR8OS10/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-medium">Foglio Turni Ufficiale</a>{" "}
            e impostalo su &quot;Chiunque abbia il link&quot;.<br/>
            2. Scrivi il <strong className="text-slate-300">nome</strong> di ogni dipendente nella colonna A.<br/>
            3. Per ogni giorno inserisci gli orari nel formato <strong className="text-slate-300">09:00-13:00, 14:00-19:00</strong> (più turni separati da virgola).<br/>
            4. Per i giorni di riposo scrivi <strong className="text-slate-300">Riposo</strong>.<br/>
            5. Incolla il link qui sopra e clicca Salva. Le ore verranno usate anche per il foglio presenze del commercialista.
          </p>
        </div>

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
                        {allLocations.length > 0 && staff.locations && staff.locations.length > 0 && (
                          <span> · {staff.locations.length} {staff.locations.length === 1 ? 'sede' : 'sedi'}</span>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => setScheduleEditorStaff(staff)}
                      className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center hover:bg-cyan-500 hover:text-white transition shrink-0 mr-1"
                      title="Turni"
                    >
                      🕐
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

                {/* SERVIZI */}
                <div className="space-y-2 relative">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Servizi</h4>
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

                {/* SEDI (multi-location) */}
                {allLocations.length > 1 && (
                  <div className="space-y-2 relative">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Sedi <span className="text-slate-600 font-normal normal-case">(seleziona dove lavora)</span>
                    </h4>
                    {savingLocations && (
                      <div className="absolute inset-0 bg-[#070b14]/50 z-10 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
                        <span className="text-cyan-400 font-bold animate-pulse">Salvataggio...</span>
                      </div>
                    )}
                    <p className="text-xs text-slate-600 mb-2 -mt-1">
                      Se nessuna sede selezionata, lavora in <strong className="text-slate-400">tutte</strong> le sedi.
                    </p>
                    {allLocations.map((loc) => {
                      const hasLocation = selectedLocationIds.includes(loc.id);
                      return (
                        <label
                          key={loc.id}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition border ${
                            hasLocation
                              ? "bg-cyan-500/10 border-cyan-500/30"
                              : "bg-[#131c31] border-[#1e2b4a] hover:border-cyan-500/30 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <span className={`font-bold text-sm ${hasLocation ? "text-cyan-300" : "text-slate-300"}`}>
                            {loc.name}
                          </span>

                          <div className={`w-12 h-6 rounded-full relative transition-colors ${hasLocation ? "bg-cyan-500" : "bg-[#1e2b4a]"}`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${hasLocation ? "left-7" : "left-1"}`} />
                          </div>

                          <input
                            type="checkbox"
                            className="hidden"
                            checked={hasLocation}
                            onChange={() => handleToggleLocation(loc.id)}
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {scheduleEditorStaff && (
        <ScheduleEditor
          staffId={scheduleEditorStaff.id}
          staffName={scheduleEditorStaff.name}
          onClose={() => setScheduleEditorStaff(null)}
        />
      )}
    </>
  );
}
