"use client";

import { useState, useEffect } from "react";

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [template, setTemplate] = useState("barbiere");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

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
      const data = await res.json();
      setTenants(data);
      setIsAuthenticated(true);
      setAuthError("");
    } catch (e) {
      console.error(e);
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
        body: JSON.stringify({ name, slug, template })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Errore sconosciuto");
      }

      setName("");
      setSlug("");
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
            Pannello Super Admin (NeatX SaaS)
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form Creazione */}
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
                <label className="block text-sm text-slate-400 mb-1">Template Servizi</label>
                <select 
                  value={template} 
                  onChange={e => setTemplate(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="barbiere">💈 Barbiere (Taglio, Barba)</option>
                  <option value="estetista">💆‍♀️ Estetica (Massaggio, Pulizia Viso)</option>
                  <option value="psicologo">🛋️ Psicologo (Seduta, Prima Visita)</option>
                  <option value="vuoto">Vuoto (Solo Standard)</option>
                </select>
              </div>

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
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-white">Clienti Attivi ({tenants.length})</h2>
            
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
              <div className="space-y-4">
                {tenants.map((tenant) => {
                  const now = new Date();
                  const trialEndsAt = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : null;
                  const isTrialExpired = trialEndsAt && now > trialEndsAt;
                  const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 3600 * 24)) : 0;
                  
                  return (
                  <div key={tenant.id} className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex items-center justify-between group">
                    <div>
                      <h3 className="font-bold text-white text-lg">{tenant.name}</h3>
                      <div className="text-sm text-slate-400 mt-1 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-800 px-2 py-1 rounded text-xs">{tenant.services?.length || 0} servizi</span>
                          <span>Creato il {new Date(tenant.createdAt).toLocaleDateString('it-IT')}</span>
                        </div>
                        {trialEndsAt && (
                          <div className={`flex items-center gap-2 text-xs font-bold ${isTrialExpired ? 'text-red-400' : 'text-orange-400'}`}>
                            {isTrialExpired ? '🔒 ABBONAMENTO SCADUTO' : `⏳ ${daysLeft} giorni rimanenti`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <a 
                        href={`https://${tenant.slug}.neatx.store`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-full"
                      >
                        Vedi App ↗
                      </a>
                      <button 
                        onClick={() => handleUnlock(tenant.id)}
                        className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                      >
                        SBLOCCA +30 GG
                      </button>
                    </div>
                  </div>
                )})}
                
                {tenants.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <div className="text-4xl mb-2">👻</div>
                    Nessun cliente ancora. Creane uno qui a sinistra!
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
