"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { channelLabel } from "@/lib/i18n-helpers";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Tip } from "@/components/Tooltip";
import { api, PredictResponse, TvSweepPoint } from "@/lib/api";
import { fmt } from "@/lib/utils";

const CH_COLOR = { TV: "#3b82f6", Radio: "#8b5cf6", "Social Media": "#06b6d4" } as const;
const INFLUENCER_OPTIONS = ["Mega", "Macro", "Micro", "Nano"] as const;
const INFLUENCER_COLOR: Record<string, string> = {
  Mega: "#6366f1", Macro: "#8b5cf6", Micro: "#06b6d4", Nano: "#f59e0b",
};

const PRESET_KEYS = ["presetBalanced", "presetTvHeavy", "presetDigital", "presetLean"] as const;
const PRESET_SUB_KEYS = ["presetBalancedSub", "presetTvHeavySub", "presetDigitalSub", "presetLeanSub"] as const;
const PRESET_VALUES = [
  { TV: 50, Radio: 18, Social: 3,  Influencer: "Macro" },
  { TV: 90, Radio: 10, Social: 2,  Influencer: "Mega" },
  { TV: 20, Radio: 5,  Social: 12, Influencer: "Micro" },
  { TV: 15, Radio: 5,  Social: 1,  Influencer: "Nano" },
] as const;

/* ─ Slider ─ */
function SliderField({
  label, value, min, max, step = 1, onChange, color,
}: {
  label: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void; color: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const isDragging = useRef(false);

  const pct = ((value - min) / (max - min)) * 100;

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
  const idleT = { type: "spring", stiffness: 120, damping: 22 } as const;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</label>
        </div>
        <span className="text-sm font-mono font-bold tabular-nums" style={{ color }}>
          {fmt(value, 1)}M
        </span>
      </div>
      <div
        ref={trackRef}
        className="relative h-8 flex items-center cursor-pointer select-none touch-none"
        onPointerDown={handlePointerDown}
      >
        {/* Track */}
        <div className="absolute inset-x-0 h-1.5 rounded-full pointer-events-none"
          style={{ background: "var(--track-bg)" }}>
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            animate={{ width: `${pct}%` }}
            transition={isDragging.current ? dragT : idleT}
            style={{ background: color }}
          />
        </div>
        {/* Thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 bg-white shadow-md pointer-events-none"
          animate={{ left: `${pct}%` }}
          transition={isDragging.current ? dragT : idleT}
          style={{ marginLeft: "-8px", borderColor: color }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════ */
export default function SimulatorPage() {
  const t = useTranslations("simulator");
  const tc = useTranslations("common");
  const tCh = useTranslations("channels");
  const [TV, setTV]         = useState(50);
  const [Radio, setRadio]   = useState(18);
  const [Social, setSocial] = useState(3);
  const [influencer, setInfluencer] = useState("Macro");

  const [result, setResult]       = useState<PredictResponse | null>(null);
  const [sweepData, setSweepData] = useState<TvSweepPoint[]>([]);
  const [sweepMax, setSweepMax]   = useState(297);
  const [loading, setLoading]     = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const body = { TV, Radio, Social_Media: Social, Influencer: influencer };
      const [r, sweep] = await Promise.all([
        api.predict(body),
        api.tvSweep(Radio, Social, influencer),
      ]);
      setResult(r);
      setSweepData(sweep.data);
      setSweepMax(sweep.training_max_tv);
      setHasResult(true);
    } catch { /* retry on next change */ }
    finally { setLoading(false); }
  }, [TV, Radio, Social, influencer]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(run, 700);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [run]);

  const applyPreset = (i: number) => {
    const p = PRESET_VALUES[i];
    setTV(p.TV); setRadio(p.Radio); setSocial(p.Social); setInfluencer(p.Influencer);
  };

  const totalBudget = TV + Radio + Social;
  const roiPct = result ? ((result.roi - 1) * 100) : 0;

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
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

        {/* ── Controls ── */}
        <motion.div
          className="col-span-2 space-y-5"
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Presets */}
          <div className="rounded-card p-5 border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <p className="text-label mb-3">{t("presets")}</p>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_VALUES.map((p, i) => (
                <motion.button key={PRESET_KEYS[i]}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => applyPreset(i)}
                  className="px-3 py-2.5 text-left rounded-xl border text-xs transition-all"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                  whileHover={{ borderColor: "var(--accent)", color: "var(--text-primary)" }}
                >
                  <span className="block font-semibold text-[11px]" style={{ color: "var(--text-primary)" }}>
                    {t(PRESET_KEYS[i])}
                  </span>
                  <span className="text-[10px]">{t(PRESET_SUB_KEYS[i])} · TV={p.TV}M</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="rounded-card p-6 border space-y-6"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <p className="text-label">{t("channelBudget")}</p>
            <SliderField label={tCh("TV")} value={TV} min={0} max={300} onChange={setTV} color={CH_COLOR.TV} />
            <SliderField label={tCh("Radio")} value={Radio} min={0} max={100} onChange={setRadio} color={CH_COLOR.Radio} />
            <SliderField label={tCh("Social Media")} value={Social} min={0} max={50} step={0.5} onChange={setSocial} color={CH_COLOR["Social Media"]} />

            <div className="space-y-2">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{tc("influencerTier")}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {INFLUENCER_OPTIONS.map((opt) => (
                  <motion.button key={opt} whileTap={{ scale: 0.94 }}
                    onClick={() => setInfluencer(opt)}
                    className="py-1.5 text-xs font-semibold rounded-lg border transition-colors"
                    style={{
                      background:  influencer === opt ? INFLUENCER_COLOR[opt] : "var(--bg-input)",
                      borderColor: influencer === opt ? INFLUENCER_COLOR[opt] : "var(--border)",
                      color:       influencer === opt ? "white" : "var(--text-muted)",
                    }}>
                    {opt}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Budget summary */}
            <div className="pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{tc("totalBudget")}</span>
                <span className="font-mono font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  ${fmt(totalBudget, 1)}M
                </span>
              </div>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            {loading
              ? <><div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }} /><span>{tc("updating")}</span></>
              : <><div className="w-2 h-2 rounded-full" style={{ background: "var(--green)" }} /><span>{tc("liveNoButton")}</span></>}
          </div>
        </motion.div>

        {/* ── Results ── */}
        <div className="col-span-3 space-y-5">
          <AnimatePresence>
            {hasResult && result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-5"
              >
                {/* KPI row */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: t("revenueForecast"),
                      tip: t("revenueForecastTip"),
                      value: `$${fmt(result.predicted_sales)}M`,
                      sub: t("vsAvg", { delta: `${result.vs_average >= 0 ? "+" : ""}${fmt(result.vs_average, 2)}` }),
                      positive: result.vs_average >= 0,
                      accent: "var(--accent)",
                      big: true,
                    },
                    {
                      label: t("roi"),
                      tip: t("roiTip"),
                      value: `${roiPct >= 0 ? "+" : ""}${fmt(roiPct, 1)}%`,
                      sub: t("roiSub"),
                      positive: roiPct >= 0,
                      accent: roiPct >= 0 ? "var(--green)" : "var(--red)",
                      big: false,
                    },
                    {
                      label: t("efficiency"),
                      tip: t("efficiencyTip"),
                      value: `${fmt(totalBudget > 0 ? result.predicted_sales / totalBudget : 0, 2)}×`,
                      sub: t("efficiencySub"),
                      positive: true,
                      accent: "var(--purple)",
                      big: false,
                    },
                  ].map(({ label, tip, value, sub, positive, accent, big }) => (
                    <div key={label} className="rounded-card p-5 border"
                      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-1 mb-2">
                        <p className="text-label">{label}</p>
                        <Tip content={tip} />
                      </div>
                      <p className={`font-bold tabular-nums ${big ? "text-3xl" : "text-2xl"}`}
                        style={{ color: accent }}>
                        {value}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        {positive
                          ? <ArrowUpRight className="w-3 h-3" style={{ color: "var(--green)" }} />
                          : <ArrowDownRight className="w-3 h-3" style={{ color: "var(--red)" }} />}
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Model attribution */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t("poweredBy")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                      Random Forest
                    </span>
                    <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>R² = 0.9965</span>
                  </div>
                </div>

                {/* Budget breakdown */}
                <div className="rounded-card p-5 border"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <p className="text-label mb-4">{t("channelAllocation")}</p>
                  <div className="space-y-3">
                    {[
                      { name: "TV" as const,           value: TV,    color: CH_COLOR.TV },
                      { name: "Radio" as const,        value: Radio, color: CH_COLOR.Radio },
                      { name: "Social Media" as const, value: Social,color: CH_COLOR["Social Media"] },
                    ].map(({ name, value, color }) => (
                      <div key={name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                            <span style={{ color: "var(--text-secondary)" }}>{channelLabel(tCh, name)}</span>
                          </span>
                          <span className="font-mono tabular-nums" style={{ color: "var(--text-muted)" }}>
                            {fmt(value, 1)}M · {totalBudget > 0 ? fmt((value / totalBudget) * 100, 0) : 0}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "var(--track-bg)" }}>
                          <motion.div className="h-full rounded-full"
                            animate={{ width: `${totalBudget > 0 ? (value / totalBudget) * 100 : 0}%` }}
                            transition={{ type: "spring", stiffness: 80, damping: 18 }}
                            style={{ background: color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TV Sensitivity sweep */}
                {sweepData.length > 0 && (
                  <div className="rounded-card p-5 border"
                    style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-1 mb-1">
                      <p className="text-label">{t("tvSensitivity")}</p>
                      <Tip content={t("tvSensitivityTip")} />
                    </div>
                    <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                      {t("tvSensitivitySub", {
                        max: fmt(sweepData[sweepData.length - 1]?.tv ?? 0, 0),
                        radio: fmt(Radio, 0),
                        sm: fmt(Social, 1),
                      })}
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={sweepData} margin={{ left: 0, right: 10, top: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="sweepGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tv" tick={{ fontSize: 9 }}
                          label={{ value: "TV ($M)", position: "insideBottomRight", offset: -5, fontSize: 9, fill: "var(--text-muted)" }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}M`, tc("revenue")]}
                          labelFormatter={(v) => `${tCh("TV")}: $${v}M`}
                          contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 11 }} />
                        {/* Training range boundary */}
                        <ReferenceLine x={sweepMax} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 3"
                          label={{ value: t("trainingCap"), position: "top", fontSize: 9, fill: "var(--text-muted)" }} />
                        <ReferenceLine x={TV} stroke="var(--accent)" strokeWidth={1.5}
                          label={{ value: t("currentTvLabel", { tv: TV }), position: "top", fontSize: 9, fill: "var(--accent)" }} />
                        <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2.5}
                          dot={false} activeDot={{ r: 4, fill: "#3b82f6" }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-6 mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-5 h-0.5 rounded bg-blue-500" />
                        {t("revenueForecastLegend")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-5 h-0.5 rounded" style={{ background: "var(--accent)" }} />
                        {t("currentTv")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-5 h-px" style={{ borderTop: "2px dashed rgba(255,255,255,0.3)" }} />
                        {t("trainingBoundary")}
                        <Tip content={t("trainingBoundaryTip")} side="top" />
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading skeleton */}
          {!hasResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 rounded-card animate-shimmer" />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
