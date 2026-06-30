"use client";

import { useEffect, useState } from "react";

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
        className="bg-[#131c31] border border-[#1e2b4a] hover:bg-[#1e2b4a] text-slate-300 hover:text-white px-4 py-2 rounded-xl transition flex items-center gap-2 text-sm font-bold shadow-lg"
        title="Apri rubrica clienti"
      >
        Rubrica
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
          <div className="flex items-center gap-4">
            <h2 className="text-white font-extrabold text-lg">
              Database clienti
            </h2>
            <button
              onClick={() => {
                import("sweetalert2").then((module) => {
                  const Swal = module.default;
                  Swal.fire({
                    title: "Preparazione Export...",
                    text: "Stiamo generando il file CSV con l'anagrafica...",
                    icon: "info",
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    didOpen: () => {
                      Swal.showLoading();
                    }
                  });
                  window.location.href = `/api/export/customers?tenantId=${tenantId}`;
                  setTimeout(() => {
                    Swal.fire({
                      title: "Fatto!",
                      text: "L'esportazione della clientela è pronta.",
                      icon: "success",
                      timer: 2000,
                      showConfirmButton: false
                    });
                  }, 1500);
                });
              }}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-2 text-xs"
            >
              <span>📥</span> Esporta (CSV)
            </button>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1e2b4a] text-slate-300 hover:text-white hover:bg-red-500 transition"
          >
            x
          </button>
        </div>

        <div className="p-4 border-b border-[#1e2b4a] bg-[#0b1221] space-y-3">
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
            <p className="text-cyan-200 text-xs leading-relaxed">
              Demo CRM: prova note e preferenze con nomi e numeri finti. In una
              agenda reale queste informazioni restano private del negozio.
            </p>
          </div>
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
                            ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                            : "bg-[#1e2b4a] text-slate-500 border-transparent"
                        }`}
                        title="Assenze"
                      >
                        <span className="font-bold text-xs">
                          {customer.noShows}
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
                <span className="text-4xl mb-3">CRM</span>
                <p className="text-sm font-bold">Seleziona un cliente</p>
                <p className="text-xs mt-1">
                  Qui trovi storico, preferenze e note interne.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-white text-2xl font-extrabold capitalize">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-slate-400 font-mono text-sm mt-1">
                    {selectedCustomer.phone}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                      EUR {selectedCustomer.totalSpent}
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
