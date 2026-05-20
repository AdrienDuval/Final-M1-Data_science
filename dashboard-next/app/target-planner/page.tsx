"use client";
import { useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { api, OptimizeResponse, ProbabilityResponse } from "@/lib/api";
import { fmt, CHART_COLORS } from "@/lib/utils";

const INFLUENCER_OPTIONS = ["Mega", "Macro", "Micro", "Nano"];

function NumericInput({
  label, value, min, max, step = 1, onChange, error,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</label>
      <div className="flex items-center">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="p-2 rounded-l-lg border border-r-0 transition-colors"
          style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: "var(--accent)" }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--border)"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "var(--bg-input)"; }}
        >−</button>
        <input
          type="number"
          value={value}
          onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
          min={min} max={max} step={step}
          className="flex-1 px-4 py-2 text-center font-mono font-semibold border-y"
          style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="p-2 rounded-r-lg border border-l-0 transition-colors"
          style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: "var(--accent)" }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--border)"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "var(--bg-input)"; }}
        >+</button>
      </div>
      {error && (
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--red)" }} />
          <p className="text-xs" style={{ color: "var(--red)" }}>{error}</p>
        </div>
      )}
    </div>
  );
}

export default function TargetPlannerPage() {
  // ── Section 1: Inverse Prediction ─────────────────────────────────────────
  const [targetSales, setTargetSales] = useState(200);
  const [maxBudget, setMaxBudget]     = useState(400);
  const [optInfluencer, setOptInfluencer] = useState("Macro");
  const [inverseResult, setInverseResult] = useState<OptimizeResponse | null>(null);
  const [loadingOpt, setLoadingOpt]   = useState(false);
  const [optError, setOptError]       = useState<string | null>(null);

  // ── Section 2: Probability Analysis ───────────────────────────────────────
  const [paTv, setPaTv]       = useState(50);
  const [paRadio, setPaRadio] = useState(20);
  const [paSm, setPaSm]       = useState(5);
  const [paInf, setPaInf]     = useState("Macro");
  const [paGoal, setPaGoal]   = useState(150);
  const [probResult, setProbResult] = useState<ProbabilityResponse | null>(null);
  const [loadingProb, setLoadingProb] = useState(false);
  const [probError, setProbError]     = useState<string | null>(null);

  const handleFindOptimal = useCallback(async () => {
    setLoadingOpt(true);
    setOptError(null);
    try {
      const r = await api.optimize({ target_sales: targetSales, max_budget: maxBudget, influencer: optInfluencer });
      setInverseResult(r);
    } catch (e: any) {
      setOptError("Optimization failed — check the API server.");
    } finally {
      setLoadingOpt(false);
    }
  }, [targetSales, maxBudget, optInfluencer]);

  const handleProbabilityAnalysis = useCallback(async () => {
    setLoadingProb(true);
    setProbError(null);
    try {
      const r = await api.probability({ TV: paTv, Radio: paRadio, Social_Media: paSm, Influencer: paInf, goal: paGoal });
      setProbResult(r);
    } catch (e: any) {
      setProbError("Probability analysis failed — Random Forest model may not be available.");
    } finally {
      setLoadingProb(false);
    }
  }, [paTv, paRadio, paSm, paInf, paGoal]);

  const probColor = probResult
    ? probResult.probability_goal >= 0.7 ? "var(--green)"
    : probResult.probability_goal >= 0.4 ? "var(--orange)"
    : "var(--red)"
    : "var(--text-muted)";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1>Target Planner</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Set sales targets and find optimal budget allocations
        </p>
      </div>

      {/* ── Section 1: Inverse Prediction ──────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2>① Inverse Prediction — Budget for a Sales Target</h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Enter a target and the optimizer finds the TV / Radio / Social Media mix that gets closest to it.
          </p>
        </div>

        <div className="rounded-xl p-6 border space-y-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="grid grid-cols-3 gap-4">
            <NumericInput label="Target Sales (M)" value={targetSales} min={1} max={500} step={10} onChange={setTargetSales} />
            <NumericInput label="Max Budget (M)"   value={maxBudget}   min={10} max={1000} step={10} onChange={setMaxBudget} />
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Influencer Tier</label>
              <div className="grid grid-cols-2 gap-1.5">
                {INFLUENCER_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setOptInfluencer(opt)}
                    className="py-1.5 text-xs font-medium rounded-lg border transition-all"
                    style={{
                      backgroundColor: optInfluencer === opt ? "var(--accent)" : "var(--bg-input)",
                      borderColor: optInfluencer === opt ? "var(--accent)" : "var(--border)",
                      color: optInfluencer === opt ? "white" : "var(--text-muted)",
                    }}
                  >{opt}</button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleFindOptimal}
            disabled={loadingOpt}
            className="w-full py-3 px-6 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: "var(--accent)", color: "white", opacity: loadingOpt ? 0.6 : 1 }}
          >
            {loadingOpt ? <><RefreshCw className="w-4 h-4 animate-spin" />Finding optimal budget…</> : "Find Optimal Budget"}
          </button>
          {optError && <p className="text-xs text-center" style={{ color: "var(--red)" }}>{optError}</p>}
        </div>

        {inverseResult && (
          <div className="grid grid-cols-2 gap-6">
            {/* Budget bars */}
            <div className="rounded-xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--accent)" }}>
              <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Recommended Budget</h3>
              <div className="space-y-4 mb-6">
                {[
                  { label: "TV",           value: inverseResult.TV,           color: "#4a9eff" },
                  { label: "Radio",        value: inverseResult.Radio,        color: "#8b5cf6" },
                  { label: "Social Media", value: inverseResult.Social_Media, color: "#06b6d4" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "var(--text-primary)" }}>{label}</span>
                      <span className="font-mono font-semibold" style={{ color }}>
                        {fmt(value, 1)}M ({fmt((value / inverseResult.total_budget) * 100, 1)}%)
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(value / maxBudget) * 100}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2" style={{ borderColor: "var(--border)" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>Total Budget</span>
                  <span className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(inverseResult.total_budget, 1)}M</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>Estimated ROI</span>
                  <span className="font-mono font-semibold" style={{ color: "var(--green)" }}>{inverseResult.roi > 0 ? "+" : ""}{fmt(inverseResult.roi, 1)}%</span>
                </div>
              </div>
            </div>

            {/* Projected sales */}
            <div className="rounded-xl p-6 border space-y-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
              <div>
                <p className="text-label">Projected Sales</p>
                <p className="text-5xl font-bold mt-2" style={{ color: "var(--text-primary)" }}>{fmt(inverseResult.projected_sales)}M</p>
                <div className="flex items-center gap-2 mt-2">
                  {Math.abs(inverseResult.gap) < 1 ? (
                    <CheckCircle2 className="w-4 h-4" style={{ color: "var(--green)" }} />
                  ) : null}
                  <span className="text-sm" style={{ color: Math.abs(inverseResult.gap) < 5 ? "var(--green)" : "var(--orange)" }}>
                    {inverseResult.gap >= 0 ? "+" : ""}{fmt(inverseResult.gap, 2)}M vs target
                  </span>
                </div>
              </div>
              {!inverseResult.converged && (
                <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: "var(--orange)15", color: "var(--orange)" }}>
                  ⚠ Optimizer did not fully converge. Try raising the max budget or adjusting the target.
                </div>
              )}
              <div className="text-xs pt-2 border-t" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
                Model: {inverseResult.model_used.replace(/_/g, " ")}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: Probability Analysis ────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2>② Probability Analysis — Chance of Hitting a Sales Goal</h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Random Forest ensemble estimates P(sales ≥ goal) using the spread of individual tree predictions.
          </p>
        </div>

        <div className="rounded-xl p-6 border space-y-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {[
                { label: "TV Budget (M)",      min: 0, max: 300, value: paTv,    setter: setPaTv,    color: "#4a9eff" },
                { label: "Radio Budget (M)",   min: 0, max: 100, value: paRadio, setter: setPaRadio, color: "#8b5cf6" },
                { label: "Social Media (M)",   min: 0, max: 50,  value: paSm,    setter: setPaSm,    color: "#06b6d4" },
              ].map(({ label, min, max, value, setter, color }) => {
                const pct = ((value - min) / (max - min)) * 100;
                return (
                  <div key={label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</label>
                      <span className="text-sm font-mono font-bold" style={{ color }}>{fmt(value, 1)}M</span>
                    </div>
                    <div className="relative h-2 rounded-full" style={{ backgroundColor: "var(--border)" }}>
                      <div className="absolute h-2 rounded-full" style={{ width: `${pct}%`, background: color }} />
                      <input type="range" min={min} max={max} value={value} onChange={e => setter(Number(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Influencer Tier</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {INFLUENCER_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => setPaInf(opt)}
                      className="py-1.5 text-xs font-medium rounded-lg border transition-all"
                      style={{
                        backgroundColor: paInf === opt ? "var(--accent)" : "var(--bg-input)",
                        borderColor: paInf === opt ? "var(--accent)" : "var(--border)",
                        color: paInf === opt ? "white" : "var(--text-muted)",
                      }}>{opt}</button>
                  ))}
                </div>
              </div>
              <NumericInput label="Sales Goal (M)" value={paGoal} min={1} max={500} step={10} onChange={setPaGoal} />
            </div>
          </div>

          <button
            onClick={handleProbabilityAnalysis}
            disabled={loadingProb}
            className="w-full py-3 px-6 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: "var(--accent)", color: "white", opacity: loadingProb ? 0.6 : 1 }}
          >
            {loadingProb ? <><RefreshCw className="w-4 h-4 animate-spin" />Analyzing…</> : "Analyze Probability"}
          </button>
          {probError && <p className="text-xs text-center" style={{ color: "var(--red)" }}>{probError}</p>}
        </div>

        {probResult && (
          <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                <p className="text-label mb-3">RF Mean Prediction</p>
                <p className="text-4xl font-bold" style={{ color: "var(--accent)" }}>{fmt(probResult.mean, 1)}M</p>
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>±{fmt(probResult.std, 2)}M std · {probResult.n_trees} trees</p>
              </div>
              <div className="rounded-xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                <p className="text-label mb-3">Prediction Range</p>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{fmt(probResult.min, 1)}M – {fmt(probResult.max, 1)}M</p>
                <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                  <div className="h-full rounded-full" style={{ width: "70%", marginLeft: "5%", background: "linear-gradient(90deg, #4a9eff, var(--accent))" }} />
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>Min → Max across all trees</p>
              </div>
              <div className="rounded-xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: probColor }}>
                <p className="text-label mb-3">P(sales ≥ {paGoal}M)</p>
                <p className="text-4xl font-bold" style={{ color: probColor }}>
                  {fmt(probResult.probability_goal * 100, 1)}%
                </p>
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  {probResult.probability_goal >= 0.7 ? "High confidence" : probResult.probability_goal >= 0.4 ? "Moderate confidence" : "Low confidence"}
                </p>
              </div>
            </div>

            {/* Distribution histogram */}
            <div className="rounded-xl p-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
              <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>RF Prediction Distribution</h3>
              <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                Each bar = number of trees predicting that sales range. Blue = below goal, green = at or above goal.
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={probResult.histogram} margin={{ left: 0, right: 0, top: 10, bottom: 0 }} barSize={6}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" tick={{ fontSize: 9 }} tickFormatter={v => `${v}`} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number, _: string, p: any) => [v, "Trees"]} labelFormatter={v => `~${v}M`}
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <ReferenceLine x={probResult.goal} stroke="var(--orange)" strokeWidth={2} strokeDasharray="4 2"
                    label={{ value: `Goal ${paGoal}M`, position: "top", fontSize: 10, fill: "var(--orange)" }} />
                  <Bar dataKey="count" name="Trees" radius={[2, 2, 0, 0]}>
                    {probResult.histogram.map((d, i) => (
                      <Cell key={i} fill={d.above_goal ? "var(--green)" : "#4a9eff"} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
