"use client";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, Eye, Brain, AlertTriangle } from "lucide-react";
import { api, FeatureImportance, Stats } from "@/lib/api";
import { fmt, CHART_COLORS } from "@/lib/utils";

const FEATURE_LABELS: Record<string, string> = {
  TV: "TV Budget",
  Radio: "Radio Budget",
  "Social Media": "Social Media",
  "Influencer_Mega": "Influencer: Mega",
  "Influencer_Micro": "Influencer: Micro",
  "Influencer_Nano": "Influencer: Nano",
  "Influencer_Macro": "Influencer: Macro",
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
        {FEATURE_LABELS[label] ?? label}
      </p>
      <p
        className="text-sm font-semibold"
        style={{ color: "var(--accent)" }}
      >
        Importance: {fmt(payload[0].value, 4)}
      </p>
    </div>
  );
};

function InsightCard({
  icon: Icon,
  title,
  desc,
  color,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-5 border"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: color,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FeatureImportancePage() {
  const [fi, setFi] = useState<FeatureImportance | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([api.featureImportance(), api.stats()])
      .then(([f, s]) => {
        setFi(f);
        setStats(s);
      })
      .catch(() => setError(true));
  }, []);

  if (error)
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: "var(--text-muted)" }} className="text-sm">
          API unavailable — run the FastAPI server first.
        </p>
      </div>
    );

  if (!fi || !stats)
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 rounded-lg" style={{ backgroundColor: "var(--bg-card)" }} />
        <div className="h-80 rounded-xl" style={{ backgroundColor: "var(--bg-card)" }} />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl" style={{ backgroundColor: "var(--bg-card)" }} />
          ))}
        </div>
      </div>
    );

  const chartData = fi.features.map((f) => ({
    name: f.feature,
    importance: f.importance,
  }));

  const correlations = Object.entries(stats.correlations).sort((a, b) => b[1] - a[1]);

  const topFeature = chartData[0];
  const topImportance = topFeature ? (topFeature.importance * 100).toFixed(1) : "0";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1>Feature Importance</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Understanding which features the model relies on most
        </p>
      </div>

      {/* Legend explaining the importance scale */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-12 h-6 rounded-md" style={{ background: "linear-gradient(90deg, #2563eb 0%, #4a9eff 100%)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Low Importance
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-6 rounded-md" style={{ background: "linear-gradient(90deg, #4a9eff 0%, #e5534b 100%)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            High Importance
          </span>
        </div>
      </div>

      {/* Static figure images — SHAP + Native FI */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { src: "http://localhost:8000/figures/shap_summary.png",       label: "SHAP Summary Plot" },
          { src: "http://localhost:8000/figures/feature_importance.png", label: "Native Feature Importance" },
        ].map(({ src, label }) => (
          <div key={label} className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <p className="text-xs font-medium px-3 py-2 border-b" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>{label}</p>
            <div className="p-2">
              <img
                src={src}
                alt={label}
                className="w-full h-auto rounded object-contain"
                style={{ maxHeight: 260 }}
                onError={e => { (e.currentTarget as HTMLImageElement).closest("div.rounded-xl")?.classList.add("hidden"); }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Feature importance chart */}
      <div
        className="rounded-xl p-6 border"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2>Feature Importance Ranking</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Based on impurity reduction across all decision trees
            </p>
          </div>
          <span
            className="text-xs px-2 py-1 rounded-full border"
            style={{
              backgroundColor: "var(--bg-input)",
              borderColor: "var(--border)",
              color: "var(--text-muted)",
            }}
          >
            {fi.model.replace(/_/g, " ")}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={chartData}
            layout="vertical"
            barSize={28}
            margin={{ left: 140, right: 20, top: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4a9eff" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => (v * 100).toFixed(0) + "%"} />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => FEATURE_LABELS[v] ?? v}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="importance" name="Importance" radius={[0, 6, 6, 0]} fill="url(#barGrad)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ranked feature list with progress bars */}
      <div
        className="rounded-xl p-6 border"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border)",
        }}
      >
        <h2>Feature Rankings</h2>
        <div className="space-y-4 mt-4">
          {chartData.map((feature, index) => {
            const importance = (feature.importance * 100).toFixed(1);
            return (
              <div key={feature.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: "var(--accent)",
                        color: "white",
                      }}
                    >
                      {index + 1}
                    </span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {FEATURE_LABELS[feature.name] ?? feature.name}
                    </span>
                  </div>
                  <span
                    className="text-sm font-mono font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
                    {importance}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${importance}%`,
                      background: "linear-gradient(90deg, #4a9eff 0%, var(--accent) 100%)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Correlation info */}
      <div
        className="rounded-xl p-6 border"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border)",
        }}
      >
        <h2>Channel → Sales Correlation</h2>
        <div className="space-y-3 mt-4">
          {correlations.map(([ch, corr], i) => (
            <div key={ch} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text-primary)" }}>{ch}</span>
                <span className="font-mono font-semibold" style={{ color: CHART_COLORS[i] }}>
                  r = {fmt(corr, 4)}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${corr * 100}%`, background: CHART_COLORS[i] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key insights */}
      <div>
        <h2 className="mb-4">Key Findings</h2>
        <div className="grid grid-cols-2 gap-4">
          <InsightCard
            icon={TrendingUp}
            title="TV dominates"
            desc={`TV has the highest correlation with Sales (r=${fmt(stats.correlations["TV"], 3)}) and is the #1 feature by importance. Increasing TV spend shows the strongest marginal return.`}
            color="var(--accent)"
          />
          <InsightCard
            icon={Eye}
            title="Radio is #2 driver"
            desc={`Radio shows r=${fmt(stats.correlations["Radio"], 3)} with Sales — a strong secondary driver. Combined TV + Radio allocation explains most variance.`}
            color="var(--green)"
          />
          <InsightCard
            icon={Brain}
            title="Influencer less critical"
            desc={`Influencer dummy variables have low importance scores. Budget size (especially TV) matters far more than influencer tier for predicting raw Sales volume.`}
            color="#4a9eff"
          />
          <InsightCard
            icon={AlertTriangle}
            title="Social Media opportunity"
            desc={`Social Media has the lowest correlation (r=${fmt(stats.correlations["Social Media"], 3)}) despite growing investment. Reallocating to TV may yield higher returns.`}
            color="var(--orange)"
          />
        </div>
      </div>
    </div>
  );
}

