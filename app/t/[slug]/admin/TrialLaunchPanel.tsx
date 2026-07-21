"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe2,
  Loader2,
  Rocket,
  Save,
  Scissors,
  Settings2,
} from "lucide-react";
import { getTenantAdminUrl, getTenantPublicUrl } from "@/lib/domains";
type ServiceDraft = {
  id: string;
  name: string;
  duration: number;
  price: number | "";
};

type Props = {
  slug: string;
  tenantId: string;
  tenantName: string;
  category?: string | null;
  city?: string | null;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  openTime?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  mapsLink?: string | null;
  closeTime?: string | null;
  breakStart?: string | null;
  breakEnd?: string | null;
  closedDays?: string | null;
  trialStatus?: string | null;
  isDemoData?: boolean | null;
  trialEndsAt?: Date | string | null;
  services: ServiceDraft[];
  staffCount: number;
  appointmentCount: number;
  activationRequested?: boolean;
};

const weekDays = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Gio" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sab" },
];

function parseClosedDays(value?: string | null) {
  try {
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.map(Number) : [];
  } catch {
    return [];
  }
}

function socialHandleValue(value: string | null | undefined, domain: string) {
  const raw = value?.trim();
  if (!raw) return "";

  const pattern = new RegExp(`${domain.replace(".", "\\.")}/@?([^/?#\\s]+)`, "i");
  const match = raw.match(pattern);
  if (match?.[1]) return `@${match[1].replace(/^@+/, "")}`;

  return raw.startsWith("@") ? raw : `@${raw}`;
}

export default function TrialLaunchPanel({
  slug,
  tenantId,
  tenantName,
  category,
  city,
  description,
  phone,
  address,
  openTime,
  instagramUrl,
  tiktokUrl,
  mapsLink,
  closeTime,
  breakStart,
  breakEnd,
  closedDays,
  trialStatus,
  isDemoData,
  trialEndsAt,
  services: initialServices,
  staffCount,
  appointmentCount,
  activationRequested: initialActivationRequested,
}: Props) {
  const router = useRouter();
  const [_hasRequested, _setHasRequested] = useState(initialActivationRequested);
  const publicUrl = getTenantPublicUrl(slug);
  const _adminUrl = getTenantAdminUrl(slug);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [serviceDrafts, setServiceDrafts] = useState<ServiceDraft[]>(
    initialServices.map((service) => ({ ...service, price: service.price ?? "" }))
  );
  const [shopDraft, setShopDraft] = useState({
    name: tenantName,
    city: city || "",
    description: description || "",
    phone: phone || "",
    address: address || "",
    openTime: openTime || "09:00",
    instagramUrl: socialHandleValue(instagramUrl, "instagram.com"),
    tiktokUrl: socialHandleValue(tiktokUrl, "tiktok.com"),
    mapsLink: mapsLink || "",
    closeTime: closeTime || "19:00",
    breakStart: breakStart || "",
    breakEnd: breakEnd || "",
    closedDays: parseClosedDays(closedDays),
  });

  useEffect(() => {
    setShopDraft(current => {
      // Only sync if the user is not actively typing (saving === null)
      if (saving !== null) return current;
      return {
        name: tenantName,
        city: city || "",
        description: description || "",
        phone: phone || "",
        address: address || "",
        openTime: openTime || "09:00",
        instagramUrl: socialHandleValue(instagramUrl, "instagram.com"),
        tiktokUrl: socialHandleValue(tiktokUrl, "tiktok.com"),
        mapsLink: mapsLink || "",
        closeTime: closeTime || "19:00",
        breakStart: breakStart || "",
        breakEnd: breakEnd || "",
        closedDays: parseClosedDays(closedDays),
      };
    });
  }, [
    tenantName, city, description, phone, address, openTime,
    instagramUrl, tiktokUrl, mapsLink, closeTime, breakStart,
    breakEnd, closedDays, saving
  ]);

  const trialDaysLeft = useMemo(() => {
    if (!trialEndsAt) return null;
    const end = new Date(trialEndsAt);
    const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [trialEndsAt]);

  const _checklist = [
    {
      label: isDemoData ? "Servizi provvisori" : "Servizi pronti",
      detail: `${serviceDrafts.length} servizi con durata e prezzo`,
      done: serviceDrafts.length >= 5,
      icon: Scissors,
    },
    {
      label: "Staff in agenda",
      detail: staffCount === 1 ? "1 membro staff" : `${staffCount} membri staff`,
      done: staffCount > 0,
      icon: Settings2,
    },
    {
      label: isDemoData ? "Prenotazioni demo" : "Agenda prenotazioni",
      detail: `${appointmentCount} appuntamenti visibili`,
      done: appointmentCount > 0,
      icon: CalendarDays,
    },
    {
      label: "Link condivisibile",
      detail: copied ? "Link copiato" : "Pronto da mandare ai clienti",
      done: copied,
      icon: Copy,
    },
    {
      label: "Negozio pubblicato",
      detail: isDemoData ? "Ancora in modalità demo" : "Dati demo trasformati in reale",
      done: !isDemoData,
      icon: Rocket,
    },
  ];

  const updateServiceDraft = (id: string, field: keyof ServiceDraft, value: string | number) => {
    setServiceDrafts((current) =>
      current.map((service) =>
        service.id === id
          ? {
              ...service,
              [field]: value,
            }
          : service
      )
    );
  };

  const saveService = async (service: ServiceDraft) => {
    setSaving(service.id);
    setMessage("");
    const res = await fetch("/api/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(service),
    });
    setSaving(null);

    if (!res.ok) {
      setMessage("Non sono riuscito a salvare il servizio.");
      return;
    }

    setMessage("Servizio salvato.");
    router.refresh();
  };

  const addService = async () => {
    setSaving("new-service");
    setMessage("");
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        name: "Nuovo servizio",
        duration: 30,
        price: null,
      }),
    });
    const data = await res.json();
    setSaving(null);

    if (!res.ok || !data.service) {
      setMessage("Non sono riuscito ad aggiungere il servizio.");
      return;
    }

    setServiceDrafts((current) => [
      ...current,
      { ...data.service, price: data.service.price ?? "" },
    ]);
    setMessage("Servizio aggiunto.");
    router.refresh();
  };

  const deleteService = async (id: string) => {
    setSaving(id);
    setMessage("");
    const res = await fetch(`/api/services?id=${id}`, { method: "DELETE" });
    setSaving(null);

    if (!res.ok) {
      setMessage("Non sono riuscito a eliminare il servizio.");
      return;
    }

    setServiceDrafts((current) => current.filter((service) => service.id !== id));
    setMessage("Servizio eliminato.");
    router.refresh();
  };

  const saveShop = async () => {
    setSaving("shop");
    setMessage("");
    const res = await fetch(`/api/tenant/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(shopDraft),
    });
    setSaving(null);

    if (!res.ok) {
      setMessage("Non sono riuscito a salvare le impostazioni.");
      return;
    }

    setMessage("Impostazioni salvate.");
    router.refresh();
  };

  const publishShop = async () => {
    setSaving("publish");
    setMessage("");
    const res = await fetch(`/api/tenant/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish" }),
    });
    setSaving(null);

    if (!res.ok) {
      setMessage("Non sono riuscito a pubblicare il negozio.");
      return;
    }

    setMessage("Negozio pubblicato: i dati demo ora sono dati reali modificabili.");
    router.refresh();
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setMessage("Link copiato.");
  };

  const toggleClosedDay = (day: number) => {
    setShopDraft((current) => ({
      ...current,
      closedDays: current.closedDays.includes(day)
        ? current.closedDays.filter((value) => value !== day)
        : [...current.closedDays, day],
    }));
  };

  return (
    <section className="mb-6 rounded-3xl border border-cyan-500/20 bg-[#07111f] p-4 shadow-2xl shadow-cyan-950/30 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-cyan-300">
              Prova gratuita
            </span>
            {category && (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {category.replaceAll("_", " ")}
              </span>
            )}
            {trialDaysLeft !== null && (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-300">
                {trialDaysLeft} giorni rimasti
              </span>
            )}
          </div>

          <h2 className="max-w-2xl text-2xl font-extrabold text-white sm:text-3xl">
            Questa è la tua pagina prenotazioni, già pronta.
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-400">
            Controlla servizi, orari e agenda. Quando ti convince, pubblichi il negozio reale senza ripartire da zero.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Link
            href={publicUrl}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-extrabold text-cyan-200 transition hover:bg-cyan-500/20"
          >
            <Globe2 size={17} />
            Vedi pagina cliente
            <ExternalLink size={14} />
          </Link>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#1e2b4a] bg-[#0b1221] px-4 py-3 text-sm font-extrabold text-white transition hover:border-cyan-500/40"
          >
            <Copy size={17} />
            {copied ? "Copiato" : "Copia link"}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[#1a2642] bg-[#050814] p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Link da mandare ai clienti</p>
            <p className="mt-1 truncate font-mono text-sm font-bold text-cyan-300">{publicUrl}</p>
          </div>
          {!isDemoData ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-2 text-xs font-extrabold text-emerald-300">
              <CheckCircle2 size={15} />
              Pubblicato
            </span>
          ) : (
            <button
              type="button"
              onClick={publishShop}
              disabled={saving === "publish"}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-[#03110a] transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving === "publish" ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
              Pubblica negozio reale
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-[#1a2642] bg-[#0b1221] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-cyan-300">Impostazioni negozio</p>
              <h3 className="mt-1 text-lg font-extrabold text-white">Orari e dati pubblici</h3>
            </div>
            <button
              type="button"
              onClick={saveShop}
              disabled={saving === "shop"}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-black transition hover:bg-cyan-300 disabled:opacity-60"
            >
              {saving === "shop" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Salva
            </button>
          </div>

          <div className="space-y-3">
            <input
              value={shopDraft.name}
              onChange={(event) => setShopDraft((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-xl border border-[#1e2b4a] bg-[#050814] px-3 py-2 text-sm font-bold text-white outline-none focus:border-cyan-400"
              placeholder="Nome attività"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={shopDraft.city}
                onChange={(event) => setShopDraft((current) => ({ ...current, city: event.target.value }))}
                className="rounded-xl border border-[#1e2b4a] bg-[#050814] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                placeholder="Citta"
              />
              <input
                value={shopDraft.phone}
                onChange={(event) => setShopDraft((current) => ({ ...current, phone: event.target.value }))}
                className="rounded-xl border border-[#1e2b4a] bg-[#050814] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                placeholder="Telefono WhatsApp"
              />
            </div>
            <input
              value={shopDraft.address}
              onChange={(event) => setShopDraft((current) => ({ ...current, address: event.target.value }))}
              className="w-full rounded-xl border border-[#1e2b4a] bg-[#050814] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
              placeholder="Indirizzo"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={shopDraft.mapsLink}
                onChange={(event) => setShopDraft((current) => ({ ...current, mapsLink: event.target.value }))}
                className="rounded-xl border border-[#1e2b4a] bg-[#050814] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                placeholder="Google Maps (vuoto = automatico)"
              />
              <input
                value={shopDraft.instagramUrl}
                onChange={(event) => setShopDraft((current) => ({ ...current, instagramUrl: event.target.value }))}
                className="rounded-xl border border-[#1e2b4a] bg-[#050814] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                placeholder="Instagram, es. @neatx_agenda"
              />
              <input
                value={shopDraft.tiktokUrl}
                onChange={(event) => setShopDraft((current) => ({ ...current, tiktokUrl: event.target.value }))}
                className="rounded-xl border border-[#1e2b4a] bg-[#050814] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                placeholder="TikTok, es. @neatx_agenda"
              />
            </div>

            <textarea
              value={shopDraft.description}
              onChange={(event) => setShopDraft((current) => ({ ...current, description: event.target.value }))}
              className="min-h-24 w-full rounded-xl border border-[#1e2b4a] bg-[#050814] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
              placeholder="Descrizione pubblica (Es. Il tuo stile impeccabile, a portata di click)"
            />

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 mt-2">
              <p className="text-sm font-bold text-cyan-300">🕐 Orari di apertura</p>
              <p className="mt-1 text-xs text-slate-400">
                Gli orari e i giorni di chiusura si gestiscono in modo indipendente per ogni sede. 
                Usa la sezione <strong>Gestione Sedi</strong> in fondo alla pagina per modificarli.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1a2642] bg-[#0b1221] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-cyan-300">Servizi</p>
              <h3 className="mt-1 text-lg font-extrabold text-white">Prezzi e durata modificabili</h3>
            </div>
            <button
              type="button"
              onClick={addService}
              disabled={saving === "new-service"}
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-extrabold text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-60"
            >
              + Servizio
            </button>
          </div>

          <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {/* INTESTAZIONI COLONNE */}
            {serviceDrafts.length > 0 && (
              <div className="hidden lg:grid grid-cols-[1fr_92px_92px_170px] gap-3 px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <div>Nome Servizio</div>
                <div className="text-center">Minuti</div>
                <div className="text-center">Prezzo (€)</div>
                <div></div>
              </div>
            )}
            
            {serviceDrafts.map((service) => (
              <div key={service.id} className="rounded-2xl border border-[#1e2b4a] bg-[#050814] p-3">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_92px_92px_170px]">
                  <input
                    value={service.name}
                    onChange={(event) => updateServiceDraft(service.id, "name", event.target.value)}
                    className="rounded-xl border border-[#1e2b4a] bg-[#0b1221] px-3 py-2 text-sm font-bold text-white outline-none focus:border-cyan-400"
                    placeholder="Nome servizio"
                  />
                  <div className="flex flex-col gap-1 lg:block">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 lg:hidden px-1">Durata (Minuti)</span>
                    <input
                      type="number"
                      min={5}
                      value={service.duration}
                      onChange={(event) => updateServiceDraft(service.id, "duration", Number(event.target.value))}
                      className="w-full rounded-xl border border-[#1e2b4a] bg-[#0b1221] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 lg:text-center"
                      placeholder="Minuti"
                    />
                  </div>
                  <div className="flex flex-col gap-1 lg:block">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 lg:hidden px-1">Prezzo (€)</span>
                    <input
                      type="number"
                      min={0}
                      value={service.price}
                      onChange={(event) => updateServiceDraft(
                        service.id,
                        "price",
                        event.target.value === "" ? "" : Number(event.target.value)
                      )}
                      className="w-full rounded-xl border border-[#1e2b4a] bg-[#0b1221] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 lg:text-center"
                      placeholder="Nessun prezzo"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveService(service)}
                      disabled={saving === service.id}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-black transition hover:bg-cyan-300 disabled:opacity-60 lg:flex-none"
                    >
                      {saving === service.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Salva
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteService(service.id)}
                      disabled={saving === service.id}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-extrabold text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>



      {message && (
        <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-200">
          {message}
        </div>
      )}
    </section>
  );
}
