"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type AgentStatus = {
  leads: { total: number; new: number; converted: number; lastLead: string | null };
  tenants: { activeTrials: number; paying: number; expired: number };
};

const AGENTS = [
  { id: "market_intelligence", name: "MarketIntelligence", desc: "Scansiona competitor, trova trend, genera idee", color: "cyan" },
  { id: "content_machine", name: "ContentMachine", desc: "Genera contenuti multi-canale: reel, blog, newsletter, social dalla stessa idea", color: "emerald" },
  { id: "content_advisor", name: "ContentAdvisor", desc: "Migliora il calendario contenuti con le idee ricevute", color: "indigo" },
  { id: "guardian", name: "Guardian", desc: "Report salute business + notifica Telegram", color: "amber" },
];

export default function SuperAdminAgentsPage() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/agents/status");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const runAgent = async (agentId: string) => {
    setRunning(agentId);
    setLog([]);
    try {
      const res = await fetch("/api/agents/trigger", { method: "POST" });
      if (res.ok) {
        setLog(prev => [...prev, `[${agentId}] ✅ Workflow triggerato su GitHub. Controlla Actions > auto-neatx-agents.`]);
      } else {
        const err = await res.json();
        setLog(prev => [...prev, `[${agentId}] ❌ ${err.error || 'Errore sconosciuto'}`]);
      }
    } catch (e: any) {
      setLog(prev => [...prev, `[${agentId}] ❌ ${e.message}`]);
    }
    setRunning(null);
    setTimeout(fetchStatus, 3000);
  };

  return (
    <main className="min-h-screen bg-[#050814] text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold">🤖 NeatX Agents</h1>
            <p className="text-slate-400 text-sm mt-1">Dashboard di controllo agenti autonomi</p>
          </div>
          <Link href="/superadmin" className="text-sm text-slate-400 hover:text-white transition">&larr; Torna a SuperAdmin</Link>
        </div>

        {/* Stats overview */}
        {status && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl border border-cyan-500/20 bg-[#0b1221] p-4">
              <div className="text-2xl font-black text-cyan-400">{status.tenants.activeTrials}</div>
              <div className="text-xs text-slate-500 font-medium">Trial Attivi</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-[#0b1221] p-4">
              <div className="text-2xl font-black text-emerald-400">{status.tenants.paying}</div>
              <div className="text-xs text-slate-500 font-medium">Paganti</div>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-[#0b1221] p-4">
              <div className="text-2xl font-black text-amber-400">{status.leads.new}</div>
              <div className="text-xs text-slate-500 font-medium">Lead Nuovi</div>
            </div>
            <div className="rounded-2xl border border-purple-500/20 bg-[#0b1221] p-4">
              <div className="text-2xl font-black text-purple-400">{status.leads.total}</div>
              <div className="text-xs text-slate-500 font-medium">Lead Totali</div>
            </div>
          </div>
        )}

        {/* Agent cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {AGENTS.map(agent => {
            const colors: Record<string, string> = {
              cyan: "border-cyan-500/20 text-cyan-400",
              emerald: "border-emerald-500/20 text-emerald-400",
              amber: "border-amber-500/20 text-amber-400",
            };
            return (
              <div key={agent.id} className={`rounded-2xl border ${colors[agent.color]} bg-[#0b1221] p-5 flex flex-col`}>
                <h3 className="font-extrabold text-lg mb-1">{agent.name}</h3>
                <p className="text-sm text-slate-400 flex-1 mb-4">{agent.desc}</p>
                <button
                  onClick={() => runAgent(agent.id)}
                  disabled={running === agent.id}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/10 transition disabled:opacity-50"
                >
                  {running === agent.id ? "Avvio..." : "▶ Esegui ora"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Activity log */}
        {log.length > 0 && (
          <div className="rounded-2xl border border-[#1e2b4a] bg-[#0b1221] p-4">
            <h3 className="text-sm font-extrabold text-slate-400 mb-2">Log Attivita</h3>
            <div className="space-y-1">
              {log.map((line, i) => (
                <div key={i} className="text-xs font-mono text-slate-500">{line}</div>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && <div className="text-slate-500 text-center py-12">Caricamento dati agenti...</div>}
      </div>
    </main>
  );
}
