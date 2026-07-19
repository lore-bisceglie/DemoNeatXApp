"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type PlanFilter = "all" | "trial" | "pro" | "elite" | "expired" | "never";

const generateSecurePassword = () => {
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$";
  const all = upper + lower + digits + special;
  const pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
    ...Array.from({ length: 8 }, () => all[Math.floor(Math.random() * all.length)]),
  ];
  return pwd.sort(() => Math.random() - 0.5).join("");
};

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [template, setTemplate] = useState("barbiere");
  const [tenantPassword, setTenantPassword] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [description, setDescription] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [themeColor, setThemeColor] = useState("cyan");
  const [staffSheetUrl, setStaffSheetUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState<PlanFilter>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState({ mrr: 0, payingCount: 0, proCount: 0, eliteCount: 0, trialCount: 0 });
  const [sortBy, setSortBy] = useState<"date" | "name" | "plan">("date");
  const [detailTenant, setDetailTenant] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const totalCount = tenants.length;
  const registeredToday = tenants.filter(t => new Date(t.createdAt) >= todayStart).length;
  const neverActivated = tenants.filter(t => !t.trialEndsAt && t.plan !== "pro" && t.plan !== "elite").length;
  const expiredCount = tenants.filter(t => {
    const exp = t.trialEndsAt ? new Date(t.trialEndsAt) : null;
    return exp && exp <= now && t.plan !== "pro" && t.plan !== "elite";
  }).length;

  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/superadmin/list");
      if (res.status === 401) { setAuthError("Password errata"); setIsAuthenticated(false); setLoading(false); return; }
      if (!res.ok) { const err = await res.json(); setAuthError("Errore: " + (err.error || res.statusText)); setIsAuthenticated(false); setLoading(false); return; }
      const data = await res.json();
      setTenants(data.tenants || (Array.isArray(data) ? data : []));
      if (data.stats) setStats(data.stats);
      setIsAuthenticated(true);
      setAuthError("");
    } catch (e: unknown) {
      setAuthError(e instanceof Error ? e.message : "Errore");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTenants(); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const response = await fetch("/api/superadmin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      setAuthError("Password errata");
      setLoading(false);
      return;
    }
    setPassword("");
    await fetchTenants();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true); setError("");
    try {
      const res = await fetch("/api/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, template, password: tenantPassword, ownerEmail, phone, address, instagramUrl, mapsLink, description, openTime, closeTime, logoUrl, themeColor, staffSheetUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore sconosciuto");
      setName(""); setSlug(""); setTenantPassword(""); setPhone(""); setAddress("");
      setInstagramUrl(""); setMapsLink(""); setDescription(""); setOpenTime(""); setCloseTime(""); setLogoUrl(""); setThemeColor("cyan"); setStaffSheetUrl("");
      fetchTenants();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Errore"); }
    finally { setCreating(false); }
  };

  const handleLogout = async () => {
    await fetch("/api/superadmin/login", { method: "DELETE" }).catch(() => null);
    setTenants([]);
    setIsAuthenticated(false);
    setPassword("");
  };

  const handleDelete = async (tenantId: string, tenantName: string) => {
    if (!confirm(`Eliminare DEFINITIVAMENTE "${tenantName}"? Irreversibile.`)) return;
    try {
      const res = await fetch("/api/superadmin/delete", { method: "DELETE", headers: { "Content-Type": "application/json", "x-admin-password": password }, body: JSON.stringify({ tenantId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore");
      fetchTenants();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Errore"); }
  };

  const handleMakePlan = async (tenantId: string, plan: string) => {
    let msg = `Promuovere al piano ${plan.toUpperCase()}?`;
    if (plan === "basic") msg = "Riportare al Trial (14 gg)?";
    if (plan === "expire") msg = "Forzare scadenza trial (Paywall)?";
    if (!confirm(msg)) return;
    try {
      const res = await fetch("/api/superadmin/plan", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": password }, body: JSON.stringify({ tenantId, plan }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore");
      fetchTenants();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Errore"); }
  };

  const handleAddSms = async (tenantId: string) => {
    const amountStr = prompt("Quanti crediti SMS? (es. 100, 500)");
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) return;
    try {
      const res = await fetch("/api/superadmin/sms", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": password }, body: JSON.stringify({ tenantId, amount }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore");
      alert(`Crediti aggiornati: ${data.newTotal}`);
      fetchTenants();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Errore"); }
  };

  const handleImpersonate = async (slug: string) => {
    try {
      const res = await fetch("/api/superadmin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Accesso non riuscito");
      window.open(data.magicUrl, "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Accesso non riuscito");
    }
  };

  const handleCopyCredentials = (tenant: any) => {
    const text = `Negozio: ${tenant.name}\nSito: https://${tenant.slug}.neatx.store\nAdmin: https://neatx.store/t/${tenant.slug}/admin`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(tenant.id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => prompt("Copia le credenziali:", text));
  };

  const openEdit = (tenant: any) => {
    setEditTarget(tenant);
    setEditData({
      name: tenant.name || "", ownerEmail: tenant.ownerEmail || "", phone: tenant.phone || "",
      address: tenant.address || "", instagramUrl: tenant.instagramUrl || "", mapsLink: tenant.mapsLink || "",
      description: tenant.description || "", openTime: tenant.openTime || "", closeTime: tenant.closeTime || "",
      logoUrl: tenant.logoUrl || "", themeColor: tenant.themeColor || "cyan", password: ""
    });
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setEditing(true);
    try {
      const res = await fetch("/api/superadmin", { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-password": password }, body: JSON.stringify({ id: editTarget.id, ...editData }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore aggiornamento");
      setEditTarget(null);
      fetchTenants();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Errore"); }
    finally { setEditing(false); }
  };

  const handleExportCsv = () => {
    const rows = getSortedTenants().map(t => [t.name, t.slug, t.plan, t.ownerEmail || "", t.phone || "", t.services?.length || 0, t.storeSettings?.smsCredits || 0, t.storeSettings?.stripeOnboardingComplete ? "Si" : "No", new Date(t.createdAt).toLocaleDateString("it-IT"), t.trialEndsAt ? new Date(t.trialEndsAt).toLocaleDateString("it-IT") : "-"]);
    const csv = [["Nome", "Slug", "Piano", "Email", "Telefono", "Servizi", "SMS", "Stripe", "Creato", "Trial Scade"].join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })), download: `tenant-${new Date().toISOString().split("T")[0]}.csv` });
    a.click();
  };

  const getSortedTenants = () => {
    return tenants.filter(t => {
      const q = searchTerm.toLowerCase();
      if (!t.name.toLowerCase().includes(q) && !(t.ownerEmail?.toLowerCase().includes(q)) && !t.slug.toLowerCase().includes(q)) return false;
      if (filterPlan === "all") return true;
      if (filterPlan === "pro") return t.plan === "pro";
      if (filterPlan === "elite") return t.plan === "elite";
      const exp = t.trialEndsAt ? new Date(t.trialEndsAt) : null;
      if (filterPlan === "trial") return exp && exp > now && t.plan !== "pro" && t.plan !== "elite";
      if (filterPlan === "expired") return exp && exp <= now && t.plan !== "pro" && t.plan !== "elite";
      if (filterPlan === "never") return !t.trialEndsAt && t.plan !== "pro" && t.plan !== "elite";
      return true;
    }).sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "plan") return (a.plan || "basic").localeCompare(b.plan || "basic");
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const THEME_OPTIONS: [string, string][] = [["cyan","🔵 Cyan"],["rose","🌸 Rosa"],["emerald","🌿 Smeraldo"],["amber","💛 Ambra"],["purple","💜 Viola"],["slate","🪨 Grigio"],["red","🔴 Rosso"],["indigo","🌌 Indaco"],["teal","🌊 Verde Acqua"],["fuchsia","🌺 Fucsia"]];
  const IC = "w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-indigo-500";
  const ISM = "w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-white text-sm focus:outline-none focus:border-indigo-500";

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050814] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-2xl font-bold text-white">Super Admin</h1>
            <p className="text-slate-400 text-sm mt-1">NeatX SaaS — Godmode</p>
          </div>
          <div className="relative mb-4">
            <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleLogin(e); }} placeholder="Password segreta" autoFocus className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 pr-10 text-white focus:outline-none focus:border-indigo-500" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white">{showPassword ? "👁️" : "👁️‍🗨️"}</button>
          </div>
          {authError && <div className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">{authError}</div>}
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">{loading ? "Verifica..." : "Entra nel Pannello"}</button>
        </form>
      </div>
    );
  }

  const PLAN_FILTERS: { key: PlanFilter; label: string; active: string }[] = [
    { key: "all",     label: `Tutti (${totalCount})`,              active: "bg-slate-600 text-white" },
    { key: "pro",     label: `Pro (${stats.proCount || 0})`,       active: "bg-blue-500/40 text-blue-200 border border-blue-400/50" },
    { key: "elite",   label: `Elite (${stats.eliteCount || 0})`,   active: "bg-fuchsia-500/40 text-fuchsia-200 border border-fuchsia-400/50" },
    { key: "trial",   label: `Trial (${stats.trialCount || 0})`,   active: "bg-amber-500/30 text-amber-200 border border-amber-400/50" },
    { key: "expired", label: `Scaduti (${expiredCount})`,          active: "bg-red-500/30 text-red-200 border border-red-400/50" },
    { key: "never",   label: `Mai attivati (${neverActivated})`,   active: "bg-slate-700 text-slate-300 border border-slate-600" },
  ];

  return (
    <>
      <div className="min-h-screen bg-[#050814] text-slate-200 p-4 md:p-8 font-sans w-full">
        <div className="w-full">

          {/* HEADER */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Link href="/" className="text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors">🏠 Sito</Link>
              <Link href="/superadmin/agents" className="text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors">🤖 Agenti</Link>
              <button onClick={() => { setLoading(true); fetchTenants(); }} className="text-sm font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-full transition-colors">🔄 Aggiorna</button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20"
              >
                Esci
              </button>
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Pannello Super Admin</h1>
            <p className="text-slate-400 text-sm mt-0.5">NeatX SaaS — Godmode Control Panel</p>
          </div>

          {/* STATS 6 CARDS */}
          <div className="w-full mb-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: "MRR", value: `€${stats.mrr?.toLocaleString("it-IT") || 0}`, cls: "text-emerald-400", grd: "from-emerald-500 to-teal-500" },
              { label: "Paganti", value: stats.payingCount || 0, cls: "text-white", grd: "from-indigo-600 to-purple-600" },
              { label: "In Trial", value: stats.trialCount || 0, cls: "text-amber-400", grd: "from-amber-500 to-orange-500" },
              { label: "Totale", value: totalCount, cls: "text-cyan-400", grd: "from-cyan-500 to-blue-500" },
              { label: "Oggi", value: registeredToday, cls: "text-green-400", grd: "from-green-500 to-emerald-500", sub: "nuove reg." },
              { label: "Scaduti", value: expiredCount, cls: "text-red-400", grd: "from-red-500 to-rose-500", sub: "trial scaduto" },
            ].map(s => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                <div className={`absolute -inset-1 bg-gradient-to-r ${s.grd} opacity-0 group-hover:opacity-20 transition-opacity blur`} />
                <h3 className="text-slate-400 text-[10px] font-medium mb-1 uppercase tracking-widest relative">{s.label}</h3>
                <div className={`text-2xl font-extrabold relative ${s.cls}`}>{s.value}</div>
                {s.sub && <p className="text-slate-500 text-[9px] mt-0.5 relative">{s.sub}</p>}
              </div>
            ))}
          </div>

          <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* FORM CREAZIONE */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
              <h2 className="text-xl font-semibold mb-5 text-white">➕ Nuovo Cliente</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nome Attività *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Es. Studio Dentistico Rossi" className={IC} required />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email Proprietario</label>
                  <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} placeholder="mario@email.com" className={IC} />
                  <p className="text-xs text-slate-500 mt-1">Inviamo email di benvenuto automatica se inserita.</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Link (Slug) *</label>
                  <div className="flex items-center">
                    <span className="text-slate-500 bg-slate-950 border border-r-0 border-slate-800 rounded-l-lg p-3 text-xs whitespace-nowrap">https://</span>
                    <input type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="studio-rossi" className="w-full bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-indigo-500 text-sm" required />
                    <span className="text-slate-500 bg-slate-950 border border-l-0 border-slate-800 rounded-r-lg p-3 text-xs whitespace-nowrap">.neatx.store</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Password Admin *</label>
                  <div className="flex gap-2">
                    <input type="text" value={tenantPassword} onChange={e => setTenantPassword(e.target.value)} placeholder="Es. Segreta2026!" className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm" required />
                    <button type="button" onClick={() => setTenantPassword(generateSecurePassword())} title="Genera password sicura" className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-3 rounded-lg text-lg transition shrink-0">🎲</button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Clicca 🎲 per generare una password sicura.</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Template Servizi</label>
                  <select value={template} onChange={e => setTemplate(e.target.value)} className={IC}>
                    <option value="barbiere">💈 Barbiere</option>
                    <option value="parrucchiere">✂️ Parrucchiere</option>
                    <option value="estetista">💅 Centro Estetico</option>
                    <option value="medico">🩺 Medico / Fisioterapista</option>
                    <option value="nutrizionista">🥗 Nutrizionista</option>
                    <option value="psicologo">🛋️ Psicologo</option>
                    <option value="personaltrainer">🏋️ Personal Trainer</option>
                    <option value="tatuatore">🖋️ Tatuatore</option>
                    <option value="consulente">💼 Consulente / Avvocato</option>
                    <option value="toelettatura">🐕 Toelettatura</option>
                    <option value="vuoto">📋 Vuoto</option>
                  </select>
                </div>
                <details className="border border-slate-800 rounded-lg bg-slate-950 overflow-hidden">
                  <summary className="cursor-pointer p-4 font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-all text-sm">⚙️ Impostazioni Avanzate (Opzionali)</summary>
                  <div className="p-4 pt-0 space-y-3 border-t border-slate-800 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs text-slate-400 mb-1">Telefono</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+39 333..." className={ISM} /></div>
                      <div><label className="block text-xs text-slate-400 mb-1">Indirizzo</label><input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Via Roma 1" className={ISM} /></div>
                      <div><label className="block text-xs text-slate-400 mb-1">Instagram</label><input type="url" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." className={ISM} /></div>
                      <div><label className="block text-xs text-slate-400 mb-1">Google Maps</label><input type="url" value={mapsLink} onChange={e => setMapsLink(e.target.value)} placeholder="https://maps.google.com/..." className={ISM} /></div>
                      <div><label className="block text-xs text-slate-400 mb-1">Apertura</label><input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} className={ISM} /></div>
                      <div><label className="block text-xs text-slate-400 mb-1">Chiusura</label><input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} className={ISM} /></div>
                    </div>
                    <div><label className="block text-xs text-slate-400 mb-1">Descrizione</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Il tuo stile..." className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-white text-sm h-14 resize-none focus:outline-none focus:border-indigo-500" /></div>
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Logo (URL)</label>
                        <div className="flex gap-2">
                          <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." className={ISM} />
                          <label className="bg-slate-800 hover:bg-slate-700 cursor-pointer border border-slate-700 rounded-md px-2 flex items-center" title="Carica dal PC">
                            <input type="file" accept="image/*" className="hidden" onChange={e => {
                              const file = e.target.files?.[0]; if (!file) return;
                              const reader = new FileReader();
                              reader.onload = ev => {
                                const img = new Image();
                                img.onload = () => {
                                  const c = document.createElement("canvas"); const M = 500;
                                  let w = img.width, h = img.height;
                                  if (w > h) { if (w > M) { h *= M / w; w = M; } } else { if (h > M) { w *= M / h; h = M; } }
                                  c.width = w; c.height = h; c.getContext("2d")?.drawImage(img, 0, 0, w, h);
                                  setLogoUrl(c.toDataURL("image/webp", 0.8));
                                };
                                img.src = ev.target?.result as string;
                              };
                              reader.readAsDataURL(file);
                            }} />
                            📁
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Tema</label>
                        <select value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                          {THEME_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Google Sheet URL (Opzionale)</label>
                      <input type="url" value={staffSheetUrl} onChange={e => setStaffSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." className={ISM} />
                    </div>
                  </div>
                </details>
                {error && <div className="p-3 bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-lg">{error}</div>}
                <button type="submit" disabled={creating} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg transition disabled:opacity-50">{creating ? "Creazione..." : "🚀 Genera Cliente"}</button>
              </form>
            </div>

            {/* LISTA CLIENTI */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-white">Clienti <span className="text-slate-500 text-base">({getSortedTenants().length})</span></h2>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as "date" | "name" | "plan")} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer">
                    <option value="date">📅 Recenti</option>
                    <option value="name">🔤 A-Z</option>
                    <option value="plan">📊 Piano</option>
                  </select>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <input type="text" placeholder="Cerca..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 sm:w-52 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  <button onClick={handleExportCsv} className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/30 px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap">📥 CSV</button>
                </div>
              </div>

              {/* Filtri piano */}
              <div className="flex flex-wrap gap-2 mb-5">
                {PLAN_FILTERS.map(f => (
                  <button key={f.key} onClick={() => setFilterPlan(f.key)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterPlan === f.key ? f.active : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>{f.label}</button>
                ))}
              </div>

              {loading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-slate-800 rounded-xl animate-pulse" />)}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {getSortedTenants().map(tenant => {
                    const exp = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : null;
                    const expired = exp && now > exp;
                    const days = exp ? Math.ceil((exp.getTime() - now.getTime()) / 86400000) : 0;
                    const copied = copiedId === tenant.id;
                    return (
                      <div key={tenant.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col justify-between group hover:border-indigo-500/40 transition-colors gap-3">
                        <div>
                          <div className="flex justify-between items-start mb-2 gap-1">
                            <button onClick={() => setDetailTenant(tenant)} className="font-bold text-white text-sm leading-tight text-left hover:text-indigo-400 transition-colors line-clamp-2" title={tenant.name}>{tenant.name}</button>
                            <div className="flex flex-col gap-0.5 items-end shrink-0">
                              {tenant.plan === "pro" && <span className="bg-blue-500/20 text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Pro</span>}
                              {tenant.plan === "elite" && <span className="bg-fuchsia-500/20 text-fuchsia-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Elite</span>}
                              {tenant.isDemoData && <span className="bg-slate-700/50 text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Demo</span>}
                              {!tenant.trialEndsAt && tenant.plan !== "pro" && tenant.plan !== "elite" && <span className="bg-slate-700/30 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Mai att.</span>}
                              {expired && tenant.plan !== "pro" && tenant.plan !== "elite" && <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Scaduto</span>}
                            </div>
                          </div>
                          <div className="text-sm text-slate-400 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-slate-800 px-2 py-0.5 rounded text-xs">{tenant.services?.length || 0} servizi</span>
                              {tenant.storeSettings?.stripeOnboardingComplete
                                ? <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold">✅ Stripe</span>
                                : <span className="bg-slate-800/50 text-slate-500 px-2 py-0.5 rounded text-[10px]">❌ Stripe</span>}
                            </div>
                            {exp && tenant.plan !== "pro" && tenant.plan !== "elite" && (
                              <div className={`text-xs font-semibold ${expired ? "text-red-400" : "text-orange-400"}`}>{expired ? `🔒 Scaduto da ${Math.abs(days)} gg` : `⏳ ${days} gg rimanenti`}</div>
                            )}
                            {tenant.ownerEmail && <div className="text-xs truncate text-slate-500" title={tenant.ownerEmail}>📧 {tenant.ownerEmail}</div>}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
                              <span className="text-xs text-slate-400">💬 {tenant.storeSettings?.smsCredits || 0} SMS</span>
                              <span className="text-xs text-slate-600">{new Date(tenant.createdAt).toLocaleDateString("it-IT")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-auto pt-3 border-t border-slate-800/50">
                          <div className="flex gap-1 w-full">
                            <a href={`https://${tenant.slug}.neatx.store`} target="_blank" rel="noopener noreferrer" title="Sito pubblico" className="flex-1 text-center text-[11px] text-indigo-400 hover:text-indigo-300 font-medium bg-indigo-500/10 py-1.5 rounded-lg transition flex items-center justify-center">🌐</a>
                            <button onClick={() => handleImpersonate(tenant.slug)} title="Entra come Admin" className="flex-1 text-[11px] text-amber-400 font-medium bg-amber-500/10 py-1.5 rounded-lg border border-amber-500/20 flex items-center justify-center hover:bg-amber-500/20 transition">🕵️</button>
                            <button onClick={() => handleCopyCredentials(tenant)} title="Copia credenziali per il cliente" className={`flex-1 text-[11px] font-medium py-1.5 rounded-lg transition flex items-center justify-center ${copied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"}`}>{copied ? "✅" : "📋"}</button>
                            <button onClick={() => openEdit(tenant)} title="Modifica" className="text-[11px] font-medium flex items-center justify-center bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg transition">✏️</button>
                            {tenant.slug === 'demo-vetrina' || tenant.slug === 'demo-neatx' ? (
                              <button disabled title="Demo pubblica protetta" className="text-[11px] font-medium flex items-center justify-center bg-slate-800/50 text-slate-500 px-3 py-1.5 rounded-lg cursor-not-allowed">🛡️</button>
                            ) : (
                              <button onClick={() => handleDelete(tenant.id, tenant.name)} title="Elimina" className="text-[11px] font-medium flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition">🗑️</button>
                            )}
                          </div>
                          <div className="flex gap-1 w-full mt-1">
                            <button onClick={() => handleAddSms(tenant.id)} className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition">💬 + SMS</button>
                            <div className="relative flex-1 group/menu z-10">
                              <button className="w-full text-xs font-bold py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition">⚙️ Gestisci</button>
                              <div className="absolute bottom-full right-0 pb-1 hidden group-hover/menu:block w-40 z-20">
                                <div className="flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 gap-1 overflow-hidden">
                                  <button onClick={() => handleMakePlan(tenant.id, "pro")} className={`text-left text-xs px-3 py-2 rounded-lg transition ${tenant.plan === "pro" ? "bg-blue-500/20 text-blue-300 font-bold" : "hover:bg-slate-800 text-slate-300"}`}>📘 Imposta PRO</button>
                                  <button onClick={() => handleMakePlan(tenant.id, "elite")} className={`text-left text-xs px-3 py-2 rounded-lg transition ${tenant.plan === "elite" ? "bg-fuchsia-500/20 text-fuchsia-300 font-bold" : "hover:bg-slate-800 text-slate-300"}`}>🌟 Imposta ELITE</button>
                                  <div className="h-px bg-slate-800 my-1 w-full"></div>
                                  <button onClick={() => handleMakePlan(tenant.id, "basic")} className="text-left text-xs px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 transition">🔄 Riporta Trial</button>
                                  <button onClick={() => handleMakePlan(tenant.id, "expire")} className="text-left text-xs px-3 py-2 rounded-lg hover:bg-red-500/20 text-red-400 transition">🔒 Forza Scadenza</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {getSortedTenants().length === 0 && (
                    <div className="text-center py-16 text-slate-500 col-span-3">
                      <div className="text-5xl mb-3">👻</div>
                      <p>Nessun cliente trovato.</p>
                      {filterPlan !== "all" && <button onClick={() => setFilterPlan("all")} className="mt-3 text-indigo-400 text-sm hover:underline">Rimuovi filtro</button>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL MODIFICA */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditTarget(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">✏️ {editTarget.name}</h2>
              <button onClick={() => setEditTarget(null)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-xs text-slate-400 mb-1">Nome</label><input type="text" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className={IC} /></div>
              <div><label className="block text-xs text-slate-400 mb-1">Email Proprietario</label><input type="email" value={editData.ownerEmail} onChange={e => setEditData({ ...editData, ownerEmail: e.target.value })} className={IC} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-slate-400 mb-1">Telefono</label><input type="text" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className={IC} /></div>
                <div><label className="block text-xs text-slate-400 mb-1">Indirizzo</label><input type="text" value={editData.address} onChange={e => setEditData({ ...editData, address: e.target.value })} className={IC} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-slate-400 mb-1">Instagram</label><input type="url" value={editData.instagramUrl} onChange={e => setEditData({ ...editData, instagramUrl: e.target.value })} className={IC} /></div>
                <div><label className="block text-xs text-slate-400 mb-1">Google Maps</label><input type="url" value={editData.mapsLink} onChange={e => setEditData({ ...editData, mapsLink: e.target.value })} className={IC} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-slate-400 mb-1">Apertura</label><input type="time" value={editData.openTime} onChange={e => setEditData({ ...editData, openTime: e.target.value })} className={IC} /></div>
                <div><label className="block text-xs text-slate-400 mb-1">Chiusura</label><input type="time" value={editData.closeTime} onChange={e => setEditData({ ...editData, closeTime: e.target.value })} className={IC} /></div>
              </div>
              <div><label className="block text-xs text-slate-400 mb-1">Descrizione</label><textarea value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm h-16 resize-none focus:outline-none focus:border-indigo-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-slate-400 mb-1">Logo URL</label><input type="url" value={editData.logoUrl} onChange={e => setEditData({ ...editData, logoUrl: e.target.value })} className={IC} /></div>
                <div><label className="block text-xs text-slate-400 mb-1">Tema</label><select value={editData.themeColor} onChange={e => setEditData({ ...editData, themeColor: e.target.value })} className={IC}>{THEME_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nuova password admin (opzionale)</label>
                <div className="flex gap-2">
                  <input type="password" value={editData.password || ""} onChange={e => setEditData({ ...editData, password: e.target.value })} placeholder="Lascia vuoto per non cambiarla" className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono tracking-wider" />
                  <button type="button" onClick={() => setEditData({ ...editData, password: generateSecurePassword() })} title="Genera" className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-3 rounded-lg text-xl transition shrink-0">🎲</button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">La password viene salvata solo in forma cifrata e non sarà più visualizzabile.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800">
              <button onClick={() => setEditTarget(null)} className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-sm transition">Annulla</button>
              <button onClick={handleEditSave} disabled={editing} className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition disabled:opacity-50">{editing ? "Salvataggio..." : "✅ Salva"}</button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER DETTAGLIO */}
      {detailTenant && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDetailTenant(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{detailTenant.name}</h2>
                <p className="text-sm text-slate-400 font-mono">{detailTenant.slug}.neatx.store</p>
              </div>
              <button onClick={() => setDetailTenant(null)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">📊 Informazioni</h3>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-sm">
                  <div><span className="text-slate-500">Piano:</span> <span className="text-white font-semibold capitalize">{detailTenant.plan || "basic"}</span></div>
                  <div><span className="text-slate-500">Stato:</span> <span className="text-white font-semibold">{detailTenant.trialStatus || "-"}</span></div>
                  <div><span className="text-slate-500">Servizi:</span> <span className="text-white font-semibold">{detailTenant.services?.length || 0}</span></div>
                  <div><span className="text-slate-500">Sedi:</span> <span className="text-white font-semibold">{detailTenant.locations?.length || 0}</span></div>
                  <div><span className="text-slate-500">Stripe:</span> <span className={`font-semibold ${detailTenant.storeSettings?.stripeOnboardingComplete ? "text-emerald-400" : "text-red-400"}`}>{detailTenant.storeSettings?.stripeOnboardingComplete ? "✅ Sì" : "❌ No"}</span></div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">SMS:</span>
                    <span className="text-white font-semibold">{detailTenant.storeSettings?.smsCredits || 0}</span>
                    <button onClick={() => handleAddSms(detailTenant.id)} className="text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 hover:bg-emerald-500/20 transition">+</button>
                  </div>
                  <div><span className="text-slate-500">Creato:</span> <span className="text-white font-semibold">{new Date(detailTenant.createdAt).toLocaleDateString("it-IT")}</span></div>
                  <div><span className="text-slate-500">Demo:</span> <span className="text-white font-semibold">{detailTenant.isDemoData ? "✅" : "❌"}</span></div>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  {detailTenant.ownerEmail && <p className="text-slate-400">📧 {detailTenant.ownerEmail}</p>}
                  {detailTenant.phone && <p className="text-slate-400">📞 {detailTenant.phone}</p>}
                  {detailTenant.address && <p className="text-slate-400">📍 {detailTenant.address}</p>}
                </div>
              </div>

              {detailTenant.trialEndsAt && (() => {
                const dl = Math.ceil((new Date(detailTenant.trialEndsAt).getTime() - new Date().getTime()) / 86400000);
                const e = dl <= 0;
                return (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">⏳ Trial</h3>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-400">Scade il:</span>
                      <span className="text-white font-semibold">{new Date(detailTenant.trialEndsAt).toLocaleDateString("it-IT")}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${e ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>{e ? `Scaduto da ${Math.abs(dl)} gg` : `${dl} gg rimanenti`}</span>
                    </div>
                  </div>
                );
              })()}

              {(detailTenant.openTime || detailTenant.closeTime) && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">🕐 Orari</h3>
                  <div className="flex gap-4 text-sm">
                    {detailTenant.openTime && <span className="text-slate-400">Apertura: <span className="text-white font-semibold">{detailTenant.openTime}</span></span>}
                    {detailTenant.closeTime && <span className="text-slate-400">Chiusura: <span className="text-white font-semibold">{detailTenant.closeTime}</span></span>}
                  </div>
                </div>
              )}

              {detailTenant.services?.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">🛠️ Servizi ({detailTenant.services.length})</h3>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {detailTenant.services.map((s: { id: string; name: string; duration: number; price: number | null }) => (
                      <div key={s.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-slate-900/50">
                        <span className="text-slate-300">{s.name}</span>
                        <span className="text-slate-500 font-mono text-xs">
                          {s.duration}min{s.price != null && s.price > 0 ? ` · €${s.price}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailTenant.locations?.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">📍 Sedi ({detailTenant.locations.length})</h3>
                  <div className="space-y-2">
                    {detailTenant.locations.map((l: { id: string; name: string; address?: string | null; isMain: boolean; isActive: boolean }) => (
                      <div key={l.id} className="bg-slate-900/60 border border-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white">{l.isMain ? "⭐" : "📍"} {l.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${l.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{l.isActive ? "Attiva" : "Disattiva"}</span>
                        </div>
                        {l.address && <p className="text-xs text-slate-400 mt-1">📍 {l.address}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(detailTenant.instagramUrl || detailTenant.mapsLink) && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">🔗 Link</h3>
                  {detailTenant.instagramUrl && <a href={detailTenant.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 truncate block text-sm mb-1">📸 {detailTenant.instagramUrl}</a>}
                  {detailTenant.mapsLink && <a href={detailTenant.mapsLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 truncate block text-sm">🗺️ {detailTenant.mapsLink}</a>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <a href={`https://${detailTenant.slug}.neatx.store`} target="_blank" rel="noopener noreferrer" className="text-center text-sm font-bold bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 px-4 py-3 rounded-xl hover:bg-indigo-600/30 transition">🌐 Sito</a>
                <button onClick={() => handleImpersonate(detailTenant.slug)} className="text-sm font-bold bg-amber-600/20 text-amber-400 border border-amber-600/30 px-4 py-3 rounded-xl hover:bg-amber-600/30 transition">🕵️ Entra Admin</button>
                <button onClick={() => handleCopyCredentials(detailTenant)} className={`text-sm font-bold border px-4 py-3 rounded-xl transition ${copiedId === detailTenant.id ? "bg-emerald-600/30 text-emerald-300 border-emerald-600/50" : "bg-emerald-600/20 text-emerald-400 border-emerald-600/30 hover:bg-emerald-600/30"}`}>{copiedId === detailTenant.id ? "✅ Copiato!" : "📋 Copia Credenziali"}</button>
                <button onClick={() => { setDetailTenant(null); openEdit(detailTenant); }} className="text-sm font-bold bg-cyan-600/20 text-cyan-400 border border-cyan-600/30 px-4 py-3 rounded-xl hover:bg-cyan-600/30 transition">✏️ Modifica</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
