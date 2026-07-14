"use client";
import PaywallOverlay from "./PaywallOverlay";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

interface AnalyticsChartProps {
  data: {
    date: string;
    revenue: number;
    appointments: number;
  }[];
  isPro?: boolean;
}

export default function AnalyticsChart({ data, isPro, plan }: AnalyticsChartProps & { plan?: string }) {
  if (!data || data.length === 0) {
    return <div className="text-slate-500 text-sm italic">Nessun dato disponibile per il grafico.</div>;
  }

  return (
    <PaywallOverlay 
      title="Sblocca le Statistiche Avanzate" 
      description="Scopri quali sono i tuoi giorni migliori, quanto incassi realmente, e tieni traccia della tua crescita finanziaria." 
      plan={plan || (isPro ? "elite" : "basic")}
    >
      <div className="bg-[#0b1221] border border-[#1a2642] p-6 rounded-3xl shadow-xl mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <span>📈</span> Andamento Incassi (Ultimi 14 giorni)
        </h2>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00b4ff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00b4ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              stroke="#475569" 
              fontSize={10} 
              tickMargin={10}
              tickFormatter={(val) => {
                const parts = val.split("-");
                return `${parts[2]}/${parts[1]}`;
              }}
            />
            <YAxis 
              stroke="#475569" 
              fontSize={10} 
              tickFormatter={(val) => `€${val}`}
            />
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2b4a" vertical={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#131c31', borderColor: '#1e2b4a', borderRadius: '12px', color: '#fff' }}
              itemStyle={{ color: '#00b4ff', fontWeight: 'bold' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              formatter={(value: any) => [`€${value || 0}`, 'Incasso']}
              labelFormatter={(label) => {
                const parts = label.split("-");
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#00b4ff" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </div>
    </PaywallOverlay>
  );
}
