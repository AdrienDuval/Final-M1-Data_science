"use client";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { TrendingUp, Target, DollarSign, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { api, Stats } from "@/lib/api";
import { fmt, INFLUENCER_COLORS, CHART_COLORS } from "@/lib/utils";

const BUDGET_COLORS = { TV: "#6366f1", Radio: "#8b5cf6", "Social Media": "#06b6d4" };

function KPICard({
  title, value, sub, icon: Icon, trend, color = "indigo",
}: {
  title: string; value: string; sub: string;
  icon: React.ElementType; trend?: number; color?: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 text-indigo-400",
    violet: "from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400",
    cyan:   "from-cyan-500/20   to-cyan-500/5   border-cyan-500/20   text-cyan-400",
    emerald:"from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
  };
  return (
    <div className={`relative bg-gradient-to-br ${colorMap[color]} border rounded-xl p-5 overflow-hidden`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-100">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{sub}</p>
        </div>
        <div className={`p-2.5 rounded-lg bg-slate-800/60`}>
          <Icon className="w-5 h-5 text-slate-300" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          {trend >= 0
            ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
          <span className={`text-xs font-medium ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {Math.abs(trend)}% vs average
          </span>
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.stats().then(setStats).catch(() => setError(true));
  }, []);

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-slate-400 text-sm">Could not connect to API.</p>
        <p className="text-slate-600 text-xs mt-1">Make sure the FastAPI server is running on port 8000.</p>
        <code className="mt-3 block text-xs text-brand-400 bg-slate-800 px-3 py-2 rounded-lg">
          uvicorn api.main:app --reload --port 8000
        </code>
      </div>
    </div>
  );

  if (!stats) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-64 bg-slate-800 rounded-lg" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-800 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-72 bg-slate-800 rounded-xl" />)}
      </div>
    </div>
  );

  const budgetData = Object.entries(stats.budget_breakdown).map(([name, value]) => ({ name, value }));
  const influencerData = Object.entries(stats.sales_by_influencer).map(([name, value]) => ({ name, value }));
  const correlationData = Object.entries(stats.correlations).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Overview</h1>
        <p className="text-sm text-slate-400 mt-1">Marketing campaign performance at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Campaigns"
          value={stats.total_campaigns.toLocaleString()}
          sub="in dataset"
          icon={Target}
          color="indigo"
        />
        <KPICard
          title="Avg Sales"
          value={`${fmt(stats.avg_sales)}M`}
          sub="per campaign"
          icon={TrendingUp}
          color="violet"
        />
        <KPICard
          title="Avg ROI"
          value={`${fmt(stats.avg_roi)}×`}
          sub="sales / total budget"
          icon={DollarSign}
          color="cyan"
        />
        <KPICard
          title="Best Channel"
          value={stats.best_channel}
          sub={`corr ${fmt(stats.correlations[stats.best_channel], 3)} with Sales`}
          icon={Users}
          color="emerald"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-3 gap-6">
        {/* Sales Distribution */}
        <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Sales Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.sales_distribution}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} interval={3} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone" dataKey="count" name="Campaigns"
                stroke="#6366f1" strokeWidth={2} fill="url(#salesGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Budget Donut */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Avg Budget Mix</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={budgetData} dataKey="value" nameKey="name"
                cx="50%" cy="45%" innerRadius={55} outerRadius={80}
                paddingAngle={3}
              >
                {budgetData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={BUDGET_COLORS[entry.name as keyof typeof BUDGET_COLORS] ?? "#94a3b8"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [`${fmt(v)}M`, "Avg Budget"]}
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Legend
                iconType="circle" iconSize={8}
                formatter={(v) => <span className="text-xs text-slate-400">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Sales by Influencer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Avg Sales by Influencer Type</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={influencerData} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={48} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Avg Sales (M)" radius={[0, 4, 4, 0]}>
                {influencerData.map((e) => (
                  <Cell key={e.name} fill={INFLUENCER_COLORS[e.name] ?? "#6366f1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Correlation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-1">Channel Correlation with Sales</h2>
          <p className="text-xs text-slate-500 mb-4">Pearson r — how strongly each budget drives Sales</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={correlationData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Correlation" radius={[4, 4, 0, 0]}>
                {correlationData.map((e, i) => (
                  <Cell key={e.name} fill={CHART_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
