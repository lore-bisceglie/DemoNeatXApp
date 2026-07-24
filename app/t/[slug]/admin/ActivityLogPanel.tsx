"use client";
import { useEffect, useState } from "react";
import { ScrollText, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

type LogEntry = {
  id: string;
  action: string;
  actor: string;
  message: string;
  appointmentId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  date: string | null;
  time: string | null;
  metadata: string | null;
  createdAt: string;
};

const ACTION_COLORS: Record<string, string> = {
  BOOK: "text-emerald-400",
  CANCEL: "text-amber-400",
  DELETE: "text-red-400",
  NO_SHOW: "text-red-500",
  NOSHOW_FORGIVEN: "text-emerald-400",
  MOVE: "text-blue-400",
  PAID: "text-emerald-300",
  WALK_IN: "text-cyan-400",
  STRIPE_PAYMENT: "text-purple-400",
  STRIPE_ERROR: "text-red-500",
};

const ACTION_ICONS: Record<string, string> = {
  BOOK: "📅",
  CANCEL: "❌",
  DELETE: "🗑️",
  NO_SHOW: "🚫",
  NOSHOW_FORGIVEN: "✅",
  MOVE: "🔄",
  PAID: "💰",
  WALK_IN: "🚶",
  STRIPE_PAYMENT: "💳",
  STRIPE_ERROR: "⚠️",
};

export default function ActivityLogPanel({ tenantId }: { tenantId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchLogs = async (p: number = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/activity-logs?tenantId=${tenantId}&page=${p}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
        setPage(p);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && logs.length === 0) {
      fetchLogs();
    }
  }, [isOpen]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#0b1221] border border-[#1a2642] hover:border-[#2a3a5a] rounded-2xl px-5 py-3.5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ScrollText size={18} className="text-amber-400" />
          <span className="text-white font-bold text-sm">Registro Attività</span>
          <span className="text-slate-500 text-xs">({total} eventi)</span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>

      {isOpen && (
        <div className="mt-2 bg-[#0b1221] border border-[#1a2642] rounded-2xl overflow-hidden">
          {/* Header with refresh */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a2642]">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Log eventi recenti</span>
            <button onClick={() => fetchLogs(page)} disabled={loading} className="text-slate-500 hover:text-white transition-colors">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Log entries */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-[#1a2642]/50">
            {loading && logs.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">Caricamento...</div>
            ) : logs.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">Nessun evento registrato</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="px-4 py-3 hover:bg-[#131c31]/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{ACTION_ICONS[log.action] || "📋"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold uppercase tracking-wider ${ACTION_COLORS[log.action] || "text-slate-400"}`}>
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-slate-600">•</span>
                        <span className="text-[10px] text-slate-500">{log.actor}</span>
                      </div>
                      <p className="text-sm text-slate-300 mt-0.5 truncate">{log.message}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
                        <span>{formatDate(log.createdAt)}</span>
                        {log.customerPhone && <span>📞 {log.customerPhone}</span>}
                        {log.date && log.time && <span>🕐 {log.date} {log.time}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {total > 30 && (
            <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-[#1a2642]">
              <button
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1 || loading}
                className="text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Precedente
              </button>
              <span className="text-xs text-slate-500">Pag. {page} di {Math.ceil(total / 30)}</span>
              <button
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= Math.ceil(total / 30) || loading}
                className="text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Successiva →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
