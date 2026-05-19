"use client";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { Trophy, CheckCircle2 } from "lucide-react";
import { api, ModelMetric } from "@/lib/api";
import { fmt, CHART_COLORS } from "@/lib/utils";

const MODEL_LABELS: Record<string, string> = {
  linear_regression: "Linear Reg.",
  random_forest:     "Random Forest",
  gradient_boosting: "Gradient Boost",
  xgboost:           "XGBoost",
  mlp:               "MLP (DL)",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {fmt(p.value, 4)}
        </p>
      ))}
    </div>
  );
};

function MetricBadge({ value, best, low }: { value: number; best: number; low?: boolean }) {
  const isBest = Math.abs(value - best) < 1e-6;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold
      ${isBest ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30" : "text-slate-300"}`}>
      {isBest && <CheckCircle2 className="w-3 h-3" />}
      {fmt(value, 4)}
    </span>
  );
}

export default function ModelsPage() {
  const [models, setModels] = useState<ModelMetric[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.metrics().then(d => setModels(d.models)).catch(() => setError(true));
  }, []);

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-slate-400 text-sm">API unavailable — run the FastAPI server first.</p>
    </div>
  );

  if (!models) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-800 rounded-lg" />
      <div className="h-64 bg-slate-800 rounded-xl" />
      <div className="h-64 bg-slate-800 rounded-xl" />
    </div>
  );

  const bestR2   = Math.max(...models.map(m => m.r2));
  const bestRMSE = Math.min(...models.map(m => m.rmse));
  const bestMAE  = Math.min(...models.map(m => m.mae));
  const best     = models.find(m => m.r2 === bestR2)!;

  const chartData = models.map((m, i) => ({
    name:  MODEL_LABELS[m.name] ?? m.label,
    R2:    m.r2,
    RMSE:  m.rmse,
    MAE:   m.mae,
    fill:  CHART_COLORS[i % CHART_COLORS.length],
  }));

  const radarData = ["R²", "Stability", "Speed", "Interpretability"].map(attr => {
    const row: Record<string, number | string> = { attr };
    models.forEach((m, i) => {
      const key = MODEL_LABELS[m.name] ?? m.label;
      if (attr === "R²")              row[key] = m.r2 * 100;
      if (attr === "Stability")       row[key] = (1 - m.cv_r2_std * 10) * 100;
      if (attr === "Speed")           row[key] = m.name === "linear_regression" ? 99 : m.name === "mlp" ? 45 : m.name === "random_forest" ? 70 : 65;
      if (attr === "Interpretability") row[key] = m.name === "linear_regression" ? 95 : m.name === "mlp" ? 30 : 65;
    });
    return row;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Model Comparison</h1>
        <p className="text-sm text-slate-400 mt-1">
          4 models evaluated on the same 20% test split ({best.name.includes("boost") ? "Gradient Boosting" : best.label} leads)
        </p>
      </div>

      {/* Best model banner */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-xl px-6 py-4">
        <div className="p-2 rounded-lg bg-emerald-500/20">
          <Trophy className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">
            Best model: <span className="text-emerald-400">{MODEL_LABELS[best.name] ?? best.label}</span>
          </p>
          <p className="text-xs text-slate-400">
            R² = {best.r2} · RMSE = {best.rmse} · MAE = {best.mae} · CV R² = {best.cv_r2_mean} ± {best.cv_r2_std}
          </p>
        </div>
      </div>

      {/* Metrics table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">Metrics — Test Set</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {["Model", "R²↑", "RMSE↓", "MAE↓", "CV R² (mean ± std)"].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((m, i) => (
              <tr key={m.name} className={`border-b border-slate-800/60 ${i % 2 === 0 ? "bg-slate-900" : "bg-slate-800/30"}`}>
                <td className="px-6 py-3 font-medium text-slate-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {MODEL_LABELS[m.name] ?? m.label}
                  {m.name === "mlp" && (
                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">DL</span>
                  )}
                </td>
                <td className="px-6 py-3"><MetricBadge value={m.r2}   best={bestR2} /></td>
                <td className="px-6 py-3"><MetricBadge value={m.rmse} best={bestRMSE} low /></td>
                <td className="px-6 py-3"><MetricBadge value={m.mae}  best={bestMAE}  low /></td>
                <td className="px-6 py-3 font-mono text-xs text-slate-300">
                  {fmt(m.cv_r2_mean, 4)} ± {fmt(m.cv_r2_std, 4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart row */}
      <div className="grid grid-cols-2 gap-6">
        {/* R² bar chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">R² Score (higher = better)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0.99, 1]} tick={{ fontSize: 10 }}
                tickFormatter={v => v.toFixed(3)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="R2" name="R²" radius={[0, 4, 4, 0]}>
                {chartData.map(d => <Cell key={d.name} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RMSE + MAE */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">RMSE & MAE (lower = better)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" barSize={10} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="RMSE" fill="#6366f1" radius={[0, 3, 3, 0]} />
              <Bar dataKey="MAE"  fill="#8b5cf6" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insight callout */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { title: "Best Performance", desc: `${MODEL_LABELS[best.name] ?? best.label} achieves R²=${best.r2}, the highest on test set.`, color: "emerald" },
          { title: "Most Stable", desc: `CV std ± ${Math.min(...models.map(m => m.cv_r2_std)).toFixed(4)} — all models generalise well on this clean synthetic dataset.`, color: "cyan" },
          { title: "DL vs ML", desc: `MLP (R²=${models.find(m=>m.name==="mlp")?.r2}) underperforms tree models here — a key pedagogical finding.`, color: "violet" },
        ].map(({ title, desc, color }) => (
          <div key={title} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4`}>
            <p className={`text-xs font-semibold text-${color}-400 uppercase tracking-wider mb-1`}>{title}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
