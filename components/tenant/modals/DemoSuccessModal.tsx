import React from "react";
import Link from "next/link";
import { ThemeConfig } from "../types";

export interface DemoModalState {
  show: boolean;
  date: string;
  time: string;
  serviceName: string;
  paymentLabel: string;
  customerName: string;
  customerPhone: string;
  cancelPath: string;
  price: number;
}

interface DemoSuccessModalProps {
  demoModal: DemoModalState;
  setDemoModal: (state: DemoModalState) => void;
  isPlaygroundDemo: boolean;
  tenantAdminUrl: string;
  th: ThemeConfig;
}

export function DemoSuccessModal({
  demoModal,
  setDemoModal,
  isPlaygroundDemo,
  tenantAdminUrl,
  th,
}: DemoSuccessModalProps) {
  if (!demoModal.show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
      <div className="bg-[#0b1221] border border-[#00b4ff]/30 p-6 rounded-3xl shadow-2xl shadow-cyan-900/20 max-w-md w-full text-center transform scale-100 animate-in fade-in zoom-in duration-200">
        <div className="text-4xl mb-4">🚀</div>
        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
          {isPlaygroundDemo ? "Prenotazione Demo Salvata" : "Prenotazione salvata"}
        </h3>
        <p className="text-sm text-slate-400 mb-4 leading-relaxed">
          Hai prenotato <strong>{demoModal.serviceName}</strong> per il <strong>{demoModal.date.split("-").reverse().join("/")}</strong> alle <strong>{demoModal.time}</strong>.<br /><br />
          Metodo: <strong>{demoModal.paymentLabel}</strong>.
        </p>

        <div className="mb-4 rounded-2xl border border-emerald-500/25 bg-emerald-950/30 p-4 text-left">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-300">
              {isPlaygroundDemo ? "Anteprima WhatsApp" : "Conferma prenotazione"}
            </p>
            <span className="text-[10px] text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
              {isPlaygroundDemo ? "simulata" : "test"}
            </span>
          </div>
          <div className="bg-[#075e54] rounded-2xl p-3 text-white text-[12px] leading-relaxed shadow-lg">
            <p className="font-bold mb-2">✨ Nuova Prenotazione!</p>
            <p>👤 Cliente: {demoModal.customerName}</p>
            <p>📞 Telefono: {demoModal.customerPhone || "3330000000"}</p>
            <p>📅 Data: {demoModal.date.split("-").reverse().join("/")}</p>
            <p>⏰ Ora: {demoModal.time}</p>
            <p>💼 Servizio: {demoModal.serviceName}</p>
            <p className="mt-2">
              ❌ Link annullo: {demoModal.cancelPath}
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-[#1e2b4a] bg-[#131c31] p-4 text-left">
          <p className="text-xs font-extrabold text-white mb-1">
            {demoModal.paymentLabel.includes("online")
              ? "Pagamento demo completato"
              : "Pagamento segnato in sede"}
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {demoModal.paymentLabel.includes("online")
              ? `Nella dashboard lo vedrai già come pagato: ${demoModal.price} EUR simulati, senza addebiti reali.`
              : isPlaygroundDemo
              ? "Nella dashboard il titolare potrà segnarlo pagato con un tocco."
              : "La prenotazione test ora appare nella dashboard del negozio."}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href={tenantAdminUrl}
            className={`w-full font-bold py-3 rounded-xl transition shadow-lg ${th.btnBg}`}
          >
            Vedi in dashboard
          </Link>
          <button 
            onClick={() =>
              setDemoModal({
                show: false,
                date: "",
                time: "",
                serviceName: "",
                paymentLabel: "",
                customerName: "",
                customerPhone: "",
                cancelPath: "",
                price: 0,
              })
            }
            className="w-full bg-[#131c31] hover:bg-[#1a2642] text-white border border-[#1e2b4a] hover:border-[#00b4ff]/50 font-bold py-3 rounded-xl transition shadow-lg"
          >
            Resta qui
          </button>
        </div>
      </div>
    </div>
  );
}
