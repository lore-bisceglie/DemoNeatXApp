"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

type Customer = {
  phone: string;
  name: string;
  visits: number;
  noShows: number;
  totalSpent: number;
  lastVisit: string | null;
  favoriteService: string | null;
  note: string;
  preference: string | null;
};

export default function CustomerDrawer({ tenantId }: { tenantId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [note, setNote] = useState("");
  const [preference, setPreference] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && customers.length === 0) {
      fetchCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const openCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setNote(customer.note || "");
    setPreference(customer.preference || "");
  };

  const saveCustomerNote = async () => {
    if (!selectedCustomer) return;

    setSaving(true);

    const res = await fetch("/api/customer-notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenantId,
        phone: selectedCustomer.phone,
        customerName: selectedCustomer.name,
        note,
        preference,
      }),
    });

    if (res.ok) {
      setCustomers((current) =>
        current.map((customer) =>
          customer.phone === selectedCustomer.phone
            ? { ...customer, note, preference }
            : customer
        )
      );
      setSelectedCustomer((current) =>
        current ? { ...current, note, preference } : current
      );
    }

    setSaving(false);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.phone.includes(search) ||
      (customer.favoriteService || "")
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-[#131c31] hover:bg-blue-500/10 text-slate-300 hover:text-blue-300 font-bold px-4 py-2.5 rounded-xl border border-[#1e2b4a] hover:border-blue-500/30 transition-all duration-150 flex items-center justify-center gap-2 text-sm whitespace-nowrap active:scale-95"
        title="Apri rubrica clienti"
      >
        <BookOpen size={16} className="text-blue-400" /> Rubrica
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
          <h2 className="text-white font-extrabold text-lg">
            Database clienti
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1e2b4a] text-slate-300 hover:text-white hover:bg-red-500 transition"
          >
            x
          </button>
        </div>

        <div className="p-4 border-b border-[#1e2b4a] bg-[#0b1221] space-y-3">
          <input
            type="text"
            placeholder="Cerca nome, numero o servizio..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] placeholder-slate-500 transition text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] min-h-0 flex-1">
          <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar border-r border-[#1e2b4a]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <span className="text-2xl mb-2 animate-spin">...</span>
                <p className="text-sm font-medium animate-pulse">
                  Caricamento anagrafica...
                </p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <span className="text-2xl mb-2 opacity-50">--</span>
                <p className="text-sm">Nessun cliente trovato.</p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <button
                  key={customer.phone}
                  type="button"
                  onClick={() => openCustomer(customer)}
                  className={`w-full bg-[#131c31] border rounded-xl p-4 text-left hover:border-[#00b4ff]/50 transition group ${
                    selectedCustomer?.phone === customer.phone
                      ? "border-[#00b4ff]/70"
                      : "border-[#1e2b4a]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-white font-bold text-sm capitalize group-hover:text-[#00b4ff] transition-colors truncate">
                        {customer.name}
                      </div>
                      <div className="text-slate-400 text-xs mt-1 font-mono">
                        {customer.phone}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center gap-1.5 bg-[#1e2b4a] px-2 py-1.5 rounded-lg"
                        title="Servizi totali"
                      >
                        <span className="text-white font-bold text-xs">
                          {customer.visits}
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition ${
                          customer.noShows > 0
                            ? "bg-red-500/10 text-red-500 border-red-500/30"
                            : "bg-[#1e2b4a] text-slate-500 border-transparent"
                        }`}
                        title="Assenze"
                      >
                        <span className="font-bold text-xs">
                          {customer.noShows > 0 ? `⚠️ ${customer.noShows}` : customer.noShows}
                        </span>
                      </div>
                    </div>
                  </div>
                  {customer.favoriteService && (
                    <p className="text-[11px] text-slate-500 mt-2 truncate">
                      {customer.favoriteService}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="p-5 overflow-y-auto custom-scrollbar">
            {!selectedCustomer ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                <span className="text-4xl mb-3">📋</span>
                <p className="text-sm font-bold">Seleziona un cliente</p>
                <p className="text-xs mt-1">
                  Storico visite, preferenze e note interne.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-white text-2xl font-extrabold capitalize">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-slate-400 font-mono text-sm mt-1 mb-4">
                    {selectedCustomer.phone}
                  </p>
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent("Ciao " + selectedCustomer.name + ", ti scriviamo dal salone per ")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-bold py-2 rounded-xl text-center transition flex items-center justify-center gap-2 text-sm"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                      WhatsApp
                    </a>
                    <a
                      href={`mailto:?subject=Messaggio%20dal%20Salone&body=${encodeURIComponent("Ciao " + selectedCustomer.name + ", \n\nTi scriviamo per ")}`}
                      className="flex-1 bg-[#00b4ff]/10 hover:bg-[#00b4ff]/20 border border-[#00b4ff]/30 text-[#00b4ff] font-bold py-2 rounded-xl text-center transition flex items-center justify-center gap-2 text-sm"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" /><path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" /></svg>
                      Invia Email
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {selectedCustomer.noShows > 0 && (
                    <div className="col-span-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-red-400">
                        <span className="font-extrabold uppercase text-xs tracking-widest">⚠️ Allerta No-Show</span>
                      </div>
                      <span className="text-red-400 font-bold text-sm">{selectedCustomer.noShows} assenze registrate</span>
                    </div>
                  )}
                  <div className="bg-[#131c31] border border-[#1e2b4a] rounded-2xl p-3">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                      Visite
                    </p>
                    <p className="text-2xl font-extrabold text-white">
                      {selectedCustomer.visits}
                    </p>
                  </div>
                  <div className="bg-[#131c31] border border-[#1e2b4a] rounded-2xl p-3">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                      Spesa stimata
                    </p>
                    <p className="text-2xl font-extrabold text-emerald-400">
                      €{selectedCustomer.totalSpent}
                    </p>
                  </div>
                  <div className="bg-[#131c31] border border-[#1e2b4a] rounded-2xl p-3">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                      Ultima visita
                    </p>
                    <p className="text-sm font-bold text-white">
                      {selectedCustomer.lastVisit
                        ? selectedCustomer.lastVisit.split("-").reverse().join("/")
                        : "Nessuna"}
                    </p>
                  </div>
                  <div className="bg-[#131c31] border border-[#1e2b4a] rounded-2xl p-3">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                      Preferito
                    </p>
                    <p className="text-sm font-bold text-white leading-tight">
                      {selectedCustomer.favoriteService || "Da scoprire"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">
                    Preferenze
                  </label>
                  <input
                    value={preference}
                    onChange={(event) => setPreference(event.target.value)}
                    placeholder="Es. mattina, cabina silenziosa, servizio preferito..."
                    className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00b4ff]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">
                    Note interne
                  </label>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={6}
                    placeholder="Appunti privati visibili solo in dashboard..."
                    className="w-full bg-[#131c31] border border-[#1e2b4a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00b4ff] resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={saveCustomerNote}
                  disabled={saving}
                  className="w-full bg-[#00b4ff] hover:bg-cyan-400 text-[#050814] font-bold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {saving ? "Salvataggio..." : "Salva scheda cliente"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
