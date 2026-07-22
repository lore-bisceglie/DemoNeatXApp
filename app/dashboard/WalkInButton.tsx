"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WalkInButton({ date, time, tenantId, services, staff = [], locationId }: { date: string; time: string; tenantId: string; services: any[]; staff?: any[]; locationId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(""); 
  const [selectedServiceId, setSelectedServiceId] = useState(services.length > 0 ? services[0].id : "");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBook = async () => {
    if (!name || !selectedServiceId) {
      alert("Inserisci il nome e seleziona un servizio.");
      return;
    }

    setLoading(true);
    const finalPhone = phone.trim() === "" ? "0000000000" : phone.trim();
    const serviceSelected = services.find(s => s.id === selectedServiceId);

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: finalPhone,
          date,
          time,
          source: "WALK_IN",
          honey: "",
          tenantId: tenantId,
          serviceId: selectedServiceId,
          duration: serviceSelected?.duration || 15,
          staffId: selectedStaffId || undefined,
          locationId: locationId || undefined,
        }),
      });

      if (res.ok) {
        setIsOpen(false);
        setName(""); setPhone(""); setSelectedStaffId("");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Errore durante il salvataggio.");
      }
    } catch (error) {
      console.error(error);
      alert("Si è verificato un errore di connessione.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label={`Aggiungi un appuntamento alle ${time}`}
        className="group w-[calc(100%_-_2px)] mx-px h-[calc(100%_-_2px)] my-px text-slate-500 hover:text-cyan-200 font-bold text-xs bg-white/[0.012] hover:bg-cyan-400/[0.05] rounded-lg border border-white/[0.055] hover:border-cyan-400/20 transition-colors flex items-center justify-center min-h-[30px] sm:min-h-[36px]"
      >
        <span className="inline-flex items-center gap-1 text-[10px] font-medium tracking-wider opacity-30 group-hover:opacity-100 transition-opacity">
          <span className="text-cyan-400/80 text-sm leading-none">+</span>
          <span className="hidden sm:inline">Libero</span>
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050814]/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b1221] border border-[#1e2b4a] rounded-3xl p-6 w-full max-w-sm shadow-2xl shadow-cyan-900/20 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white text-2xl font-bold leading-none">&times;</button>

            <h3 className="text-white font-extrabold text-lg mb-1">Nuovo Inserimento Admin</h3>
            <p className="text-slate-400 text-xs mb-5">Stai bloccando dalle <span className="text-[#00b4ff] font-bold">{time}</span></p>

            <div className="space-y-4 mb-6">
              <div>
                <input type="text" placeholder="Nome Cliente (Obbligatorio)" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00b4ff] transition" autoFocus />
              </div>
              <div>
                <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00b4ff] transition appearance-none">
                  {services.map(srv => (
                    <option key={srv.id} value={srv.id}>{srv.name} ({srv.duration} min)</option>
                  ))}
                </select>
              </div>
              {staff.length > 0 && (
                <div>
                  <select value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)} className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00b4ff] transition appearance-none">
                    <option value="">-- Nessun staff --</option>
                    {staff.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <input type="tel" placeholder="Telefono (Opzionale per WhatsApp)" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00b4ff] transition" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIsOpen(false)} className="flex-1 bg-transparent hover:bg-[#131c31] text-slate-400 hover:text-white font-bold py-3 rounded-xl border border-[#1e2b4a] transition text-sm">Annulla</button>
              <button onClick={handleBook} disabled={loading} className="flex-1 bg-[#00b4ff] hover:bg-cyan-400 text-[#050814] font-bold py-3 rounded-xl transition shadow-lg shadow-cyan-500/20 text-sm">{loading ? "Salvataggio..." : "Salva e Blocca"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
