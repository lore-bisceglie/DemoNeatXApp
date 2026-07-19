"use client";

export default function MessageRechargeCard({
  currentCredits,
}: {
  tenantId: string;
  slug: string;
  currentCredits: number;
}) {
  return (
    <div className="relative flex h-full min-h-[320px] flex-col justify-between overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-[#0b1221] to-[#0f192b] p-8 shadow-2xl">
      <div className="pointer-events-none absolute -bottom-6 -right-6 text-9xl text-amber-400 opacity-[0.03]">
        💬
      </div>

      <div className="relative z-10">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300">
          <span className="rounded-lg bg-amber-500/10 p-1.5">💬</span>
          Messaggi WhatsApp
        </h2>
        <div className="mt-2 flex flex-col gap-1">
          <span className="bg-gradient-to-br from-indigo-400 to-blue-200 bg-clip-text text-5xl font-black text-transparent">
            {currentCredits}
          </span>
          <span className="text-sm font-bold tracking-wide text-slate-500">
            crediti disponibili
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
        <p className="font-bold text-amber-200">Funzione temporaneamente disattivata</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">
          Non vengono inviati messaggi, non vengono consumati crediti e le ricariche restano sospese fino alla riattivazione del servizio.
        </p>
        <button disabled className="mt-4 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-500">
          Ricariche sospese
        </button>
      </div>
    </div>
  );
}
