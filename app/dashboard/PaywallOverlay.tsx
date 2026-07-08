export default function PaywallOverlay({ title, description, isPro, children }: { title: string, description: string, isPro: boolean, children: React.ReactNode }) {
  if (isPro) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-2xl group">
      {/* Il contenuto sfocato sotto il lucchetto */}
      <div className="filter blur-sm opacity-50 pointer-events-none select-none transition-all group-hover:blur-md">
        {children}
      </div>

      {/* L'overlay con il lucchetto */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-black/20 backdrop-blur-[2px]">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(245,158,11,0.4)] border border-amber-300/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h3>
        <p className="text-sm text-slate-300 mb-6 max-w-[280px] leading-relaxed">{description}</p>
        
        <button 
          onClick={() => window.open('https://demo-neatx.vercel.app', '_blank')} 
          className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 hover:scale-105 transition-all shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
        >
          Sblocca col Piano PRO
        </button>
      </div>
    </div>
  );
}
