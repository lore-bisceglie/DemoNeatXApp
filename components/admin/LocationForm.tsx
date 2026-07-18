"use client";

import { useState } from "react";
import { parseClosedDays } from "@/lib/opening-hours";

const WEEK_DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Gio" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sab" },
  { value: 0, label: "Dom" },
];

interface LocationFormProps {
  tenantId: string;
  tenantSlug: string;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    mapsLink: string | null;
    isMain: boolean;
    openTime: string | null;
    closeTime: string | null;
    breakStart: string | null;
    breakEnd: string | null;
    closedDays: string | null;
    staffSheetUrl: string | null;
    isActive: boolean;
  } | null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export default function LocationForm({ tenantId, tenantSlug, onClose, onSuccess, initialData }: LocationFormProps) {
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || slugify(initialData?.name || ""));
  const [address, setAddress] = useState(initialData?.address || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [mapsLink, setMapsLink] = useState(initialData?.mapsLink || "");
  const [openTime, setOpenTime] = useState(initialData?.openTime || "");
  const [closeTime, setCloseTime] = useState(initialData?.closeTime || "");
  const [breakStart, setBreakStart] = useState(initialData?.breakStart || "");
  const [breakEnd, setBreakEnd] = useState(initialData?.breakEnd || "");
  const [closedDays, setClosedDays] = useState<number[]>(parseClosedDays(initialData?.closedDays));
  const [staffSheetUrl, setStaffSheetUrl] = useState(initialData?.staffSheetUrl || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = isEditing
        ? "/api/locations/" + initialData!.id + "?slug=" + tenantSlug
        : "/api/locations?slug=" + tenantSlug;
      const method = isEditing ? "PUT" : "POST";
      const body: any = { name, slug, address: address || null, city: city || null, phone: phone || null, mapsLink: mapsLink || null };
      body.closedDays = closedDays;
      if (openTime) body.openTime = openTime;
      if (closeTime) body.closeTime = closeTime;
      if (breakStart) body.breakStart = breakStart;
      if (breakEnd) body.breakEnd = breakEnd;
      if (staffSheetUrl) body.staffSheetUrl = staffSheetUrl;

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        setError(err.error || "Errore salvataggio");
      }
    } catch (e) {
      setError("Errore di rete");
    } finally {
      setSaving(false);
    }
  }

  function toggleClosedDay(day: number) {
    setClosedDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day],
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-4 pt-[8vh] sm:pt-4">
      <div className="bg-[#0b1221] border border-[#1a2642] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-[#1a2642] flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{isEditing ? "Modifica Sede" : "Nuova Sede"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">X</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Nome Sede *</label>
            <input value={name} onChange={function (e) {
              const val = e.target.value;
              setName(val);
              if (!isEditing) setSlug(slugify(val));
            }} required className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" placeholder="Es. Sede Centro" />
            <p className="text-xs text-slate-500 mt-1">
              Indirizzo pagina: <span className="text-cyan-400/80">neatx.store/t/{tenantSlug}/sede/{slug || "..."}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Indirizzo</label>
              <input value={address} onChange={function (e) { setAddress(e.target.value); }} className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" placeholder="Via Roma 1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Citta</label>
              <input value={city} onChange={function (e) { setCity(e.target.value); }} className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" placeholder="Roma" />
            </div>
          </div>

          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3">
            <label className="block text-sm font-bold text-cyan-400 mb-1">📞 Telefono per Notifiche *</label>
            <input value={phone} onChange={function (e) { setPhone(e.target.value); }} required className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" placeholder="+39 3XX XXXXXXX" />
            <p className="text-xs text-slate-500 mt-1">Le notifiche di nuove prenotazioni e cancellazioni arriveranno qui</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Link Google Maps</label>
            <input value={mapsLink} onChange={function (e) { setMapsLink(e.target.value); }} className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" placeholder="https://maps.google.com/..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Apertura</label>
              <input type="time" value={openTime} onChange={function (e) { setOpenTime(e.target.value); }} className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Chiusura</label>
              <input type="time" value={closeTime} onChange={function (e) { setCloseTime(e.target.value); }} className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Pausa Inizio</label>
              <input type="time" value={breakStart} onChange={function (e) { setBreakStart(e.target.value); }} className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Pausa Fine</label>
              <input type="time" value={breakEnd} onChange={function (e) { setBreakEnd(e.target.value); }} className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Giorni chiusi</label>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((day) => {
                const isClosed = closedDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleClosedDay(day.value)}
                    aria-pressed={isClosed}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      isClosed
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : "border-[#1e2b4a] bg-[#131c31] text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {day.label} {isClosed ? "· Chiuso" : "· Aperto"}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Per aprire solo il sabato mattina, imposta 09:00–13:00 e segna chiusi tutti i giorni tranne Sab.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Google Sheets URL (staff)</label>
            <input value={staffSheetUrl} onChange={function (e) { setStaffSheetUrl(e.target.value); }} className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" placeholder="https://docs.google.com/..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50">
              {saving ? "Salvataggio..." : (isEditing ? "Aggiorna Sede" : "Crea Sede")}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 bg-[#131c31] text-slate-300 font-medium rounded-xl hover:bg-[#1a2642] transition-all">
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
