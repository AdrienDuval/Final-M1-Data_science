"use client";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, ComposedChart, Line,
} from "recharts";
import { TrendingUp, Target, DollarSign, Users } from "lucide-react";
import { api, Stats } from "@/lib/api";
import { fmt, INFLUENCER_COLORS, CHART_COLORS } from "@/lib/utils";

const BUDGET_COLORS = { TV: "#4a9eff", Radio: "#8b5cf6", "Social Media": "#06b6d4" };

function StatCard({
  title, value, subtitle, icon: Icon,
}: {
  title: string; value: string; subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <div
      className="relative rounded-xl p-6 border border-[--border] overflow-hidden group"
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      {/* Accent left border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: "var(--accent)" }}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-label mb-2">{title}</p>
          <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            {value}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        </div>
        <div
          className="p-2.5 rounded-lg flex-shrink-0"
          style={{ backgroundColor: "var(--bg-input)" }}
        >
          <Icon className="w-5 h-5" style={{ color: "var(--accent)" }} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="border rounded-lg px-3 py-2 shadow-xl backdrop-blur-sm"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >
      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
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
        <p style={{ color: "var(--text-muted)" }} className="text-sm">
          Could not connect to API.
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Make sure the FastAPI server is running on port 8000.
        </p>
        <code
          className="mt-3 block text-xs px-3 py-2 rounded-lg"
          style={{
            color: "var(--accent)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          uvicorn api.main:app --reload --port 8000
        </code>
      </div>
    </div>
  );

  if (!stats) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-64 rounded-lg" style={{ backgroundColor: "var(--bg-card)" }} />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl" style={{ backgroundColor: "var(--bg-card)" }} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-80 rounded-xl" style={{ backgroundColor: "var(--bg-card)" }} />
        ))}
      </div>
    </div>
  );

  const budgetData = Object.entries(stats.budget_breakdown).map(([name, value]) => ({ name, value }));
  const influencerData = Object.entries(stats.sales_by_influencer).map(([name, value]) => ({ name, value }));
  const correlationData = Object.entries(stats.correlations).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1>Data Overview</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Marketing campaign performance at a glance
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Campaigns"
          value={stats.total_campaigns.toLocaleString()}
          subtitle="in dataset"
          icon={Target}
        />
        <StatCard
          title="Avg Sales"
          value={`${fmt(stats.avg_sales)}M`}
          subtitle="per campaign"
          icon={TrendingUp}
        />
        <StatCard
          title="Avg ROI"
          value={`${fmt(stats.avg_roi)}×`}
          subtitle="sales / total budget"
          icon={DollarSign}
        />
        <StatCard
          title="Best Channel"
          value={stats.best_channel}
          subtitle={`corr ${fmt(stats.correlations[stats.best_channel], 3)}`}
          icon={Users}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-6">
        {/* Sales Distribution */}
        <div className="col-span-2 rounded-xl p-6 border border-[--border]" style={{ backgroundColor: "var(--bg-card)" }}>
          <h2>Sales Distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.sales_distribution} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4a9eff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4a9eff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} interval={3} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone" dataKey="count" name="Campaigns"
                stroke="#4a9eff" strokeWidth={2} fill="url(#salesGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Budget Donut */}
        <div className="rounded-xl p-6 border border-[--border]" style={{ backgroundColor: "var(--bg-card)" }}>
          <h2>Avg Budget Mix</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={budgetData} dataKey="value" nameKey="name"
                cx="50%" cy="45%" innerRadius={55} outerRadius={80}
                paddingAngle={3}
              >
                {budgetData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={BUDGET_COLORS[entry.name as keyof typeof BUDGET_COLORS] ?? "#4a9eff"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [`${fmt(v)}M`, "Avg Budget"]}
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
                labelStyle={{ color: "var(--text-muted)" }}
              />
              <Legend
                iconType="circle" iconSize={8}
                formatter={(v) => <span className="text-xs" style={{ color: "var(--text-muted)" }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Evaluation Figures — 2-col × 3-row grid */}
      <div>
        <h2 className="mb-4">Model Evaluation Figures</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { src: "http://localhost:8000/figures/feature_importance.png", label: "Feature Importance" },
            { src: "http://localhost:8000/figures/regression_r2.png",      label: "Regression R²" },
            { src: "http://localhost:8000/figures/residuals.png",           label: "Residuals" },
            { src: "http://localhost:8000/figures/residuals_best.png",      label: "Residuals (Best Model)" },
            { src: "http://localhost:8000/figures/confusion_matrix.png",    label: "Confusion Matrix" },
            { src: "http://localhost:8000/figures/shap_summary.png",        label: "SHAP Summary" },
          ].map(({ src, label }) => (
            <div
              key={label}
              className="rounded-xl border border-[--border] overflow-hidden"
              style={{ backgroundColor: "var(--bg-card)" }}
            >
              <p
                className="text-xs font-medium px-3 py-2 border-b border-[--border]"
                style={{ color: "var(--text-muted)" }}
              >
                {label}
              </p>
              <div className="p-2">
                <img
                  src={src}
                  alt={label}
                  className="w-full h-auto rounded-md object-contain"
                  style={{ maxHeight: 220 }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Sales by Influencer */}
        <div className="rounded-xl p-6 border border-[--border]" style={{ backgroundColor: "var(--bg-card)" }}>
          <h2>Avg Sales by Influencer Type</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={influencerData} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={48} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Avg Sales (M)" radius={[0, 4, 4, 0]}>
                {influencerData.map((e) => (
                  <Cell key={e.name} fill={INFLUENCER_COLORS[e.name] ?? "#4a9eff"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Correlation */}
        <div className="rounded-xl p-6 border border-[--border]" style={{ backgroundColor: "var(--bg-card)" }}>
          <div>
            <h2>Channel Correlation with Sales</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Pearson r — how strongly each budget drives Sales
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
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
