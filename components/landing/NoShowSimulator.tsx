"use client";

import { CreditCard, LineChart } from "lucide-react";

type NoShowSimulatorProps = {
  onOpenStripe: () => void;
};

export default function NoShowSimulator({ onOpenStripe }: NoShowSimulatorProps) {
  return (
    <section className="relative z-10 bg-[#050814] py-32 border-t border-[#1a2642] overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(-1deg); }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(200px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(200px) rotate(-360deg); }
        }
        .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 5s ease-in-out infinite; }
        .animate-orbit { animation: orbit 20s linear infinite; }
        .tilt-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .tilt-card:hover { transform: perspective(1000px) rotateX(2deg) rotateY(-2deg) translateY(-5px); }
      `}} />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-[1px]">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-600/10 blur-[120px] rounded-full animate-orbit"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10 flex flex-col items-center justify-center">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Azzera i <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">No-Show.</span>
          </h2>
          <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
            Richiedi acconti o pagamenti completi in anticipo tramite Stripe o PayPal, direttamente integrati nella tua app. Niente più perdite di tempo e denaro.
          </p>
        </div>

        <div className="tilt-card animate-float-slow w-full max-w-3xl bg-[#0a0f1c]/80 backdrop-blur-xl p-10 md:p-14 rounded-[40px] border border-white/5 hover:border-cyan-500/40 relative overflow-hidden group shadow-[0_30px_60px_-15px_rgba(0,180,255,0.2)] flex flex-col items-center text-center">
          <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full group-hover:bg-cyan-500/20 transition-all duration-700"></div>
          <div className="relative z-10">
            <div className="w-24 h-24 mx-auto rounded-[2rem] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300 mb-8 shadow-[inset_0_0_30px_rgba(0,180,255,0.2)] animate-pulse">
              <CreditCard size={40} />
            </div>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Simulatore Incasso Acconti</h3>
            <p className="text-slate-300 leading-relaxed text-lg mb-10 max-w-xl mx-auto">
              Vuoi vedere in prima persona come i tuoi clienti pagheranno l&apos;acconto dal loro telefono? 
              Provalo tu stesso (è un finto checkout interattivo).
            </p>
            <button 
              onClick={onOpenStripe}
              className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold py-5 px-12 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all transform hover:scale-105 flex items-center justify-center gap-3 mx-auto w-full sm:w-auto text-xl"
            >
              <CreditCard size={22} />
              Simula Pagamento
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
