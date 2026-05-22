"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Zap, Activity,
  DollarSign, BarChart3,
} from "lucide-react";
import { Tip } from "@/components/Tooltip";
import { api, PredictResponse, ClassifyResponse } from "@/lib/api";
import { fmt } from "@/lib/utils";
import { channelLabel, modelLabel, perfClassLabel } from "@/lib/i18n-helpers";

const CH_COLOR = { TV: "#3b82f6", Radio: "#8b5cf6", "Social Media": "#06b6d4" } as const;
const INFLUENCER_OPTIONS = ["Mega", "Macro", "Micro", "Nano"] as const;
const INFLUENCER_COLOR: Record<string, string> = {
  Mega: "#6366f1", Macro: "#8b5cf6", Micro: "#06b6d4", Nano: "#f59e0b",
};

const TRAIN_MAX = { TV: 100, Radio: 50, "Social Media": 14 } as const;

function SpringNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 55, damping: 18 });
  const [display, setDisplay] = useState("0");

  useEffect(() => { mv.set(value); }, [value, mv]);
  useEffect(() => spring.on("change", (v) => setDisplay(v.toFixed(decimals))), [spring, decimals]);

  return <span className="tabular-nums">{display}</span>;
}

function ChannelSlider({
  label,
  value, min, max, step = 1, onChange, color, trainingMax,
}: {
  label: string;
  value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void;
  color: string; trainingMax: number;
}) {
  const tp = useTranslations("predict");

  const trackRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const isDragging = useRef(false);

  const pct = ((value - min) / (max - min)) * 100;
  const inRange = value <= trainingMax;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDragging.current = true;
    const el = trackRef.current!;
    el.setPointerCapture(e.pointerId);

    const calc = (clientX: number) => {
      const rect = el.getBoundingClientRect();
      const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = min + frac * (max - min);
      return Math.min(max, Math.max(min, Math.round(raw / step) * step));
    };

    onChangeRef.current(calc(e.clientX));

    const onMove = (ev: PointerEvent) => onChangeRef.current(calc(ev.clientX));
    const onUp = () => {
      isDragging.current = false;
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
  };

  const dragT = { duration: 0 } as const;
  const idleT = { type: "spring", stiffness: 120, damping: 20 } as const;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</label>
        </div>
        <div className="flex items-center gap-2">
          <Tip
            content={inRange ? tp("inRangeTip") : tp("extrapolatingTip")}
            side="left"
          >
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium cursor-help ${inRange ? "" : "animate-pulse"}`}
              style={{
                color: inRange ? "var(--green)" : "var(--orange)",
                background: inRange ? "var(--green-dim)" : "var(--orange-dim)",
              }}>
              {inRange ? tp("inRange") : tp("extrapolating")}
            </span>
          </Tip>
          <span className="text-sm font-mono font-bold tabular-nums" style={{ color }}>
            {fmt(value, 1)}M
          </span>
        </div>
      </div>

      <div
        ref={trackRef}
        className="relative h-8 flex items-center cursor-pointer select-none touch-none"
        onPointerDown={handlePointerDown}
      >
        <div className="absolute inset-x-0 h-1.5 rounded-full pointer-events-none"
          style={{ background: "var(--track-bg)" }}>
          <div className="absolute top-1/2 -translate-y-1/2 w-px h-3 rounded-full"
            style={{ left: `${(trainingMax / max) * 100}%`, background: "rgba(255,255,255,0.25)" }} />
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            animate={{ width: `${pct}%` }}
            transition={isDragging.current ? dragT : idleT}
            style={{ background: inRange ? color : "var(--orange)" }}
          />
        </div>
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 bg-white shadow-md pointer-events-none"
          animate={{ left: `${pct}%` }}
          transition={isDragging.current ? dragT : idleT}
          style={{ marginLeft: "-8px", borderColor: inRange ? color : "var(--orange)" }}
        />
      </div>

      <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        <span>{min}M</span>
        <span className="opacity-60">{tp("trainingMax", { max: String(trainingMax) })}</span>
        <span>{max}M</span>
      </div>
    </div>
  );
}

function PerfBadge({ label, confidence }: { label: string; confidence: number }) {
  const tPerf = useTranslations("perfClass");
  const display = perfClassLabel(tPerf as (k: string) => string, label);

  const cfg = {
    High:   { color: "var(--green)",  bg: "var(--green-dim)",  emoji: "🚀" },
    Medium: { color: "var(--orange)", bg: "var(--orange-dim)", emoji: "📈" },
    Low:    { color: "var(--red)",    bg: "var(--red-dim)",    emoji: "⚠️" },
  }[label] ?? { color: "var(--text-muted)", bg: "transparent", emoji: "—" };

  const tp = useTranslations("predict");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xl">{cfg.emoji}</span>
        <span className="text-2xl font-bold" style={{ color: cfg.color }}>{display}</span>
      </div>
      <div className="space-y-1">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--track-bg)" }}>
          <motion.div className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${confidence * 100}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: cfg.color }} />
        </div>
        <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
          {tp("modelConfidence", { pct: (confidence * 100).toFixed(0) })}
        </p>
      </div>
    </div>
  );
}

export default function PredictPage() {
  const t = useTranslations("predict");
  const tc = useTranslations("common");
  const tm = useTranslations("modelNames");
  const tCh = useTranslations("channels");

  const [TV, setTV]         = useState(50);
  const [Radio, setRadio]   = useState(20);
  const [Social, setSocial] = useState(5);
  const [influencer, setInfluencer] = useState<string>("Mega");

  const [result, setResult]           = useState<PredictResponse | null>(null);
  const [classification, setClf]      = useState<ClassifyResponse | null>(null);
  const [loading, setLoading]          = useState(false);
  const [firstLoad, setFirstLoad]      = useState(false);
  const debounceRef                    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runPrediction = useCallback(async () => {
    setLoading(true);
    try {
      const body = { TV, Radio, Social_Media: Social, Influencer: influencer };
      const [r, clf] = await Promise.all([
        api.predict(body),
        api.classify(body),
      ]);
      setResult(r);
      setClf(clf);
      setFirstLoad(true);
    } catch {
      /* silently retry on next slider change */
    } finally {
      setLoading(false);
    }
  }, [TV, Radio, Social, influencer]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runPrediction, 650);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [runPrediction]);

  const totalBudget = TV + Radio + Social;
  const roiPct = result ? ((result.roi - 1) * 100) : 0;
  const budgetPieKeys = ["TV", "Radio", "Social Media"] as const;
  const budgetPie = budgetPieKeys.map((name) => ({
    key: name,
    name,
    label: channelLabel(tCh as (k: string) => string, name),
    value: name === "TV" ? TV : name === "Radio" ? Radio : Social,
    color: CH_COLOR[name],
  }));

  const breakdownRows = budgetPieKeys.map((name) => ({
    key: name,
    label: channelLabel(tCh as (k: string) => string, name),
    value: name === "TV" ? TV : name === "Radio" ? Radio : Social,
    color: CH_COLOR[name],
  }));

  const influencerBlurbs: Record<(typeof INFLUENCER_OPTIONS)[number], string> = {
    Mega:  t("influencerMega"),
    Macro: t("influencerMacro"),
    Micro: t("influencerMicro"),
    Nano:  t("influencerNano"),
  };

  return (
    <div className="space-y-8">

      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: "var(--accent)" }}>{t("eyebrow")}</p>
        <h1 style={{ color: "var(--text-primary)" }}>{t("title")}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {t("subtitle")}
        </p>
        <div className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
          <span style={{ color: "var(--accent)" }}>→</span>
          {t("purpose")}
        </div>
      </motion.div>

      <div className="grid grid-cols-5 gap-6">

        <motion.div
          className="col-span-2 space-y-5"
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-card p-6 border space-y-6"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <p className="text-label">{t("budgetAllocation")}</p>
            <ChannelSlider label={channelLabel(tCh as (key: string) => string, "TV")}
              value={TV} min={0} max={300} onChange={setTV}
              color={CH_COLOR.TV} trainingMax={TRAIN_MAX.TV} />
            <ChannelSlider label={channelLabel(tCh as (key: string) => string, "Radio")}
              value={Radio} min={0} max={100} onChange={setRadio}
              color={CH_COLOR.Radio} trainingMax={TRAIN_MAX.Radio} />
            <ChannelSlider label={channelLabel(tCh as (key: string) => string, "Social Media")}
              value={Social} min={0} max={50} step={0.5}
              onChange={setSocial} color={CH_COLOR["Social Media"]}
              trainingMax={TRAIN_MAX["Social Media"]} />

            <div className="space-y-2">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {tc("influencerTier")}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {INFLUENCER_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt}
                    onClick={() => setInfluencer(opt)}
                    whileTap={{ scale: 0.94 }}
                    className="py-2 text-xs font-semibold rounded-lg border transition-all"
                    style={{
                      background:   influencer === opt ? INFLUENCER_COLOR[opt] : "var(--bg-input)",
                      borderColor:  influencer === opt ? INFLUENCER_COLOR[opt] : "var(--border)",
                      color:        influencer === opt ? "white" : "var(--text-muted)",
                    }}
                  >
                    {opt}
                  </motion.button>
                ))}
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {influencerBlurbs[influencer as keyof typeof influencerBlurbs] ?? ""}
              </p>
            </div>

            <div className="pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  {tc("totalBudget")}
                </span>
                <span className="text-base font-bold font-mono tabular-nums"
                  style={{ color: "var(--text-primary)" }}>
                  ${fmt(totalBudget, 1)}M
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-card p-5 border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <p className="text-label mb-3">{t("spendDistribution")}</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={90} height={90}>
                <PieChart>
                  <Pie data={budgetPie} dataKey="value" cx="50%" cy="50%"
                    innerRadius={24} outerRadius={42} paddingAngle={3}>
                    {budgetPie.map((d) => <Cell key={d.key} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${fmt(v, 1)}M`]}
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {budgetPie.map(({ key, label, value, color }) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                    </div>
                    <span className="font-mono font-semibold tabular-nums" style={{ color }}>
                      {totalBudget > 0 ? fmt((value / totalBudget) * 100, 0) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            {loading ? (
              <>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
                <span>{tc("predicting")}</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full" style={{ background: "var(--green)" }} />
                <span>{tc("autoUpdate")}</span>
              </>
            )}
          </div>
        </motion.div>

        <div className="col-span-3 space-y-5">
          <AnimatePresence mode="wait">
            {!firstLoad ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center rounded-card border border-dashed py-20"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center"
                    style={{ background: "var(--accent-dim)" }}>
                    <Zap className="w-6 h-6" style={{ color: "var(--accent)" }} strokeWidth={1.8} />
                  </div>
                  <p style={{ color: "var(--text-muted)" }} className="text-sm">
                    {t("loadingFirst")}
                  </p>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-5"
              >
                <div className="rounded-card p-7 border relative overflow-hidden"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--accent)",
                    boxShadow: "0 0 40px rgba(59,130,246,0.08)",
                  }}>
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: "radial-gradient(circle at 100% 0%, rgba(59,130,246,0.08) 0%, transparent 60%)" }} />

                  <div className="flex items-start justify-between relative">
                    <div>
                      <p className="text-label mb-3">{t("predictedRevenue")}</p>
                      <p className="text-6xl font-bold tracking-tight leading-none"
                        style={{ color: "var(--text-primary)" }}>
                        $<SpringNumber value={result.predicted_sales} decimals={2} />
                        <span className="text-2xl ml-1" style={{ color: "var(--text-muted)" }}>M</span>
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        {result.vs_average >= 0
                          ? <TrendingUp className="w-4 h-4" style={{ color: "var(--green)" }} />
                          : <TrendingDown className="w-4 h-4" style={{ color: "var(--red)" }} />}
                        <span className="text-sm font-medium"
                          style={{ color: result.vs_average >= 0 ? "var(--green)" : "var(--red)" }}>
                          {result.vs_average >= 0 ? "+" : ""}
                          {t("vsAverage", { delta: fmt(result.vs_average, 2) })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-label mb-1.5">{tc("model")}</p>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {modelLabel(tm as (key: string) => string, result.model_used)}
                      </span>
                      <p className="text-xs mt-1.5 tabular-nums" style={{ color: "var(--text-muted)" }}>
                        R² = 0.9965
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-card p-5 border"
                    style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4" style={{ color: "var(--green)" }} />
                      <p className="text-label">{t("roi")}</p>
                      <Tip content={t("roiTip")} />
                    </div>
                    <p className="text-3xl font-bold"
                      style={{ color: roiPct >= 0 ? "var(--green)" : "var(--red)" }}>
                      {roiPct >= 0 ? "+" : ""}
                      <SpringNumber value={roiPct} decimals={1} />%
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {t("roiSub")}
                    </p>
                  </div>

                  <div className="rounded-card p-5 border"
                    style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4" style={{ color: "var(--accent)" }} />
                      <p className="text-label">{t("efficiency")}</p>
                      <Tip content={t("efficiencyTip")} />
                    </div>
                    <p className="text-3xl font-bold" style={{ color: "var(--accent)" }}>
                      <SpringNumber value={totalBudget > 0 ? result.predicted_sales / totalBudget : 0} decimals={2} />
                      <span className="text-base ml-0.5">×</span>
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {t("efficiencySub")}
                    </p>
                  </div>

                  <div className="rounded-card p-5 border"
                    style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4" style={{ color: "var(--purple)" }} />
                      <p className="text-label">{t("campaignClass")}</p>
                      <Tip content={t("campaignClassTip")} />
                    </div>
                    {classification && (
                      <PerfBadge label={classification.label} confidence={classification.confidence} />
                    )}
                  </div>
                </div>

                <div className="rounded-card p-5 border"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <p className="text-label mb-4">{t("budgetBreakdown")}</p>
                  <div className="space-y-3">
                    {breakdownRows.map(({ key, label, value, color }) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                            <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                          </span>
                          <span className="font-mono tabular-nums" style={{ color: "var(--text-muted)" }}>
                            ${fmt(value, 1)}M · {totalBudget > 0 ? fmt((value / totalBudget) * 100, 0) : 0}%
                          </span>
                        </div>
                        <div className="h-1 rounded-full" style={{ background: "var(--track-bg)" }}>
                          <motion.div className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${totalBudget > 0 ? (value / totalBudget) * 100 : 0}%` }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            style={{ background: color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
