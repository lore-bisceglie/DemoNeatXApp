"use client";

export default function Footer() {
  return (
    <footer className="relative z-10 w-full bg-[#050814] border-t border-[#1a2642]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="text-xl font-extrabold tracking-tight">
            <span className="text-white">Neat</span>
            <span className="text-[#00b4ff]">X</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-slate-400">
            <a href="https://www.iubenda.com/privacy-policy/32937890" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="https://www.iubenda.com/privacy-policy/32937890/cookie-policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#1a2642] to-transparent mb-8"></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium text-center md:text-left">
          <div>
            © {new Date().getFullYear()} NeatX Software. Tutti i diritti riservati.<br/>
            <span className="text-slate-600">Progettato per elevare il settore del benessere.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sistemi Operativi
          </div>
        </div>
      </div>
    </footer>
  );
}
