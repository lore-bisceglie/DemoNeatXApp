export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#050814]/80 backdrop-blur-md flex flex-col items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-[40px] bg-gradient-to-r from-[#00b4ff] to-purple-500 opacity-40 animate-pulse"></div>
        <div className="w-16 h-16 border-4 border-[#1a2642] border-t-[#00b4ff] rounded-full animate-spin relative z-10"></div>
      </div>
      <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.2em] text-slate-400 animate-pulse">
        Caricamento...
      </p>
    </div>
  );
}
