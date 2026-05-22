"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import {
  Target, RefreshCw, CheckCircle2, AlertCircle,
  ArrowRight, TrendingUp,
} from "lucide-react";
import { Tip } from "@/components/Tooltip";
import { api, OptimizeResponse, ProbabilityResponse } from "@/lib/api";
import { fmt } from "@/lib/utils";
import { channelLabel, modelLabel } from "@/lib/i18n-helpers";

const CH_COLOR = { TV: "#3b82f6", Radio: "#8b5cf6", "Social Media": "#06b6d4" } as const;
const INFLUENCER_OPTIONS = ["Mega", "Macro", "Micro", "Nano"] as const;
const INFLUENCER_COLOR: Record<string, string> = {
  Mega: "#6366f1", Macro: "#8b5cf6", Micro: "#06b6d4", Nano: "#f59e0b",
};

function NumericInput({
  label, value, min, max, step = 1, onChange, suffix = "M",
}: {
  label: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</label>
      <div className="flex items-stretch h-9 rounded-lg overflow-hidden border"
        style={{ borderColor: "var(--border)" }}>
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="px-3 font-bold text-lg transition-colors flex-shrink-0"
          style={{ background: "var(--bg-input)", color: "var(--accent)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-input)"; }}
        >−</button>
        <input
          type="number" value={value} min={min} max={max} step={step}
          onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
          className="flex-1 text-center font-mono font-semibold text-sm outline-none border-x tabular-nums"
          style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="px-3 font-bold text-lg transition-colors flex-shrink-0"
          style={{ background: "var(--bg-input)", color: "var(--accent)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-input)"; }}
        >+</button>
      </div>
      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
        {min}{suffix} – {max}{suffix}
      </p>
    </div>
  );
}

export default function TargetPlannerPage() {
  const tTp = useTranslations("targetPlanner");
  const tc = useTranslations("common");
  const tCh = useTranslations("channels");
  const tm = useTranslations("modelNames");

  const [targetSales, setTargetSales] = useState(200);
  const [maxBudget, setMaxBudget]     = useState(400);
  const [optInf, setOptInf]           = useState("Macro");
  const [optResult, setOptResult]     = useState<OptimizeResponse | null>(null);
  const [loadingOpt, setLoadingOpt]   = useState(false);
  const [optErr, setOptErr]           = useState<string | null>(null);

  const [paTv, setPaTv]       = useState(50);
  const [paRadio, setPaRadio] = useState(20);
  const [paSm, setPaSm]       = useState(5);
  const [paInf, setPaInf]     = useState("Macro");
  const [paGoal, setPaGoal]   = useState(150);
  const [probResult, setProb] = useState<ProbabilityResponse | null>(null);
  const [loadingProb, setLoadingProb] = useState(false);
  const [probErr, setProbErr] = useState<string | null>(null);

  const handleOptimize = useCallback(async () => {
    setLoadingOpt(true); setOptErr(null);
    try {
      const r = await api.optimize({ target_sales: targetSales, max_budget: maxBudget, influencer: optInf });
      setOptResult(r);
    } catch { setOptErr(tTp("optError")); }
    finally { setLoadingOpt(false); }
  }, [targetSales, maxBudget, optInf, tTp]);

  const handleProb = useCallback(async () => {
    setLoadingProb(true); setProbErr(null);
    try {
      const r = await api.probability({ TV: paTv, Radio: paRadio, Social_Media: paSm, Influencer: paInf, goal: paGoal });
      setProb(r);
    } catch { setProbErr(tTp("probError")); }
    finally { setLoadingProb(false); }
  }, [paTv, paRadio, paSm, paInf, paGoal, tTp]);

  const probColor = probResult
    ? probResult.probability_goal >= 0.7 ? "var(--green)"
      : probResult.probability_goal >= 0.4 ? "var(--orange)" : "var(--red)"
    : "var(--text-muted)";

  const stepVariants = {
    hidden:  { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  };

  const probGoalLabel = tTp("probGoal", { goal: fmt(paGoal, 2) });

  const sliders = [
    { labelKey: "tvBudget", min: 0, max: 300, value: paTv, setter: setPaTv, color: CH_COLOR.TV as string },
    { labelKey: "radioBudget", min: 0, max: 100, value: paRadio, setter: setPaRadio, color: CH_COLOR.Radio as string },
    { labelKey: "socialBudget", min: 0, max: 50, value: paSm, setter: setPaSm, color: CH_COLOR["Social Media"] as string },
  ] as const;

  const optSplitRows = [
    { key: "TV", raw: optResult?.TV, color: CH_COLOR.TV },
    { key: "Radio", raw: optResult?.Radio, color: CH_COLOR.Radio },
    { key: "Social Media", raw: optResult?.Social_Media, color: CH_COLOR["Social Media"] },
  ];

  const confidenceTier = probResult
    ? probResult.probability_goal >= 0.7 ? tTp("confidenceHigh")
      : probResult.probability_goal >= 0.4 ? tTp("confidenceModerate")
        : tTp("confidenceLow")
    : "";

  return (
    <div className="space-y-10">

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: "var(--accent)" }}>{tTp("eyebrow")}</p>
        <h1 style={{ color: "var(--text-primary)" }}>{tTp("title")}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {tTp("subtitle")}
        </p>
        <div className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
          <span style={{ color: "var(--accent)" }}>→</span>
          {tTp("purpose")}
        </div>
      </motion.div>

      <motion.section
        initial="hidden" animate="visible" variants={stepVariants}
        className="space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent-dim)", border: "1px solid var(--accent)" }}>
            <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>1</span>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h2 style={{ color: "var(--text-primary)" }}>{tTp("inverseTitle")}</h2>
              <Tip content={tTp("inverseTip")} side="right" />
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {tTp("inverseSub")}
            </p>
          </div>
        </div>

        <div className="rounded-card p-6 border space-y-5"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="grid grid-cols-3 gap-5">
            <NumericInput label={tTp("revenueTarget")}
              value={targetSales}
              min={1} max={500} step={10} onChange={setTargetSales} />
            <NumericInput label={tTp("maxBudget")}
              value={maxBudget}
              min={10} max={1000} step={10} onChange={setMaxBudget} />
            <div className="space-y-1.5">
              <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{tc("influencerTier")}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {INFLUENCER_OPTIONS.map(opt => (
                  <motion.button key={opt} type="button" whileTap={{ scale: 0.94 }}
                    onClick={() => setOptInf(opt)}
                    className="py-1.5 text-xs font-semibold rounded-lg border transition-all"
                    style={{
                      background:  optInf === opt ? INFLUENCER_COLOR[opt] : "var(--bg-input)",
                      borderColor: optInf === opt ? INFLUENCER_COLOR[opt] : "var(--border)",
                      color:       optInf === opt ? "white" : "var(--text-muted)",
                    }}>
                    {opt}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={handleOptimize}
            disabled={loadingOpt}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ background: "var(--accent)", color: "white", opacity: loadingOpt ? 0.6 : 1 }}
            whileHover={{ boxShadow: "0 0 24px var(--accent-glow)" }}
          >
            {loadingOpt
              ? <><RefreshCw className="w-4 h-4 animate-spin" />{tTp("optimising")}</>
              : <><Target className="w-4 h-4" />{tTp("findBudget")}</>}
          </motion.button>
          {optErr && <p className="text-xs text-center" style={{ color: "var(--red)" }}>{optErr}</p>}
        </div>

        <AnimatePresence>
          {optResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-2 gap-5"
            >
              <div className="rounded-card p-6 border"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--accent)" }}>
                <p className="text-label mb-5">{tTp("recommendedSplit")}</p>
                <div className="space-y-4">
                  {optSplitRows.map(({ key, raw, color }) => {
                    const value = raw ?? 0;
                    const chName = channelLabel(tCh as (k: string) => string, key);
                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                            <span style={{ color: "var(--text-primary)" }}>{chName}</span>
                          </span>
                          <span className="font-mono font-semibold tabular-nums" style={{ color }}>
                            ${fmt(value, 1)}M
                            <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>
                              ({fmt((value / optResult.total_budget) * 100, 0)}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden"
                          style={{ background: "var(--track-bg)" }}>
                          <motion.div className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(value / maxBudget) * 100}%` }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            style={{ background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 pt-4 border-t grid grid-cols-2 gap-3"
                  style={{ borderColor: "var(--border)" }}>
                  <div>
                    <p className="text-label">{tc("totalBudget")}</p>
                    <p className="text-xl font-bold tabular-nums mt-1"
                      style={{ color: "var(--text-primary)" }}>
                      ${fmt(optResult.total_budget, 1)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-label">{tTp("estRoi")}</p>
                    <p className="text-xl font-bold tabular-nums mt-1"
                      style={{ color: optResult.roi >= 0 ? "var(--green)" : "var(--red)" }}>
                      {optResult.roi >= 0 ? "+" : ""}{fmt(optResult.roi, 1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-card p-6 border space-y-4"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                <p className="text-label">{tTp("projectedOutcome")}</p>
                <div>
                  <p className="text-5xl font-bold tracking-tight tabular-nums"
                    style={{ color: "var(--text-primary)" }}>
                    ${fmt(optResult.projected_sales)}M
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {Math.abs(optResult.gap) < 1
                      ? <CheckCircle2 className="w-4 h-4" style={{ color: "var(--green)" }} />
                      : <ArrowRight className="w-4 h-4" style={{ color: "var(--orange)" }} />}
                    <span className="text-sm"
                      style={{ color: Math.abs(optResult.gap) < 5 ? "var(--green)" : "var(--orange)" }}>
                      {tc("vsTarget", {
                        gap: `${optResult.gap >= 0 ? "+" : ""}${fmt(optResult.gap, 2)}`,
                        target: `${targetSales}`,
                      })}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>{tTp("progressTarget")}</span>
                    <span className="tabular-nums">
                      {fmt(Math.min((optResult.projected_sales / targetSales) * 100, 100), 0)}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden"
                    style={{ background: "var(--track-bg)" }}>
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((optResult.projected_sales / targetSales) * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      style={{ background: Math.abs(optResult.gap) < 5 ? "var(--green)" : "var(--accent)" }}
                    />
                  </div>
                </div>

                {!optResult.converged && (
                  <div className="rounded-lg p-3 text-xs flex items-start gap-2"
                    style={{ background: "var(--orange-dim)", color: "var(--orange)" }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      {tTp("notConverged")}
                      <Tip content={tTp("notConvergedTip")} side="top" />
                      {" "}{tTp("raiseCap")}
                    </span>
                  </div>
                )}
                <p className="text-xs border-t pt-3" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
                  {tc("usingModel", { model: modelLabel(tm as (k: string) => string, optResult.model_used) })}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      <motion.section
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={stepVariants}
        className="space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(139,92,246,0.15)", border: "1px solid #8b5cf6" }}>
            <span className="text-xs font-bold" style={{ color: "#8b5cf6" }}>2</span>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h2 style={{ color: "var(--text-primary)" }}>{tTp("probabilityTitle")}</h2>
              <Tip content={tTp("probabilityTip")} side="right" />
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {tTp("probabilitySub")}
            </p>
          </div>
        </div>

        <div className="rounded-card p-6 border space-y-5"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {sliders.map(({ labelKey, min, max, value, setter, color }) => {
                const pct = ((value - min) / (max - min)) * 100;
                return (
                  <div key={labelKey} className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                        {tTp(labelKey)}
                      </label>
                      <span className="text-xs font-mono font-bold tabular-nums" style={{ color }}>
                        {fmt(value, 1)}M
                      </span>
                    </div>
                    <div className="relative h-8 flex items-center cursor-pointer">
                      <div className="absolute inset-x-0 h-1.5 rounded-full pointer-events-none"
                        style={{ background: "var(--track-bg)" }}>
                        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <input type="range" min={min} max={max} value={value}
                        onChange={e => setter(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{tc("influencerTier")}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {INFLUENCER_OPTIONS.map(opt => (
                    <motion.button key={opt} type="button" whileTap={{ scale: 0.94 }}
                      onClick={() => setPaInf(opt)}
                      className="py-1.5 text-xs font-semibold rounded-lg border"
                      style={{
                        background:  paInf === opt ? INFLUENCER_COLOR[opt] : "var(--bg-input)",
                        borderColor: paInf === opt ? INFLUENCER_COLOR[opt] : "var(--border)",
                        color:       paInf === opt ? "white" : "var(--text-muted)",
                      }}>
                      {opt}
                    </motion.button>
                  ))}
                </div>
              </div>
              <NumericInput label={tTp("revenueGoal")} value={paGoal}
                min={1} max={500} step={10} onChange={setPaGoal} />
            </div>
          </div>

          <motion.button
            type="button"
            onClick={handleProb}
            disabled={loadingProb}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            style={{ background: "#8b5cf6", color: "white", opacity: loadingProb ? 0.6 : 1 }}
            whileHover={{ boxShadow: "0 0 24px rgba(139,92,246,0.35)" }}
          >
            {loadingProb
              ? <><RefreshCw className="w-4 h-4 animate-spin" />{tTp("analysing")}</>
              : <><TrendingUp className="w-4 h-4" />{tTp("analyseProbability")}</>}
          </motion.button>
          {probErr && <p className="text-xs text-center" style={{ color: "var(--red)" }}>{probErr}</p>}
        </div>

        <AnimatePresence>
          {probResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-card p-5 border"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-1 mb-3">
                    <p className="text-label">{tTp("rfMean")}</p>
                    <Tip content={tTp("rfMeanTip")} />
                  </div>
                  <p className="text-4xl font-bold tabular-nums" style={{ color: "#8b5cf6" }}>
                    ${fmt(probResult.mean, 1)}M
                  </p>
                  <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                    ±{fmt(probResult.std, 2)}M · {probResult.n_trees} {tc("trees")}
                    <Tip content={tTp("treesTip", { n: probResult.n_trees })} />
                  </p>
                </div>

                <div className="rounded-card p-5 border"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <p className="text-label mb-3">{tTp("predictionRange")}</p>
                  <p className="text-lg font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    ${fmt(probResult.min, 1)}M – ${fmt(probResult.max, 1)}M
                  </p>
                  <div className="mt-3 h-2 rounded-full overflow-hidden"
                    style={{ background: "var(--track-bg)" }}>
                    <div className="h-full rounded-full"
                      style={{ width: "80%", marginLeft: "5%", background: "linear-gradient(90deg, #3b82f6, #8b5cf6)" }} />
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                    {tTp("minMaxTrees")}
                  </p>
                </div>

                <div className="rounded-card p-5 border"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: probColor }}>
                  <div className="flex items-center gap-1 mb-3">
                    <p className="text-label">{probGoalLabel}</p>
                    <Tip content={tTp("probGoalTip")} />
                  </div>
                  <p className="text-4xl font-bold tabular-nums" style={{ color: probColor }}>
                    {fmt(probResult.probability_goal * 100, 1)}%
                  </p>
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--track-bg)" }}>
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${probResult.probability_goal * 100}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      style={{ background: probColor }}
                    />
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                    {confidenceTier}
                  </p>
                </div>
              </div>

              <div className="rounded-card p-5 border"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                <p className="text-label mb-1">{tTp("distribution")}</p>
                <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                  {tTp("distributionSub")}
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={probResult.histogram} barSize={7}
                    margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" tick={{ fontSize: 9 }}
                      tickFormatter={v => `$${v}M`} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(v: number) => [v, tTp("tooltipTrees")]}
                      labelFormatter={(v: string | number) => `~$${v}M`}
                      contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 11 }}
                    />
                    <ReferenceLine x={probResult.goal} stroke="var(--orange)" strokeWidth={2} strokeDasharray="4 2"
                      label={{ value: tTp("goalLabel", { goal: fmt(paGoal, 2) }), position: "top", fontSize: 10, fill: "var(--orange)" }} />
                    <Bar dataKey="count" name={tTp("tooltipTrees")} radius={[2, 2, 0, 0]}>
                      {probResult.histogram.map((d, i) => (
                        <Cell key={i} fill={d.above_goal ? "var(--green)" : "#3b82f6"} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}
