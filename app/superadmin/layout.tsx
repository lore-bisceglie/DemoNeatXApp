import { ReactNode } from "react";
import Link from "next/link";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <nav className="bg-[#0b1221] border-b border-[#1a2642] px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/superadmin" className="text-sm font-bold text-white hover:text-[#00b4ff] transition">
            🛡️ SuperAdmin
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/superadmin" className="text-slate-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-[#131c31]">
              Dashboard
            </Link>
            <Link href="/superadmin/agents" className="text-slate-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-[#131c31]">
              🤖 Agents
            </Link>
            <Link href="/superadmin/ai" className="text-slate-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-[#131c31]">
              🧠 AI Suite
            </Link>
          </div>
        </div>
        <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition">
          Torna al sito
        </Link>
      </nav>
      {children}
    </div>
  );
}
