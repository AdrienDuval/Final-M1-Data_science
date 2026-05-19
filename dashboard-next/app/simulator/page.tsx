"use client";
import { useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, Zap, RefreshCw } from "lucide-react";
import { api, PredictResponse, AllPredictions } from "@/lib/api";
import { fmt, CHART_COLORS } from "@/lib/utils";

const INFLUENCER_OPTIONS = ["Mega", "Macro", "Micro", "Nano"];
const PRESETS = [
  { label: "Balanced",    TV: 50,  Radio: 18, Social_Media: 3, Influencer: "Macro" },
  { label: "TV Heavy",    TV: 90,  Radio: 10, Social_Media: 2, Influencer: "Mega" },
  { label: "Digital",     TV: 20,  Radio: 5,  Social_Media: 12, Influencer: "Micro" },
  { label: "Low Budget",  TV: 15,  Radio: 5,  Social_Media: 1, Influencer: "Nano" },
];

function SliderField({
  label, value, min, max, step = 1, unit = "M",
  onChange, color,
}: {
  label: string; value: number; min: number; max: number;
  step?: number; unit?: string; onChange: (v: number) => void; color: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-sm font-mono font-bold" style={{ color }}>
          {fmt(value, 1)}{unit}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-slate-700">
        <div
          className="absolute h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
        />
      </div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>{min}{unit}</span><span>{max}{unit}</span>
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
  const [loading, setLoading] = useState(false);

  const runPrediction = useCallback(async () => {
    setLoading(true);
    try {
      const body = { TV, Radio, Social_Media: Social, Influencer: influencer };
      const [r, all] = await Promise.all([api.predict(body), api.predictAll(body)]);
      setResult(r);
      setAllPreds(all);
    } catch {
      alert("API error — make sure the FastAPI server is running.");
    } finally {
      setLoading(false);
    }
  }, [TV, Radio, Social, influencer]);

  const applyPreset = (p: typeof PRESETS[0]) => {
    setTV(p.TV); setRadio(p.Radio); setSocial(p.Social_Media); setInfluencer(p.Influencer);
    setResult(null); setAllPreds(null);
  };

  const totalBudget = TV + Radio + Social;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Budget Simulator</h1>
        <p className="text-sm text-slate-400 mt-1">
          Adjust marketing budgets and get real-time Sales & ROI predictions
        </p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Controls panel */}
        <div className="col-span-2 space-y-6">
          {/* Presets */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Presets</p>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors text-left"
                >
                  {p.label}
                  <span className="block text-slate-500 mt-0.5 font-normal">{p.Influencer} · TV={p.TV}M</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Allocation</p>
            <SliderField label="TV Budget" value={TV} min={10} max={100} onChange={setTV} color="#6366f1" />
            <SliderField label="Radio Budget" value={Radio} min={0} max={50} onChange={setRadio} color="#8b5cf6" />
            <SliderField label="Social Media" value={Social} min={0} max={14} step={0.5} onChange={setSocial} color="#06b6d4" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Influencer Type</label>
                <span className="text-xs text-slate-500">{influencer}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {INFLUENCER_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setInfluencer(opt)}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all
                      ${influencer === opt
                        ? "bg-brand-600/30 border-brand-500/50 text-brand-400"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Total budget indicator */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Total Budget</span>
              <span className="text-sm font-bold font-mono text-slate-200">{fmt(totalBudget, 1)}M</span>
            </div>
          </div>

          {/* Predict button */}
          <button
            onClick={runPrediction}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-600/20"
          >
            {loading
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Predicting…</>
              : <><Zap className="w-4 h-4" /> Run Prediction</>}
          </button>
        </div>

        {/* Results panel */}
        <div className="col-span-3 space-y-4">
          {!result ? (
            <div className="h-full flex items-center justify-center bg-slate-900 border border-dashed border-slate-700 rounded-xl">
              <div className="text-center text-slate-500">
                <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Configure your budget and click Run Prediction</p>
              </div>
            </div>
          ) : (
            <>
              {/* Main result */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-gradient-to-br from-brand-600/20 to-brand-600/5 border border-brand-500/30 rounded-xl p-6">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Predicted Sales</p>
                  <p className="text-5xl font-bold text-white mt-2">{fmt(result.predicted_sales)}M</p>
                  <div className="mt-3 flex items-center gap-2">
                    {result.vs_average >= 0
                      ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                      : <TrendingDown className="w-4 h-4 text-red-400" />}
                    <span className={`text-sm font-medium ${result.vs_average >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {result.vs_average >= 0 ? "+" : ""}{fmt(result.vs_average)}M vs dataset avg
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500">ROI</p>
                    <p className="text-2xl font-bold text-slate-100 mt-0.5">{fmt(result.roi, 2)}×</p>
                    <p className="text-xs text-slate-500 mt-1">Sales / Budget</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500">Total Budget</p>
                    <p className="text-2xl font-bold text-slate-100 mt-0.5">{fmt(result.total_budget)}M</p>
                    <p className="text-xs text-slate-500 mt-1">TV + Radio + SM</p>
                  </div>
                </div>
              </div>

              {/* All model predictions */}
              {allPreds && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4">Prediction Across All Models</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={allPreds.predictions} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                      <Tooltip
                        formatter={(v: number) => [`${fmt(v)}M`, "Predicted Sales"]}
                        contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                      />
                      <Bar dataKey="predicted_sales" name="Predicted Sales (M)" radius={[4, 4, 0, 0]}>
                        {allPreds.predictions.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Budget breakdown bars */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-200 mb-4">Budget Allocation</h3>
                <div className="space-y-3">
                  {[
                    { label: "TV",           value: TV,     total: totalBudget, color: "#6366f1" },
                    { label: "Radio",        value: Radio,  total: totalBudget, color: "#8b5cf6" },
                    { label: "Social Media", value: Social, total: totalBudget, color: "#06b6d4" },
                  ].map(({ label, value, total, color }) => (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{label}</span>
                        <span className="font-mono">{fmt(value, 1)}M ({fmt(value / total * 100, 1)}%)</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(value / total) * 100}%`, background: color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
