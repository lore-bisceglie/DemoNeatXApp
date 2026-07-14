"use client";

import { useEffect, useState } from "react";
import PaywallOverlay from "../../../dashboard/PaywallOverlay";

type DormantCustomer = {
  phone: string;
  name: string;
  lastVisit: string;
  daysSince: number;
  totalSpent: number;
};

export default function MarketingWidget({ tenantId, isPremium, plan, slug }: { tenantId: string, isPremium: boolean, plan?: string; slug?: string }) {
  const [data, setData] = useState<{count: number, customers: DormantCustomer[], estimatedRevenue: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  useEffect(() => {
    fetch(`/api/marketing/dormant?tenantId=${tenantId}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [tenantId]);

  if (loading) return (
    <div className="w-full bg-[#131c31] rounded-2xl p-6 border border-[#1e2b4a] animate-pulse h-32 mb-8">
      <div className="h-4 bg-slate-700 w-1/3 rounded mb-4"></div>
      <div className="h-8 bg-slate-700 w-1/4 rounded"></div>
    </div>
  );

  if (!data || data.count === 0) return null;

  return (
    <PaywallOverlay 
      title="Sblocca il Marketing Automatico" 
      description="Invia messaggi promozionali su WhatsApp ai clienti che non tornano da più di 30 giorni e falli tornare in salone in automatico." 
      plan={plan || (isPremium ? "elite" : "basic")}
      className="mb-8"
    >
      {/* Widget Dashboard */}
      <div className="w-full relative bg-gradient-to-br from-[#0b242e] to-[#050814] rounded-3xl p-6 border border-emerald-500/30 overflow-hidden group shadow-lg shadow-emerald-500/5">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition duration-700"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-emerald-500/30">Mini Marketing</span>
              <span className="text-slate-400 text-sm font-medium">Recupero Clienti</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white leading-tight">
              Hai <span className="text-emerald-400">{data.count} clienti</span> che non tornano da oltre 30 giorni.
            </h2>
            <p className="text-slate-400 mt-1">
              Valore potenziale stimato perso: <span className="text-white font-bold">€{data.estimatedRevenue}</span>
            </p>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="w-full md:w-auto px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-[#050814] font-black rounded-2xl transition transform hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>✨</span> {isPremium ? "Recupera Incasso" : "Sblocca Funzione"}
          </button>
        </div>
      </div>

      {/* Drawer Modale di Invio */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] animate-in fade-in duration-300 flex justify-end"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-[#0b1221] h-full shadow-2xl border-l border-[#1e2b4a] flex flex-col animate-in slide-in-from-right duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#1e2b4a] bg-[#131c31] flex items-center justify-between">
              <div>
                <h2 className="text-white font-extrabold text-xl flex items-center gap-2">
                  <span>🚀</span> Campagna Recupero Clienti
                </h2>
                <p className="text-slate-400 text-sm mt-1">Invia una promozione ai {data.count} clienti dormienti</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-full bg-[#1e2b4a] text-slate-300 hover:text-white hover:bg-red-500 transition flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {!isPremium ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center text-4xl mb-6 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                  🔒
                </div>
                <h3 className="text-3xl font-black text-white mb-4">Questa è una funzione Elite</h3>
                <p className="text-slate-400 mb-8 max-w-md">
                  Per soli 59€/mese puoi sbloccare il Mini-Marketing automatico. Basterebbe recuperare <strong className="text-white">solo 2 di questi {data.count} clienti</strong> per ripagarti l'abbonamento mensile.
                </p>
                <div className="bg-[#131c31] border border-amber-500/30 p-6 rounded-2xl w-full text-left relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0b1221]/50 to-[#0b1221] z-10 backdrop-blur-[2px]"></div>
                  <h4 className="text-amber-400 font-bold mb-2 uppercase tracking-widest text-xs z-0">Clienti in attesa di essere contattati:</h4>
                  {data.customers.slice(0,3).map((c, i) => (
                    <div key={i} className="py-2 border-b border-[#1e2b4a] flex justify-between">
                      <span className="text-white blur-[2px] select-none">Cliente Nas*****</span>
                      <span className="text-slate-500 blur-[1px] select-none">{c.daysSince} gg fa</span>
                    </div>
                  ))}
                </div>
                <a 
                  href={slug ? `/paywall/${slug}` : ("https://wa.me/" + (process.env.NEXT_PUBLIC_SALES_WHATSAPP_NUMBER || "393480480942") + "?text=Ciao!%20Vorrei%20passare%20al%20piano%20ELITE%20(59%C2%AC/mese)%20per%20il%20mio%20salone.")}
                  target={slug ? "_self" : "_blank"}
                  rel="noopener noreferrer"
                  className="inline-block text-center mt-8 w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black rounded-2xl shadow-lg transition transform hover:scale-105"
                >
                  Passa all'Elite a 59€/mese
                </a>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#070b14] flex flex-col gap-6">
                
                <div className="bg-[#131c31] border border-[#1e2b4a] rounded-2xl p-5">
                  <h3 className="text-white font-bold mb-4">Messaggio da inviare</h3>
                  <div className="bg-[#0b1221] border border-[#1e2b4a] p-4 rounded-xl text-emerald-300 font-mono text-sm leading-relaxed">
                    "Ciao [Nome Cliente]! Non ti vediamo da un po' e ci manchi 😢. Per farti tornare con il sorriso, ecco uno sconto del 10% sul tuo prossimo appuntamento. Prenota subito da qui: [Link Negozio]"
                  </div>
                  <p className="text-xs text-slate-500 mt-3">Il sistema personalizzerà il nome e aggiungerà il tuo link automatico.</p>
                </div>

                <div>
                  <h3 className="text-white font-bold mb-4 flex items-center justify-between">
                    Destinatari 
                    <span className="bg-[#1e2b4a] text-slate-300 text-xs px-2 py-1 rounded-md">{data.count} Selezionati</span>
                  </h3>
                  <div className="space-y-2">
                    {data.customers.map((c, i) => (
                      <div key={i} className="bg-[#131c31] border border-[#1e2b4a] p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-white font-bold text-sm">{c.name}</div>
                          <div className="text-slate-500 text-xs mt-1 font-mono">{c.phone}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-rose-400 text-xs font-bold bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
                            Assente da {c.daysSince} gg
                          </div>
                          <div className="text-slate-400 text-[10px] mt-1">
                            Spesa passata: €{c.totalSpent}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-6 pb-2">
                  {!messageSent ? (
                    <button 
                      onClick={() => {
                        setMessageSent(true);
                        setTimeout(() => {
                          setIsOpen(false);
                        }, 4000);
                      }}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-[#050814] font-black rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition transform hover:scale-[1.02] flex justify-center items-center gap-2"
                    >
                      <span>📲</span> Invia a {data.count} Clienti (Scatena la Magia)
                    </button>
                  ) : (
                    <div className="w-full py-4 bg-emerald-500/20 text-emerald-400 font-black rounded-2xl border border-emerald-500/30 flex justify-center items-center gap-2 animate-pulse">
                      <span>✅</span> Messaggi WhatsApp Inviati! Aspettati nuove prenotazioni a breve...
                    </div>
                  )}
                  <p className="text-center text-xs text-slate-500 mt-4">
                    Questa azione scalerà {data.count} crediti WhatsApp dal tuo piano.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PaywallOverlay>
  );
}
