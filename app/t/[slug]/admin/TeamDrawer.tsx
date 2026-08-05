"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Trash2, Users, X } from "lucide-react";
import ScheduleEditor from "@/components/ScheduleEditor";
import StaffAccessControls from "./StaffAccessControls";
import StaffRequestsPanel from "./StaffRequestsPanel";

type Service = { id: string; name: string };
type Location = { id: string; name: string };
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
  locations: initialLocations = [],
  slug,
}: {
  tenantId: string;
  isPremium: boolean;
  plan?: string;
  allServices: Service[];
  locations?: Location[];
  slug?: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const selectedStaffRef = useRef<StaffMember | null>(null);
  const [scheduleEditorStaff, setScheduleEditorStaff] = useState<StaffMember | null>(null);
  const [newStaffName, setNewStaffName] = useState("");
  const [adding, setAdding] = useState(false);
  const [savingServices, setSavingServices] = useState(false);
  const [savingLocations, setSavingLocations] = useState(false);
  const [allLocations, setAllLocations] = useState<Location[]>(initialLocations);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  useEffect(() => { selectedStaffRef.current = selectedStaff; }, [selectedStaff]);
  useEffect(() => {
    if (!isOpen) return;
    void fetchStaff();
    if (initialLocations.length === 0) void fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tenantId]);

  useEffect(() => {
    const loadPendingCount = async () => {
      const response = await fetch(`/api/staff/requests?tenantId=${encodeURIComponent(tenantId)}&status=pending`);
      if (response.ok) setPendingRequestCount(((await response.json()).requests || []).length);
    };
    void loadPendingCount();
    const timer = window.setInterval(() => void loadPendingCount(), 30000);
    return () => window.clearInterval(timer);
  }, [tenantId]);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    window.setTimeout(() => setNotification(null), 4500);
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/staff?tenantId=${tenantId}`);
      if (!response.ok) throw new Error("staff");
      const data = await response.json() as StaffMember[];
      setStaffList(data);
      const current = selectedStaffRef.current;
      if (current) setSelectedStaff(data.find((staff) => staff.id === current.id) || null);
      else setSelectedStaff(data[0] || null);
    } catch { showNotification("Impossibile caricare il team.", "error"); }
    finally { setLoading(false); }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch(`/api/locations?tenantId=${tenantId}`);
      if (response.ok) setAllLocations(await response.json() as Location[]);
    } catch { showNotification("Impossibile caricare le sedi.", "error"); }
  };

  const handleAddStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newStaffName.trim()) return;
    if (!isPremium && staffList.length >= 1) {
      showNotification("Il tuo piano include un solo collaboratore. Passa a Pro o Elite.", "error");
      return;
    }
    setAdding(true);
    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newStaffName.trim(), tenantId }),
      });
      if (!response.ok) throw new Error("add");
      setNewStaffName("");
      await fetchStaff();
      router.refresh();
    } catch { showNotification("Errore durante l'aggiunta del collaboratore.", "error"); }
    finally { setAdding(false); }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo collaboratore?")) return;
    const response = await fetch(`/api/staff?id=${staffId}`, { method: "DELETE" });
    if (!response.ok) { showNotification("Errore durante l'eliminazione.", "error"); return; }
    if (selectedStaff?.id === staffId) setSelectedStaff(null);
    await fetchStaff();
    router.refresh();
  };

  const updateStaffRelations = async (serviceIds: string[], locationIds: string[], kind: "services" | "locations") => {
    const currentStaff = selectedStaffRef.current;
    if (!currentStaff) return;
    if (kind === "services") setSavingServices(true); else setSavingLocations(true);
    try {
      const response = await fetch("/api/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: currentStaff.id, serviceIds, locationIds }),
      });
      if (!response.ok) throw new Error("update");
      const serverStaff = await response.json() as StaffMember;
      selectedStaffRef.current = serverStaff;
      setSelectedStaff(serverStaff);
      setStaffList((items) => items.map((item) => item.id === serverStaff.id ? serverStaff : item));
    } catch { showNotification("Errore durante il salvataggio.", "error"); }
    finally { if (kind === "services") setSavingServices(false); else setSavingLocations(false); }
  };

  const toggleService = (serviceId: string) => {
    const staff = selectedStaffRef.current;
    if (!staff) return;
    const serviceIds = staff.services.some((service) => service.id === serviceId)
      ? staff.services.filter((service) => service.id !== serviceId).map((service) => service.id)
      : [...staff.services.map((service) => service.id), serviceId];
    void updateStaffRelations(serviceIds, staff.locations.map((location) => location.locationId), "services");
  };

  const toggleLocation = (locationId: string) => {
    const staff = selectedStaffRef.current;
    if (!staff) return;
    const current = staff.locations.map((location) => location.locationId);
    const locationIds = current.includes(locationId) ? current.filter((id) => id !== locationId) : [...current, locationId];
    void updateStaffRelations(staff.services.map((service) => service.id), locationIds, "locations");
  };

  const selectedLocationIds = selectedStaff?.locations.map((location) => location.locationId) || [];

  return <>
    <button id="tour-team-button" onClick={() => setIsOpen(true)} className="relative flex items-center justify-center gap-2 rounded-xl border border-[#1e2b4a] bg-[#131c31] px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300">
      <Users size={16} className="text-purple-400" /> Team {pendingRequestCount > 0 && <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-black text-[#211500]">{pendingRequestCount}</span>}
    </button>

    {isOpen && <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />}
    <aside id="tour-team-drawer" className={`fixed inset-y-0 right-0 z-[101] flex w-full max-w-xl transform flex-col border-l border-[#1e2b4a] bg-[#0b1221] shadow-2xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
      <header className="relative flex items-center justify-between border-b border-[#1e2b4a] bg-[#131c31] p-5">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-white"><Users size={19} className="text-purple-400" /> Gestione Team & Servizi</h2>
        <button onClick={() => setIsOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e2b4a] text-slate-300 transition hover:bg-red-500 hover:text-white" aria-label="Chiudi Team"><X size={16} /></button>
        {notification && <div className={`absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 rounded-xl border px-4 py-2 text-sm font-medium shadow-xl ${notification.type === "success" ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300" : "border-red-500/50 bg-red-500/20 text-red-300"}`}>{notification.message}</div>}
      </header>

      {!isPremium && <div className="border-b border-amber-500/20 bg-amber-500/10 p-4 text-sm font-medium text-amber-200">Il tuo piano include un solo collaboratore. <a href={slug ? `/paywall/${slug}` : "#"} className="text-amber-400 underline">Passa a Pro o Elite</a> per sbloccare il team.</div>}

      <div id="tour-team-schedule" className="border-b border-[#1e2b4a] bg-gradient-to-r from-cyan-500/10 via-transparent to-indigo-500/10 px-5 py-4">
        <p className="text-sm font-bold text-cyan-200">Turni nativi NeatX</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">Orari fissi, ferie e permessi vivono nel calendario del collaboratore. Niente fogli esterni da sincronizzare.</p>
      </div>

      <StaffRequestsPanel tenantId={tenantId} enabled={isOpen} />

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[1fr_1.1fr]">
        <div className="flex min-h-0 flex-col border-r border-[#1e2b4a]">
          <form onSubmit={handleAddStaff} className="flex gap-2 border-b border-[#1e2b4a] p-4">
            <input value={newStaffName} onChange={(event) => setNewStaffName(event.target.value)} disabled={!isPremium && staffList.length >= 1} placeholder="Nome collaboratore" className="w-full rounded-xl border border-[#1e2b4a] bg-[#131c31] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50" />
            <button type="submit" disabled={adding || (!isPremium && staffList.length >= 1)} className="rounded-xl bg-indigo-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-indigo-400 disabled:opacity-50">+</button>
          </form>
          <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
            {loading ? <p className="py-8 text-center text-sm text-slate-500">Caricamento...</p> : staffList.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Nessun collaboratore.</p> : staffList.map((staff, index) => <div key={staff.id} className={`group flex items-center justify-between rounded-xl border bg-[#131c31] p-3 transition ${selectedStaff?.id === staff.id ? "border-indigo-500/70" : "border-[#1e2b4a] hover:border-indigo-500/50"}`}>
              <button id={index === 0 ? "tour-first-staff" : undefined} type="button" onClick={() => setSelectedStaff(staff)} className="min-w-0 flex-1 pr-2 text-left"><div className="truncate text-sm font-bold capitalize text-white group-hover:text-indigo-300">{staff.name}</div><div className="mt-1 text-xs text-slate-500">{staff.services.length} {staff.services.length === 1 ? "servizio" : "servizi"}{staff.locations.length > 0 && ` · ${staff.locations.length} ${staff.locations.length === 1 ? "sede" : "sedi"}`}</div></button>
              <button id={index === 0 ? "tour-first-staff-schedule" : undefined} type="button" onClick={() => setScheduleEditorStaff(staff)} className="mr-1 flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 transition hover:bg-cyan-500 hover:text-white" title="Gestisci turni"><CalendarClock size={16} /></button>
              <button type="button" onClick={() => void handleDeleteStaff(staff.id)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 transition hover:bg-red-500 hover:text-white" title="Elimina"><Trash2 size={15} /></button>
            </div>)}
          </div>
        </div>

        <div className="custom-scrollbar overflow-y-auto bg-[#070b14] p-5">
          {!selectedStaff ? <div className="flex h-full flex-col items-center justify-center text-center text-slate-500"><Users size={32} className="mb-3 opacity-40" /><p className="text-sm font-bold">Seleziona collaboratore</p><p className="mt-1 text-xs">Scegli servizi, sedi e turni.</p></div> : <div className="space-y-6">
            <div><h3 className="text-2xl font-extrabold capitalize text-white">{selectedStaff.name}</h3><p className="text-sm text-slate-400">Abilita ciò che può svolgere e dove lavora.</p></div>
            <StaffAccessControls staffId={selectedStaff.id} />
            <section><h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Servizi {savingServices && <span className="text-indigo-300">· salvataggio</span>}</h4><div className="space-y-2">{allServices.map((service) => { const active = selectedStaff.services.some((item) => item.id === service.id); return <button type="button" key={service.id} onClick={() => toggleService(service.id)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${active ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-200" : "border-[#1e2b4a] bg-[#131c31] text-slate-300 hover:border-indigo-500/30"}`}><span className="text-sm font-bold">{service.name}</span><span className={`h-5 w-10 rounded-full p-1 ${active ? "bg-indigo-500" : "bg-[#1e2b4a]"}`}><span className={`block h-3 w-3 rounded-full bg-white transition-transform ${active ? "translate-x-5" : ""}`} /></span></button>; })}</div></section>
            {allLocations.length > 1 && <section><h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Sedi {savingLocations && <span className="text-cyan-300">· salvataggio</span>}</h4><p className="mb-2 text-xs text-slate-600">Se nessuna sede è selezionata, il collaboratore lavora in tutte.</p><div className="space-y-2">{allLocations.map((location) => { const active = selectedLocationIds.includes(location.id); return <button type="button" key={location.id} onClick={() => toggleLocation(location.id)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${active ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-200" : "border-[#1e2b4a] bg-[#131c31] text-slate-300 hover:border-cyan-500/30"}`}><span className="text-sm font-bold">{location.name}</span><span className={`h-5 w-10 rounded-full p-1 ${active ? "bg-cyan-500" : "bg-[#1e2b4a]"}`}><span className={`block h-3 w-3 rounded-full bg-white transition-transform ${active ? "translate-x-5" : ""}`} /></span></button>; })}</div></section>}
          </div>}
        </div>
      </div>
    </aside>

    {scheduleEditorStaff && <ScheduleEditor staffId={scheduleEditorStaff.id} staffName={scheduleEditorStaff.name} onClose={() => setScheduleEditorStaff(null)} />}
  </>;
}
