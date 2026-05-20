"use client";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Trophy, CheckCircle2 } from "lucide-react";
import { api, ModelMetric, ClassificationMetric } from "@/lib/api";
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
    <div
      className="border rounded-lg px-3 py-2 shadow-xl"
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
          {p.name}: {fmt(p.value, 4)}
        </p>
      ))}
    </div>
  );
};

function MetricBadge({ value, best, low }: { value: number; best: number; low?: boolean }) {
  const isBest = Math.abs(value - best) < 1e-6;
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-semibold transition-colors
        ${isBest
          ? "text-white ring-1"
          : "text-white"
        }`}
      style={{
        backgroundColor: isBest ? "var(--accent)" : "transparent",
        color: isBest ? "white" : "var(--text-primary)",
        borderColor: isBest ? "var(--accent)" : "transparent",
      }}
    >
      {isBest && <CheckCircle2 className="w-3 h-3" />}
      {fmt(value, 4)}
    </span>
  );
}

export default function ModelsPage() {
  const [models, setModels] = useState<ModelMetric[] | null>(null);
  const [clfModels, setClfModels] = useState<ClassificationMetric[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.metrics().then(d => setModels(d.models)).catch(() => setError(true));
    api.metricsClassification().then(d => setClfModels(d.models)).catch(() => {});
  }, []);

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p style={{ color: "var(--text-muted)" }} className="text-sm">
        API unavailable — run the FastAPI server first.
      </p>
    </div>
  );

  if (!models) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-48 rounded-lg" style={{ backgroundColor: "var(--bg-card)" }} />
      <div className="h-72 rounded-xl" style={{ backgroundColor: "var(--bg-card)" }} />
      <div className="h-72 rounded-xl" style={{ backgroundColor: "var(--bg-card)" }} />
    </div>
  );

  const bestR2   = Math.max(...models.map(m => m.r2));
  const best     = models.find(m => m.r2 === bestR2)!;

  const chartData = models.map((m, i) => ({
    name:  MODEL_LABELS[m.name] ?? m.label,
    R2:    m.r2,
    RMSE:  m.rmse,
    MAE:   m.mae,
    fill:  CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1>Model Comparison</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          4 models evaluated on the same 20% test split ({MODEL_LABELS[best.name] ?? best.label} leads)
        </p>
      </div>

      {/* Best model banner */}
      <div
        className="flex items-center gap-4 rounded-xl px-6 py-4 border"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--accent)",
        }}
      >
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `var(--accent)20` }}
        >
          <Trophy className="w-5 h-5" style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Best model:{" "}
            <span style={{ color: "var(--accent)" }}>
              {MODEL_LABELS[best.name] ?? best.label}
            </span>
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            R² = {best.r2} · RMSE = {best.rmse} · MAE = {best.mae} · CV R² = {best.cv_r2_mean} ± {best.cv_r2_std}
          </p>
        </div>
      </div>

      {/* Metrics table */}
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2>Metrics — Test Set</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderColor: "var(--border)" }} className="border-b">
                {["Model", "R²↑", "RMSE↓", "MAE↓", "CV R² (mean ± std)"].map(h => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {models.map((m, i) => (
                <tr
                  key={m.name}
                  style={{
                    backgroundColor: i % 2 === 0 ? "var(--bg-card)" : `var(--bg-input)`,
                    borderColor: "var(--border)",
                  }}
                  className="border-b transition-colors hover:opacity-80"
                >
                  <td className="px-6 py-3 font-medium flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    {MODEL_LABELS[m.name] ?? m.label}
                    {m.name === best.name && (
                      <span
                        className="ml-2 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{
                          backgroundColor: `var(--green)20`,
                          color: "var(--green)",
                        }}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Best
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <MetricBadge value={m.r2} best={bestR2} />
                  </td>
                  <td className="px-6 py-3">
                    <MetricBadge value={m.rmse} best={Math.min(...models.map(x => x.rmse))} low />
                  </td>
                  <td className="px-6 py-3">
                    <MetricBadge value={m.mae} best={Math.min(...models.map(x => x.mae))} low />
                  </td>
                  <td className="px-6 py-3 font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                    {fmt(m.cv_r2_mean, 4)} ± {fmt(m.cv_r2_std, 4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart row */}
      <div className="grid grid-cols-2 gap-6">
        {/* R² bar chart */}
        <div className="rounded-xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h2>R² Score (higher = better)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} layout="vertical" barSize={18} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                domain={[0.99, 1]}
                tick={{ fontSize: 10 }}
                tickFormatter={v => v.toFixed(3)}
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="R2" name="R²" radius={[0, 4, 4, 0]} fill="#4a9eff">
                {chartData.map((d, i) => <Cell key={d.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RMSE + MAE */}
        <div className="rounded-xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h2>RMSE & MAE (lower = better)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} layout="vertical" barSize={10} barGap={4} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="RMSE" fill="#4a9eff" radius={[0, 3, 3, 0]} />
              <Bar dataKey="MAE" fill="#f59e0b" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Classification Metrics */}
      {clfModels.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2>Classification Metrics</h2>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Campaign performance class prediction (High / Medium / Low) — evaluated on the same test split
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {/* Table */}
            <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderColor: "var(--border)" }} className="border-b">
                      {["Model", "Accuracy↑", "F1-macro↑", "ROC-AUC↑"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clfModels.map((m, i) => {
                      const bestF1 = Math.max(...clfModels.map(x => x["F1-macro"]));
                      const isBest = Math.abs(m["F1-macro"] - bestF1) < 1e-6;
                      return (
                        <tr key={m.Model} style={{ backgroundColor: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-input)", borderColor: "var(--border)" }} className="border-b">
                          <td className="px-4 py-3 font-medium flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                            {MODEL_LABELS[m.Model] ?? m.Model.replace(/_/g, " ")}
                            {isBest && <span className="ml-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--green)20", color: "var(--green)" }}>Best</span>}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-primary)" }}>{fmt(m.Accuracy, 4)}</td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: isBest ? "var(--accent)" : "var(--text-primary)", fontWeight: isBest ? 700 : 400 }}>{fmt(m["F1-macro"], 4)}</td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-primary)" }}>{fmt(m["ROC-AUC"], 4)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {/* F1 bar chart */}
            <div className="rounded-xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
              <h2>F1-macro Score</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={clfModels.map((m, i) => ({ name: MODEL_LABELS[m.Model] ?? m.Model, f1: m["F1-macro"], fill: CHART_COLORS[i % CHART_COLORS.length] }))}
                  layout="vertical" barSize={18} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0.95, 1]} tick={{ fontSize: 10 }} tickFormatter={v => v.toFixed(3)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="f1" name="F1-macro" radius={[0, 4, 4, 0]}>
                    {clfModels.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Insight callouts */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            title: "Best Performance",
            desc: `${MODEL_LABELS[best.name] ?? best.label} achieves R²=${best.r2}, the highest on test set.`,
            color: "var(--accent)",
          },
          {
            title: "Most Stable",
            desc: `CV std ± ${Math.min(...models.map(m => m.cv_r2_std)).toFixed(4)} — all models generalise well on this clean synthetic dataset.`,
            color: "var(--green)",
          },
          {
            title: "DL vs ML",
            desc: `MLP (R²=${models.find(m => m.name === "mlp")?.r2}) underperforms tree models here — a key pedagogical finding.`,
            color: "#4a9eff",
          },
        ].map(({ title, desc, color }) => (
          <div
            key={title}
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: color,
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color }}
            >
              {title}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
