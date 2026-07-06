"use client";

import React, { useState } from "react";
import { CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import IPhone17Pro from "./IPhone17Pro";

interface StripeMockupProps {
  onSuccess: () => void;
  onCancel: () => void;
  amount: number;
}

export default function StripeMockup({ onSuccess, onCancel, amount }: StripeMockupProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePay = () => {
    setIsProcessing(true);
    // Simula il tempo di caricamento di Stripe
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <IPhone17Pro>
        
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white w-full animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={50} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Acconto Versato!</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Hai appena incassato <strong className="text-slate-800">€{amount.toFixed(2)}</strong>. <br/><br/>
              Questo cliente non ti darà mai più buca, altrimenti perderà i soldi.
            </p>
            <button 
              onClick={onSuccess}
              className="bg-green-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-green-500/30 hover:scale-105 transition-transform"
            >
              Ottimo, ho capito!
            </button>
          </div>
        ) : (
          <>
            {/* Header (Simil Stripe) */}
            <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 w-full">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="font-bold text-slate-600 text-xs">NX</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm">Demo NeatX Salone</h3>
                  <p className="text-xs text-slate-500">Acconto per Prenotazione</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-xl">€{amount.toFixed(2)}</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 flex-1 bg-white overflow-y-auto w-full">
              
              {/* Apple Pay / Google Pay Mock */}
              <button 
                onClick={handlePay}
                disabled={isProcessing}
                className="w-full bg-black text-white rounded-lg py-3 font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg viewBox="0 0 384 512" className="w-4 h-4 fill-current"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                    Paga con Apple Pay
                  </>
                )}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">oppure paga con carta</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Fake Credit Card Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input type="email" placeholder="cliente@esempio.com" className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Dati Carta</label>
                  <div className="border border-slate-300 rounded-md overflow-hidden flex items-center bg-white">
                    <div className="p-2.5 text-slate-400 border-r border-slate-200"><CreditCard size={18} /></div>
                    <input type="text" placeholder="1234 5678 9101 1121" className="w-full p-2.5 text-sm outline-none" />
                  </div>
                  <div className="flex border border-t-0 border-slate-300 rounded-b-md overflow-hidden -mt-1">
                    <input type="text" placeholder="MM/AA" className="w-1/2 p-2.5 text-sm border-r border-slate-200 outline-none" />
                    <input type="text" placeholder="CVC" className="w-1/2 p-2.5 text-sm outline-none" />
                  </div>
                </div>
              </div>

              <button 
                onClick={handlePay}
                disabled={isProcessing}
                className="w-full bg-[#0070ba] text-white rounded-lg py-3 font-semibold flex items-center justify-center gap-2 hover:bg-[#005ea6] transition-colors shadow-lg shadow-blue-500/20"
              >
                {isProcessing ? "Elaborazione..." : `Paga €${amount.toFixed(2)}`}
              </button>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 w-full">
              <button onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
                Annulla
              </button>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <ShieldCheck size={14} />
                <span>Pagamento Sicuro</span>
              </div>
            </div>
          </>
        )}

      </IPhone17Pro>
    </div>
  );
}
