"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [template, setTemplate] = useState("barbiere");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
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
  const [searchTerm, setSearchTerm] = useState("");

  const [stats, setStats] = useState({ totalAppointments: 0, totalRevenue: 0, totalNoShows: 0 });

  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  const fetchTenants = async (pwd: string) => {
    try {
      const res = await fetch('/api/superadmin/list', {
        headers: { 'x-admin-password': pwd }
      });
      if (res.status === 401) {
        setAuthError("Password errata");
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const errData = await res.json();
        setAuthError("Errore API: " + (errData.error || res.statusText));
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setTenants(data.tenants || (Array.isArray(data) ? data : []));
      if (data.stats) setStats(data.stats);
      
      // Imposta il cookie per far apparire il Godmode Hub in tutto il sito
      document.cookie = "superadmin_god_eye=true; path=/; max-age=86400";
      
      setIsAuthenticated(true);
      setAuthError("");
    } catch (e: any) {
      console.error(e);
      setAuthError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Non carichiamo al mount, aspettiamo la password
    setLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchTenants(password);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const res = await fetch('/api/superadmin', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': password 
        },
        body: JSON.stringify({ 
          name, slug, template, adminPassword: tenantPassword, ownerEmail,
          phone, address, instagramUrl, mapsLink, description, openTime, closeTime,
          logoUrl, themeColor
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Errore sconosciuto");
      }

      setName("");
      setSlug("");
      setTenantPassword("");
      setPhone("");
      setAddress("");
      setInstagramUrl("");
      setMapsLink("");
      setDescription("");
      setOpenTime("");
      setCloseTime("");
      setLogoUrl("");
      setThemeColor("cyan");
      fetchTenants(password); // Aggiorna la lista
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleUnlock = async (tenantId: string) => {
    try {
      const res = await fetch('/api/superadmin/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ tenantId, days: 30 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante lo sblocco');
      fetchTenants(password);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUnlockAnnual = async (tenantId: string) => {
    try {
      const res = await fetch('/api/superadmin/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ tenantId, days: 365, plan: 'annual' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante lo sblocco');
      fetchTenants(password);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (tenantId: string, tenantName: string) => {
    if (!confirm(`Sei sicuro di voler ELIMINARE DEFINITIVAMENTE il negozio "${tenantName}"? Questa operazione è irreversibile e cancellerà anche tutti gli appuntamenti e i servizi.`)) return;
    
    try {
      const res = await fetch('/api/superadmin/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ tenantId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante la cancellazione');
      fetchTenants(password);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleMakePremium = async (tenantId: string) => {
    if (!confirm('Vuoi promuovere questo cliente al piano Premium (PRO)?')) return;
    try {
      const res = await fetch('/api/superadmin/premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ tenantId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore');
      fetchTenants(password);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleMakeBasic = async (tenantId: string) => {
    if (!confirm('Vuoi retrocedere questo cliente al piano Basic? I lucchetti si riattiveranno.')) return;
    try {
      const res = await fetch('/api/superadmin/basic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ tenantId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore');
      fetchTenants(password);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleImpersonate = (slug: string, adminPassword: string | null) => {
    if (!adminPassword) {
      alert("Questo tenant non ha ancora una password admin generata.");
      return;
    }
    const isLocal = window.location.hostname.includes('localhost');
    const domainStr = isLocal ? '' : `; domain=.neatx.store`;
    document.cookie = `admin_auth_${slug}=${adminPassword}; path=/; max-age=86400${domainStr}`;
    
    const baseUrl = isLocal ? `http://${slug}.localhost:3000` : `https://${slug}.neatx.store`;
    window.open(`${baseUrl}/admin`, '_blank');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050814] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 p-8 rounded-xl max-w-md w-full shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Super Admin Login</h1>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Inserisci la password segreta"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 mb-4"
          />
          {authError && <div className="text-red-400 text-sm mb-4">{authError}</div>}
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg">
            {loading ? "Verifica..." : "Entra"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050814] text-slate-200 p-8 font-sans">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/" className="text-sm font-medium flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors">
                🏠 Torna al Sito Pubblico
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
              Pannello Super Admin (NeatX SaaS)
            </h1>
            <p className="text-slate-400">Pannello di controllo globale (Godmode)</p>
          </div>
      </div>

      {/* GOD-EYE STATS */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity blur"></div>
          <h3 className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-widest relative">Appuntamenti Globali</h3>
          <div className="text-4xl font-extrabold text-white relative">{stats.totalAppointments}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-20 transition-opacity blur"></div>
          <h3 className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-widest relative">Valore Mosso (Teorico)</h3>
          <div className="text-4xl font-extrabold text-emerald-400 relative">€ {stats.totalRevenue.toLocaleString('it-IT')}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden group">
          <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-red-500 opacity-0 group-hover:opacity-20 transition-opacity blur"></div>
          <h3 className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-widest relative">No-Show Sventati</h3>
          <div className="text-4xl font-extrabold text-rose-400 relative">{stats.totalNoShows}</div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Colonna Creazione (1/4) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
            <h2 className="text-xl font-semibold mb-4 text-white">Crea Nuovo Cliente</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nome Attività</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Es. Studio Dentistico Rossi" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Email Proprietario</label>
                <input 
                  type="email" 
                  value={ownerEmail} 
                  onChange={e => setOwnerEmail(e.target.value)} 
                  placeholder="Es. mario.rossi@email.com" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">Se inserita, invieremo in automatico l'email di Benvenuto con le credenziali.</p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Link Personalizzato (Slug)</label>
                <div className="flex items-center">
                  <span className="text-slate-500 bg-slate-950 border border-r-0 border-slate-800 rounded-l-lg p-3 text-sm">https://</span>
                  <input 
                    type="text" 
                    value={slug} 
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
                    placeholder="studio-rossi" 
                    className="w-full bg-slate-950 border border-slate-800 p-3 text-white focus:outline-none focus:border-indigo-500"
                    required 
                  />
                  <span className="text-slate-500 bg-slate-950 border border-l-0 border-slate-800 rounded-r-lg p-3 text-sm">.neatx.store</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Password d'Accesso Iniziale</label>
                <input 
                  type="text" 
                  value={tenantPassword} 
                  onChange={e => setTenantPassword(e.target.value)} 
                  placeholder="Es. Segreta2026!" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                  required 
                />
                <p className="text-xs text-slate-500 mt-1">La password che il cliente userà per accedere a admin.</p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Template Servizi</label>
                <select 
                  value={template} 
                  onChange={e => setTemplate(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="barbiere">💈 Barbiere (Taglio, Barba)</option>
                  <option value="parrucchiere">✂️ Parrucchiere (Taglio Donna, Colore)</option>
                  <option value="estetista">💅 Centro Estetico / Nails (Massaggi, Unghie)</option>
                  <option value="medico">🩺 Medico / Fisioterapista (Visite, Controlli)</option>
                  <option value="nutrizionista">🥗 Nutrizionista (Prima Visita, Dieta)</option>
                  <option value="psicologo">🛋️ Psicologo (Seduta, Prima Visita)</option>
                  <option value="personaltrainer">🏋️ Personal Trainer (Lezioni Singole)</option>
                  <option value="tatuatore">🖋️ Tatuatore / Piercer (Tatuaggi, Consulenze)</option>
                  <option value="consulente">💼 Consulente / Avvocato (Consulenze 30/60m)</option>
                  <option value="toelettatura">🐕 Dog Sitter / Toelettatura (Bagno, Taglio)</option>
                  <option value="vuoto">Vuoto (Solo Standard)</option>
                </select>
              </div>

              <details className="group border border-slate-800 rounded-lg bg-slate-950 overflow-hidden">
                <summary className="cursor-pointer p-4 font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-all focus:outline-none">
                  ⚙️ Impostazioni Avanzate (Opzionali)
                </summary>
                <div className="p-4 pt-0 space-y-4 border-t border-slate-800 mt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Telefono (WhatsApp)</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Es. +39 333 1234567" className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Indirizzo Fisico</label>
                      <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Es. Via Roma 1, Milano" className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Link Instagram</label>
                      <input type="url" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/tuoprofilo" className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Link Google Maps</label>
                      <input type="url" value={mapsLink} onChange={e => setMapsLink(e.target.value)} placeholder="https://maps.google.com/..." className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Orario Apertura</label>
                      <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Orario Chiusura</label>
                      <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Descrizione Negozio (Sotto il titolo)</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Es. Il tuo stile impeccabile, a portata di click." className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-white text-sm h-16 resize-none focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Link Logo / Foto (o Carica dal PC)</label>
                      <div className="flex gap-2">
                        <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://... o clicca l'icona 👉" className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                        <label className="bg-slate-800 hover:bg-slate-700 cursor-pointer border border-slate-700 rounded-md px-3 flex items-center justify-center transition-colors" title="Carica foto dal PC">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const img = new Image();
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  const MAX_WIDTH = 500;
                                  const MAX_HEIGHT = 500;
                                  let width = img.width;
                                  let height = img.height;
                                  if (width > height) {
                                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                                  } else {
                                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                                  }
                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext('2d');
                                  ctx?.drawImage(img, 0, 0, width, height);
                                  const base64Url = canvas.toDataURL('image/webp', 0.8);
                                  setLogoUrl(base64Url);
                                };
                                img.src = event.target?.result as string;
                              };
                              reader.readAsDataURL(file);
                            }} 
                          />
                          <span className="text-lg">📁</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Tema Colore</label>
                      <select value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                        <option value="cyan">🔵 Cyan (Default)</option>
                        <option value="rose">🌸 Rosa Cipria</option>
                        <option value="emerald">🌿 Smeraldo</option>
                        <option value="amber">💛 Ambra</option>
                        <option value="purple">💜 Viola</option>
                        <option value="slate">🪨 Grigio Ardesia (Elegante)</option>
                        <option value="red">🔴 Rosso Acceso</option>
                        <option value="indigo">🌌 Blu Indaco</option>
                        <option value="teal">🌊 Verde Acqua</option>
                        <option value="fuchsia">🌺 Fucsia Vibrante</option>
                      </select>
                    </div>
                  </div>
                </div>
              </details>

              {error && <div className="p-3 bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-lg">{error}</div>}

              <button 
                type="submit" 
                disabled={creating}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {creating ? "Creazione in corso..." : "Genera Cliente 🚀"}
              </button>
            </form>
          </div>

          {/* Lista Clienti */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-white">Clienti Attivi ({tenants.length})</h2>
              <input 
                type="text" 
                placeholder="Cerca negozio o email..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            {loading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-800 rounded"></div>
                    <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {tenants.filter(t => 
                  t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  (t.ownerEmail && t.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  t.slug.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((tenant) => {
                  const now = new Date();
                  const trialEndsAt = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : null;
                  const isTrialExpired = trialEndsAt && now > trialEndsAt;
                  const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 3600 * 24)) : 0;
                  
                  return (
                  <div key={tenant.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl flex flex-col justify-between group hover:border-indigo-500/50 transition-colors gap-4">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-white text-lg leading-tight truncate mr-2" title={tenant.name}>{tenant.name}</h3>
                        {tenant.plan === 'premium' && <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0">Premium</span>}
                      </div>
                      <div className="text-sm text-slate-400 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-800 px-2 py-1 rounded text-xs">{tenant.services?.length || 0} servizi</span>
                          <span className="text-xs">Creato il {new Date(tenant.createdAt).toLocaleDateString('it-IT')}</span>
                        </div>
                        {trialEndsAt && tenant.plan !== 'premium' && (
                          <div className={`flex items-center gap-2 text-xs font-bold ${isTrialExpired ? 'text-red-400' : 'text-orange-400'}`}>
                            {isTrialExpired ? '🔒 ABBONAMENTO SCADUTO' : `⏳ ${daysLeft} gg di prova`}
                          </div>
                        )}
                        {tenant.ownerEmail && <div className="text-xs truncate text-slate-500 mt-1" title={tenant.ownerEmail}>📧 {tenant.ownerEmail}</div>}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-slate-800/50">
                      <div className="flex gap-2 w-full">
                        <a 
                          href={`https://${tenant.slug}.neatx.store`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 text-center text-xs text-indigo-400 hover:text-indigo-300 font-medium bg-indigo-500/10 px-2 py-2 rounded-lg transition-colors flex items-center justify-center"
                        >
                          Sito Pubblico
                        </a>
                        <button 
                          onClick={() => handleImpersonate(tenant.slug, tenant.adminPassword)}
                          title="Entra come Admin (Impersonate)"
                          className="flex-1 text-center text-xs text-amber-400 hover:text-amber-300 font-medium bg-amber-500/10 px-2 py-2 rounded-lg transition-all border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-center justify-center"
                        >
                          🕵️‍♂️ Entra
                        </button>
                        <button 
                          onClick={() => handleDelete(tenant.id, tenant.name)}
                          title="Elimina negozio"
                          className="text-xs font-medium flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 px-3 py-2 rounded-lg transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                      
                      <div className="flex gap-2 w-full flex-wrap xl:flex-nowrap">
                        <button 
                          onClick={() => handleUnlock(tenant.id)}
                          className="flex-1 text-[10px] font-bold px-2 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all text-center"
                        >
                          SBLOCCA 30 GG
                        </button>
                        <button 
                          onClick={() => handleUnlockAnnual(tenant.id)}
                          className="flex-1 text-[10px] font-bold px-2 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all text-center whitespace-nowrap"
                        >
                          📅 SBLOCCA 1 ANNO
                        </button>
                        {tenant.plan !== 'premium' ? (
                          <button 
                            onClick={() => handleMakePremium(tenant.id)}
                            className="flex-1 text-[10px] font-bold px-2 py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 transition-all text-center"
                          >
                            👑 METTI PRO
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleMakeBasic(tenant.id)}
                            className="flex-1 text-[10px] font-bold px-2 py-2 rounded-lg bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border border-slate-500/20 transition-all text-center"
                          >
                            🔒 METTI BASIC
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )})}
                
                {tenants.filter(t => 
                  t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  (t.ownerEmail && t.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  t.slug.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-12 text-slate-500 lg:col-span-3">
                    <div className="text-4xl mb-2">👻</div>
                    Nessun cliente trovato.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
