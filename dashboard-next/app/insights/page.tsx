"use client";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Brain, Eye, TrendingUp, AlertTriangle } from "lucide-react";
import { api, FeatureImportance, Stats } from "@/lib/api";
import { fmt, CHART_COLORS } from "@/lib/utils";

const FEATURE_LABELS: Record<string, string> = {
  TV:                    "TV Budget",
  Radio:                 "Radio Budget",
  "Social Media":        "Social Media",
  Influencer_Mega:       "Influencer: Mega",
  Influencer_Micro:      "Influencer: Micro",
  Influencer_Nano:       "Influencer: Nano",
  Influencer_Macro:      "Influencer: Macro",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{FEATURE_LABELS[label] ?? label}</p>
      <p className="text-sm font-semibold text-indigo-400">
        Importance: {fmt(payload[0].value, 4)}
      </p>
    </div>
  );
};

function InsightCard({
  icon: Icon, title, desc, color,
}: { icon: React.ElementType; title: string; desc: string; color: string }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 p-2 rounded-lg bg-${color}-500/15`}>
          <Icon className={`w-4 h-4 text-${color}-400`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">{title}</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [fi, setFi] = useState<FeatureImportance | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([api.featureImportance(), api.stats()])
      .then(([f, s]) => { setFi(f); setStats(s); })
      .catch(() => setError(true));
  }, []);

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-slate-400 text-sm">API unavailable — run the FastAPI server first.</p>
    </div>
  );

  if (!fi || !stats) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-800 rounded-lg" />
      <div className="h-72 bg-slate-800 rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-800 rounded-xl" />)}
      </div>
    </div>
  );

  const topFeature = fi.features[0];
  const chartData  = fi.features.map(f => ({
    name:       f.feature,
    importance: f.importance,
  }));

  const correlations = Object.entries(stats.correlations).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Interpretability & Insights</h1>
        <p className="text-sm text-slate-400 mt-1">
          Feature importance from <span className="text-brand-400 font-medium">{fi.model.replace("_", " ")}</span> — explaining why the model predicts what it predicts
        </p>
      </div>

      {/* Feature importance chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Feature Importance</h2>
            <p className="text-xs text-slate-500 mt-0.5">Based on impurity reduction across all decision trees</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
            {fi.model.replace(/_/g, " ")}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" barSize={22} margin={{ left: 20 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => v.toFixed(3)} />
            <YAxis
              type="category" dataKey="name" width={130}
              tick={{ fontSize: 11 }}
              tickFormatter={v => FEATURE_LABELS[v] ?? v}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="importance" name="Importance" radius={[0, 6, 6, 0]} fill="url(#barGrad)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Correlation vs importance side-by-side */}
      <div className="grid grid-cols-2 gap-6">
        {/* Channel correlations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Channel → Sales Correlation</h2>
          <div className="space-y-3">
            {correlations.map(([ch, corr], i) => (
              <div key={ch} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{ch}</span>
                  <span className="font-mono font-semibold" style={{ color: CHART_COLORS[i] }}>
                    r = {fmt(corr, 4)}
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${corr * 100}%`, background: CHART_COLORS[i] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROI by Influencer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Avg ROI by Influencer</h2>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart
              data={Object.entries(stats.roi_by_influencer).map(([k, v]) => ({ name: k, roi: v }))}
              barSize={32}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(v: number) => [`${fmt(v, 4)}×`, "Avg ROI"]}
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
              />
              <Bar dataKey="roi" name="ROI" radius={[4, 4, 0, 0]}>
                {Object.keys(stats.roi_by_influencer).map((k, i) => (
                  <Cell key={k} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key insights */}
      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Key Findings</h2>
        <div className="grid grid-cols-2 gap-4">
          <InsightCard
            icon={TrendingUp}
            title="TV dominates"
            desc={`TV has the highest correlation with Sales (r=${fmt(stats.correlations["TV"], 3)}) and is the #1 feature by importance. Increasing TV spend shows the strongest marginal return.`}
            color="indigo"
          />
          <InsightCard
            icon={Eye}
            title="Radio is the #2 driver"
            desc={`Radio shows r=${fmt(stats.correlations["Radio"], 3)} with Sales — a strong secondary driver. Combined TV + Radio allocation explains most of the variance in campaign performance.`}
            color="violet"
          />
          <InsightCard
            icon={Brain}
            title="Influencer type matters less than budget"
            desc={`Influencer dummy variables have low importance scores. Budget size (especially TV) matters far more than influencer tier for predicting raw Sales volume.`}
            color="cyan"
          />
          <InsightCard
            icon={AlertTriangle}
            title="Diminishing returns on Social Media"
            desc={`Social Media has the lowest correlation (r=${fmt(stats.correlations["Social Media"], 3)}) despite being an increasingly invested channel. Allocating more to TV may yield higher returns.`}
            color="amber"
          />
        </div>
      </div>
    </div>
  );
}
