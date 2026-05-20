"use client";
import { useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, Zap, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import { api, PredictResponse, AllPredictions, TvSweepPoint } from "@/lib/api";
import { fmt, CHART_COLORS } from "@/lib/utils";

const INFLUENCER_OPTIONS = ["Mega", "Macro", "Micro", "Nano"];
const PRESETS = [
  { label: "Balanced", TV: 50, Radio: 18, Social_Media: 3, Influencer: "Macro" },
  { label: "TV Heavy", TV: 90, Radio: 10, Social_Media: 2, Influencer: "Mega" },
  { label: "Digital", TV: 20, Radio: 5, Social_Media: 12, Influencer: "Micro" },
  { label: "Low Budget", TV: 15, Radio: 5, Social_Media: 1, Influencer: "Nano" },
];

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "M",
  onChange,
  color,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  color: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {label}
        </label>
        <span className="text-sm font-mono font-bold" style={{ color }}>
          {fmt(value, 1)}
          {unit}
        </span>
      </div>
      <div className="relative h-2 rounded-full" style={{ backgroundColor: "var(--border)" }}>
        <div
          className="absolute h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, background: value > 0 ? color : "var(--text-muted)" }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
        />
      </div>
      <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

export default function SimulatorPage() {
  const [TV, setTV] = useState(50);
  const [Radio, setRadio] = useState(18);
  const [Social, setSocial] = useState(3);
  const [influencer, setInfluencer] = useState("Macro");
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [allPreds, setAllPreds] = useState<AllPredictions | null>(null);
  const [sweepData, setSweepData] = useState<TvSweepPoint[]>([]);
  const [sweepMax, setSweepMax] = useState(297);
  const [loading, setLoading] = useState(false);

  const runPrediction = useCallback(async () => {
    setLoading(true);
    try {
      const body = { TV, Radio, Social_Media: Social, Influencer: influencer };
      const [r, all, sweep] = await Promise.all([
        api.predict(body),
        api.predictAll(body),
        api.tvSweep(Radio, Social, influencer),
      ]);
      setResult(r);
      setAllPreds(all);
      setSweepData(sweep.data);
      setSweepMax(sweep.training_max_tv);
    } catch {
      alert("API error — make sure the FastAPI server is running.");
    } finally {
      setLoading(false);
    }
  }, [TV, Radio, Social, influencer]);

  const applyPreset = (p: typeof PRESETS[0]) => {
    setTV(p.TV);
    setRadio(p.Radio);
    setSocial(p.Social_Media);
    setInfluencer(p.Influencer);
    setResult(null);
    setAllPreds(null);
    setSweepData([]);
  };

  const totalBudget = TV + Radio + Social;

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
          {payload[0]?.payload?.TV ? `TV: ${fmt(payload[0].payload.TV)}M` : label}
        </p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {fmt(p.value)}M
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1>Budget Simulator</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Adjust marketing budgets and get real-time Sales & ROI predictions
        </p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Controls Panel */}
        <div className="col-span-2 space-y-6">
          {/* Presets */}
          <div
            className="rounded-xl p-5 border"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            <p className="text-label mb-3">Quick Presets</p>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border)",
                    color: "var(--text-muted)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-input)";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  {p.label}
                  <span style={{ color: "var(--text-muted)" }} className="block mt-0.5 text-xs font-normal">
                    TV={p.TV}M
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div
            className="rounded-xl p-6 border space-y-6"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            <p className="text-label">Budget Allocation</p>
            <SliderField
              label="TV Budget"
              value={TV}
              min={10}
              max={100}
              onChange={setTV}
              color="#4a9eff"
            />
            <SliderField
              label="Radio Budget"
              value={Radio}
              min={0}
              max={50}
              onChange={setRadio}
              color="#8b5cf6"
            />
            <SliderField
              label="Social Media"
              value={Social}
              min={0}
              max={14}
              step={0.5}
              onChange={setSocial}
              color="#06b6d4"
            />

            {/* Influencer */}
            <div>
              <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Influencer Type
              </label>
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {INFLUENCER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setInfluencer(opt)}
                    className="py-1.5 text-xs font-medium rounded-lg border transition-all"
                    style={{
                      backgroundColor: influencer === opt ? "var(--accent)" : "var(--bg-input)",
                      borderColor: influencer === opt ? "var(--accent)" : "var(--border)",
                      color: influencer === opt ? "white" : "var(--text-muted)",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Budget */}
            <div
              className="pt-2 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Total Budget
                </span>
                <span className="text-sm font-bold font-mono" style={{ color: "var(--text-primary)" }}>
                  {fmt(totalBudget, 1)}M
                </span>
              </div>
            </div>
          </div>

          {/* Predict Button */}
          <button
            onClick={runPrediction}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 font-semibold rounded-xl transition-all shadow-lg"
            style={{
              backgroundColor: loading ? "var(--text-muted)" : "var(--accent)",
              color: "white",
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Simulating…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run Simulation
              </>
            )}
          </button>
        </div>

        {/* Results Panel */}
        <div className="col-span-3 space-y-4">
          {!result ? (
            <div
              className="h-full flex items-center justify-center rounded-xl border border-dashed py-16"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border)",
              }}
            >
              <div className="text-center">
                <Zap className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.3 }} />
                <p style={{ color: "var(--text-muted)" }} className="text-sm">
                  Configure your budget and click Run Simulation
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Main Result */}
              <div className="grid grid-cols-3 gap-4">
                <div
                  className="col-span-2 rounded-xl p-6 border"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--accent)",
                  }}
                >
                  <p className="text-label mb-2">Predicted Sales</p>
                  <p className="text-5xl font-bold text-white">
                    {fmt(result.predicted_sales)}M
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {result.vs_average >= 0 ? (
                      <TrendingUp className="w-4 h-4" style={{ color: "var(--green)" }} />
                    ) : (
                      <TrendingDown className="w-4 h-4" style={{ color: "var(--red)" }} />
                    )}
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: result.vs_average >= 0 ? "var(--green)" : "var(--red)",
                      }}
                    >
                      {result.vs_average >= 0 ? "+" : ""}
                      {fmt(result.vs_average)}M vs dataset avg
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div
                    className="rounded-xl p-4 border"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      ROI
                    </p>
                    <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
                      {fmt(result.roi, 2)}×
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Sales / Budget
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-4 border"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Total Budget
                    </p>
                    <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
                      {fmt(result.total_budget)}M
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      TV + Radio + SM
                    </p>
                  </div>
                </div>
              </div>

              {/* All Models Predictions */}
              {allPreds && (
                <div
                  className="rounded-xl p-5 border"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border)",
                  }}
                >
                  <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                    Prediction Across All Models
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={allPreds.predictions} barSize={32} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="predicted_sales" name="Predicted Sales (M)" radius={[4, 4, 0, 0]}>
                        {allPreds.predictions.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Budget Breakdown */}
              <div
                className="rounded-xl p-5 border"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border)",
                }}
              >
                <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                  Budget Allocation
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "TV", value: TV, total: totalBudget, color: "#4a9eff" },
                    { label: "Radio", value: Radio, total: totalBudget, color: "#8b5cf6" },
                    { label: "Social Media", value: Social, total: totalBudget, color: "#06b6d4" },
                  ].map(({ label, value, total, color }) => (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                        <span>{label}</span>
                        <span className="font-mono">
                          {fmt(value, 1)}M ({fmt((value / total) * 100, 1)}%)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${(value / total) * 100}%`, background: color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sales Sensitivity Chart */}
              {sweepData.length > 0 && (
                <div
                  className="rounded-xl p-5 border"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border)",
                  }}
                >
                  <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    Sales Sensitivity: TV Budget Sweep
                  </h3>
                  <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                    Predicted sales as TV spend increases 0 → 300 M (Radio={Radio}M, SM={Social}M fixed)
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={sweepData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tv" tick={{ fontSize: 10 }} label={{ value: "TV (M)", position: "insideBottomRight", offset: -5, fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => [`${v.toFixed(2)}M`, "Sales"]} labelFormatter={(v) => `TV: ${v}M`} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                      {/* Current TV marker */}
                      <Line type="monotone" dataKey="sales" stroke="#4a9eff" strokeWidth={2} dot={false} />
                      {/* Training max reference */}
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1"><span className="inline-block w-6 h-0.5 bg-[#4a9eff]" /> Predicted Sales</span>
                    <span>Training max TV: {sweepMax}M</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
