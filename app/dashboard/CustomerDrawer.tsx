"use client";

import { useState, useEffect } from "react";

type Customer = {
  phone: string;
  name: string;
  visits: number;
  noShows: number;
};

export default function CustomerDrawer({ tenantId }: { tenantId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customers.length === 0) {
      fetchCustomers();
    }
  }, [isOpen, customers.length, tenantId]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?tenantId=${tenantId}`);
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error("Errore caricamento clienti", error);
    }
    setLoading(false);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-[#131c31] border border-[#1e2b4a] hover:bg-[#1e2b4a] text-slate-300 hover:text-white px-4 py-2 rounded-xl transition flex items-center gap-2 text-sm font-bold shadow-lg"
        title="Apri Rubrica Clienti"
      >
        <span>👥</span> Rubrica
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" onClick={() => setIsOpen(false)} />
      )}

      <div className={`fixed inset-y-0 right-0 w-full max-w-sm bg-[#0b1221] shadow-2xl border-l border-[#1e2b4a] z-[101] transform transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        
        <div className="p-5 border-b border-[#1e2b4a] flex items-center justify-between bg-[#131c31]">
          <h2 className="text-white font-extrabold text-lg flex items-center gap-2">👥 Database Clienti</h2>
          <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1e2b4a] text-slate-300 hover:text-white hover:bg-red-500 transition">✕</button>
        </div>

        <div className="p-4 border-b border-[#1e2b4a] bg-[#0b1221]">
          <input type="text" placeholder="Cerca un nome o un numero..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] placeholder-slate-500 transition text-sm" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <span className="text-2xl mb-2 animate-spin">⏳</span>
              <p className="text-sm font-medium animate-pulse">Caricamento anagrafica...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <span className="text-2xl mb-2 opacity-50">👻</span>
              <p className="text-sm">Nessun cliente trovato.</p>
            </div>
          ) : (
            filteredCustomers.map((c, idx) => (
              <div key={idx} className="bg-[#131c31] border border-[#1e2b4a] rounded-xl p-4 flex items-center justify-between hover:border-[#00b4ff]/50 transition group">
                <div>
                  <div className="text-white font-bold text-sm capitalize group-hover:text-[#00b4ff] transition-colors">{c.name}</div>
                  <div className="text-slate-400 text-xs mt-1 font-mono">{c.phone}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#1e2b4a] px-2 py-1.5 rounded-lg" title="Servizi totali">
                    <span className="text-[11px]">🌿</span>
                    <span className="text-white font-bold text-xs">{c.visits}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition ${c.noShows > 0 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'bg-[#1e2b4a] text-slate-500 border-transparent'}`} title="Cartellini Gialli">
                    <span className="text-[11px]">{c.noShows > 0 ? "🟨" : "⬜"}</span>
                    <span className="font-bold text-xs">{c.noShows}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}