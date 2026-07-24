"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Settings, ToggleRight, MapPin as MapPinIcon, Phone as PhoneIcon, Activity, Trash2 as Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import LocationForm from "./LocationForm";
import LocationSettingsForm from "./LocationSettingsForm";
import StorePhotoCard from "./StorePhotoCard";

interface LocationTabsProps {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  tenantLogoUrl?: string | null;
  plan?: string;
}

const CARD_BASE = "bg-[#0b1221] rounded-xl border ";
const CARD_ACTIVE = "border-[#1e2b4a]";
const CARD_INACTIVE = "border-[#1a2642] opacity-60";

const BADGE_BASE = "px-2 py-0.5 text-xs font-bold rounded-full ";
const BADGE_ACTIVE = "bg-emerald-500/20 text-emerald-400";
const BADGE_INACTIVE = "bg-slate-500/20 text-slate-500";

const TOGGLE_BASE = "p-2 rounded-lg transition-colors ";
const TOGGLE_ACTIVE = "text-emerald-400 hover:bg-emerald-500/10";
const TOGGLE_INACTIVE = "text-slate-500 hover:bg-slate-500/10";

function LocationCard({ location, tenantSlug: _tenantSlug, tenantName: _tenantName, onEdit, onSettings, onToggle, onDelete, isInactive }: any) {
  var cardClass = CARD_BASE + (isInactive ? CARD_INACTIVE : CARD_ACTIVE);
  var badgeClass = BADGE_BASE + (location.isActive ? BADGE_ACTIVE : BADGE_INACTIVE);
  var toggleClass = TOGGLE_BASE + (location.isActive ? TOGGLE_ACTIVE : TOGGLE_INACTIVE);

  return (
    <div className={`${cardClass} p-4 min-w-0 overflow-hidden`}>
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto sm:flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0">
            <MapPinIcon size={18} className="text-white" />
          </div>
          <div className="min-w-0 w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-white text-lg truncate max-w-[200px] sm:max-w-none">{location.name}</h4>
              {location.isMain && <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-400 rounded-full whitespace-nowrap">Principale</span>}
              <span className={badgeClass}>{location.isActive ? "Attiva" : "Disattiva"}</span>
            </div>
            <p className="text-slate-400 text-sm mt-1 truncate w-full">
              <MapPinIcon size={14} className="inline mr-1" style={{ position: 'relative', top: '-1px' }} />
              {location.address || location.city || "Indirizzo non impostato"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto justify-end mt-2 sm:mt-0">
          <button onClick={onToggle} className={toggleClass} title={location.isActive ? "Disattiva" : "Attiva"}>
            <ToggleRight size={18} />
          </button>
          <button onClick={onSettings} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors" title="Impostazioni">
            <Settings size={16} />
          </button>
          <button onClick={onEdit} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Modifica">
            <Edit size={16} />
          </button>
          <button onClick={() => onDelete()} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Elimina">
            <Trash2Icon size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mt-4">
        <div className="bg-[#050814] rounded-xl p-3 min-w-0">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1 truncate">
            <PhoneIcon size={12} className="shrink-0" /> <span className="truncate">Telefono</span>
          </div>
          <p className="text-white font-medium truncate">{location.phone || "Non impostato"}</p>
        </div>
        <div className="bg-[#050814] rounded-xl p-3 min-w-0">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1 truncate">
            <Activity size={12} className="shrink-0" /> <span className="truncate">Staff</span>
          </div>
          <p className="text-white font-medium truncate">{location._count ? location._count.staff || 0 : 0} dipendenti</p>
        </div>
        <div className="bg-[#050814] rounded-xl p-3 min-w-0">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1 truncate">
            <MapPinIcon size={12} className="shrink-0" /> <span className="truncate">Servizi</span>
          </div>
          <p className="text-white font-medium truncate">{location._count ? location._count.services || 0 : 0} servizi</p>
        </div>
        <div className="bg-[#050814] rounded-xl p-3 min-w-0">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1 truncate">
            <Activity size={12} className="shrink-0" /> <span className="truncate">Appuntamenti</span>
          </div>
          <p className="text-white font-medium truncate">{location._count ? location._count.appointments || 0 : 0}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-3 border-t border-[#1a2642]">
        <button onClick={onEdit} className="flex-1 px-3 py-2 text-xs font-medium bg-[#131c31] hover:bg-[#1a2642] text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5">
          <Edit size={12} /> Modifica
        </button>
        <button onClick={onSettings} className="px-3 py-2 text-xs font-medium bg-[#131c31] hover:bg-[#1a2642] text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5">
          <Settings size={12} /> Impostazioni
        </button>
      </div>
    </div>
  );
}

export default function LocationTabs({ tenantId, tenantSlug, tenantName, tenantLogoUrl, plan }: LocationTabsProps) {
  const [locations, setLocations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"list" | "create" | "edit" | "settings">("list");
  const [editingLocation, setEditingLocation] = useState<any | null>(null);
  const [settingsLocationId, setSettingsLocationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const _router = useRouter();

  useEffect(function () {
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchLocations() {
    try {
      var res = await fetch("/api/locations?slug=" + tenantSlug);
      if (res.ok) {
        var data = await res.json();
        setLocations(data);
      }
    } catch (e) {
      console.error("Errore caricamento sedi:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, isMain: boolean) {
    if (isMain) {
      alert("Impossibile eliminare la sede principale");
      return;
    }
    if (!confirm("Eliminare questa sede? Gli appuntamenti storici rimarranno ma la sede verra disattivata.")) return;

    try {
      var res = await fetch("/api/locations/" + id + "?slug=" + tenantSlug, { method: "DELETE" });
      if (res.ok) {
        setLocations(function (prev) { return prev.filter(function (l) { return l.id !== id; }); });
      } else {
        var err = await res.json();
        alert(err.error || "Errore eliminazione");
      }
    } catch (_e) {
      alert("Errore eliminazione");
    }
  }

  async function handleToggleActive(location: any) {
    if (plan !== "elite" && !location.isActive && activeLocations.length >= 1) {
      alert("Il tuo piano include una sola sede. Passa all'Elite per gestire piu sedi.");
      return;
    }
    try {
      var res = await fetch("/api/locations/" + location.id + "?slug=" + tenantSlug, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !location.isActive }),
      });
      if (res.ok) {
        setLocations(function (prev) {
          return prev.map(function (l) {
            return l.id === location.id ? { ...l, isActive: !location.isActive } : l;
          });
        });
      }
    } catch (_e) {
      alert("Errore aggiornamento");
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Caricamento sedi...</div>;
  }

  var activeLocations = locations.filter(function (l) { return l.isActive; });
  var inactiveLocations = locations.filter(function (l) { return !l.isActive; });
  var hasLocations = activeLocations.length > 0 || inactiveLocations.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestione Sedi</h2>
          <p className="text-slate-400 text-sm mt-1">Gestisci le sedi del tuo salone: orari, staff, servizi e impostazioni per sede</p>
        </div>
        {plan !== "elite" && locations.length >= 1 ? (
          <a
            href={"/paywall/" + tenantSlug}
            className="bg-gradient-to-r from-emerald-500/30 to-cyan-500/20 text-white/70 border border-emerald-500/30 hover:border-emerald-500/60 px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm hover:scale-[1.02]"
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
            Nuova Sede <span className="text-[10px] uppercase tracking-wider text-amber-400 font-black ml-1">Elite</span>
          </a>
        ) : (
          <button
            onClick={function () { setActiveTab("create"); }}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Nuova Sede
          </button>
        )}
      </div>

      <StorePhotoCard
        tenantSlug={tenantSlug}
        tenantName={tenantName}
        initialLogoUrl={tenantLogoUrl || null}
      />

      <div className="bg-[#0b1221] rounded-2xl border border-[#1a2642] overflow-hidden">
        {!hasLocations && (
          <div className="text-center py-16">
            <h3 className="text-xl font-bold text-white mb-2">Nessuna sede configurata</h3>
            <p className="text-slate-400 mb-6">Crea la tua prima sede per iniziare a gestire gli orari e lo staff per sede</p>
            <button onClick={function () { setActiveTab("create"); }} className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-bold">Crea Prima Sede</button>
          </div>
        )}

        {hasLocations && (
          <div>
            {activeLocations.length > 0 && (
              <div className="p-4 border-b border-[#1a2642]">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Sedi Attive ({activeLocations.length})</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {activeLocations.map(function (location) {
                    return (
                      <LocationCard
                        key={location.id}
                        location={location}
                        tenantSlug={tenantSlug}
                        tenantName={tenantName}
                        onEdit={function () { setEditingLocation(location); }}
                        onSettings={function () { setSettingsLocationId(location.id); }}
                        onToggle={function () { handleToggleActive(location); }}
                        onDelete={function () { handleDelete(location.id, location.isMain); }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {inactiveLocations.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Sedi Disattivate ({inactiveLocations.length})</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {inactiveLocations.map(function (location) {
                    return (
                      <LocationCard
                        key={location.id}
                        location={location}
                        tenantSlug={tenantSlug}
                        tenantName={tenantName}
                        onEdit={function () { setEditingLocation(location); }}
                        onSettings={function () { setSettingsLocationId(location.id); }}
                        onToggle={function () { handleToggleActive(location); }}
                        onDelete={function () { handleDelete(location.id, location.isMain); }}
                        isInactive
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "create" && (
          <LocationForm
            tenantId={tenantId}
            tenantSlug={tenantSlug}
            onClose={function () { setActiveTab("list"); }}
            onSuccess={function () { setActiveTab("list"); fetchLocations(); }}
          />
        )}

        {editingLocation && (
          <LocationForm
            tenantId={tenantId}
            tenantSlug={tenantSlug}
            initialData={editingLocation}
            onClose={function () { setEditingLocation(null); }}
            onSuccess={function () { setEditingLocation(null); fetchLocations(); }}
          />
        )}

        {settingsLocationId && (
          <LocationSettingsForm
            locationId={settingsLocationId}
            tenantSlug={tenantSlug}
            onClose={function () { setSettingsLocationId(null); }}
          />
        )}
      </div>
    </div>
  );
}
