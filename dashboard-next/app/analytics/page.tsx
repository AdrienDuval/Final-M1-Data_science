"use client";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, PieChart, Pie, Legend, ComposedChart, Line, ReferenceLine,
  ErrorBar,
} from "recharts";
import {
  Database, AlertTriangle, TrendingUp, BarChart2,
  Activity, Users, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Tip } from "@/components/Tooltip";
import { api, EDAStats, FeatureStat } from "@/lib/api";
import { fmt } from "@/lib/utils";
import {
  channelLabel, corrStrengthLabel, perfClassLabel,
  skewLabel, statFeatureLabel, statTableHeaders, boxTableHeaders,
} from "@/lib/i18n-helpers";

// ── Colour palettes ───────────────────────────────────────────────────────────

const FEAT_COLOR: Record<string, string> = {
  TV:             "#3b82f6",
  Radio:          "#8b5cf6",
  "Social Media": "#06b6d4",
  Sales:          "#10b981",
};

const INF_COLOR: Record<string, string> = {
  Mega: "#6366f1", Macro: "#8b5cf6", Micro: "#06b6d4", Nano: "#f59e0b",
};

const CLASS_COLOR: Record<string, string> = {
  High: "#10b981", Medium: "#f59e0b", Low: "#ef4444",
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

// ── Small helpers ─────────────────────────────────────────────────────────────

const FEATURES_ORDER = ["TV", "Radio", "Social Media", "Sales"];
const INF_ORDER      = ["Mega", "Macro", "Micro", "Nano"];

// ── Custom tooltip helpers ────────────────────────────────────────────────────

function HistTip({ active, payload, countLabel }: {
  active?: boolean;
  payload?: Array<{ payload?: HistBin; value?: number }>;
  countLabel: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload;
  if (!b) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs shadow-xl" style={{ borderColor: "var(--border-strong)" }}>
      <p style={{ color: "var(--text-muted)" }}>{fmt(b.bin_start, 1)} – {fmt(b.bin_end, 1)}</p>
      <p className="font-semibold tabular-nums" style={{ color: "var(--accent)" }}>{countLabel(b.count)}</p>
    </div>
  );
}

interface HistBin { bin_start: number; bin_end: number; count: number; midpoint: number; }

function ScatterTip({ active, payload, labels }: {
  active?: boolean;
  payload?: Array<{ payload?: { tv: number; radio: number; social: number; sales: number; influencer: string }; color?: string }>;
  labels: { sales: (v: number) => string; tv: (v: number) => string; radio: (v: number) => string };
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs shadow-xl" style={{ borderColor: "var(--border-strong)" }}>
      <p className="font-semibold mb-0.5" style={{ color: payload[0].color || "var(--accent)" }}>{d.influencer}</p>
      <p style={{ color: "var(--text-muted)" }}>{labels.sales(d.sales)}</p>
      <p style={{ color: "var(--text-muted)" }}>{labels.tv(d.tv)}</p>
      <p style={{ color: "var(--text-muted)" }}>{labels.radio(d.radio)}</p>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color, icon: Icon, delay = 0,
}: {
  label: string; value: string; sub?: string;
  color: string; icon: React.ElementType; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-card p-5 border"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-label truncate">{label}</p>
          <p className="text-2xl font-bold tabular-nums mt-0.5" style={{ color: "var(--text-primary)" }}>{value}</p>
          {sub && <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{sub}</p>}
        </div>
      </div>
    </motion.div>
  );
}

// ── Histogram panel ───────────────────────────────────────────────────────────

function HistPanel({ col, bins, stat, color, displayName, ts }: {
  col: string; bins: HistBin[]; stat: FeatureStat; color: string;
  displayName: string;
  ts: ReturnType<typeof useTranslations<"stats">>;
}) {
  return (
    <motion.div
      className="rounded-card p-5 border"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{displayName}</p>
        </div>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{ background: `${color}18`, color }}
        >
          {skewLabel(ts, stat.skewness)}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={bins} barGap={0} barCategoryGap={1}>
          <XAxis dataKey="midpoint" hide />
          <YAxis hide />
          <Tooltip content={<HistTip countLabel={(n) => ts("campaignCount", { count: n })} />} />
          <ReferenceLine x={stat.mean}    stroke={color}       strokeDasharray="4 3" strokeWidth={1.5} />
          <ReferenceLine x={stat.median}  stroke="var(--green)" strokeDasharray="4 3" strokeWidth={1.5} />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {bins.map((b, i) => {
              const isOut = b.midpoint < stat.whisker_low || b.midpoint > stat.whisker_high;
              return <Cell key={i} fill={isOut ? "#ef4444" : color} fillOpacity={isOut ? 0.85 : 0.7} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { label: ts("mean"),   val: fmt(stat.mean,   2) },
          { label: ts("median"), val: fmt(stat.median, 2) },
          { label: ts("std"),    val: `±${fmt(stat.std, 2)}` },
        ].map(({ label, val }) => (
          <div key={label} className="text-center">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{val}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-0.5 rounded" style={{ background: color }} />
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{ts("meanLegend")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-0.5 rounded" style={{ background: "var(--green)" }} />
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{ts("medianLegend")}</span>
        </div>
        {stat.outlier_count > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2.5 rounded-sm" style={{ background: "#ef444460" }} />
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{ts("outlierRegion")}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const t   = useTranslations("analytics");
  const tc  = useTranslations("common");
  const ts  = useTranslations("stats");
  const tCh = useTranslations("channels");
  const tp  = useTranslations("perfClass");

  const tableHeaders = statTableHeaders(ts);
  const boxHeaders   = boxTableHeaders(ts);
  const scatterLabels = {
    sales: (v: number) => ts("scatterSalesLabel", { val: fmt(v, 2) }),
    tv:    (v: number) => ts("scatterTvLabel",    { val: fmt(v, 1) }),
    radio: (v: number) => ts("scatterRadioLabel", { val: fmt(v, 1) }),
  };

  const [data, setData]   = useState<EDAStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.analytics().then(setData).catch(() => setError(true));
  }, []);

  const totalOutliers = useMemo(() => {
    if (!data) return 0;
    return FEATURES_ORDER.reduce((acc, k) => acc + (data.feature_stats[k]?.outlier_count ?? 0), 0);
  }, [data]);

  const scatterByInf = useMemo(() => {
    if (!data) return {} as Record<string, EDAStats["scatter_sample"]>;
    const m: Record<string, EDAStats["scatter_sample"]> = {};
    for (const pt of data.scatter_sample) {
      (m[pt.influencer] ??= []).push(pt);
    }
    return m;
  }, [data]);

  const classPieData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.class_distribution).map(([label, value]) => ({ label, value, fill: CLASS_COLOR[label] ?? "#6b7280" }));
  }, [data]);

  const infBoxData = useMemo(() => {
    if (!data) return [];
    return INF_ORDER.map(inf => {
      const b = data.sales_by_influencer_box[inf];
      if (!b) return null;
      return { name: inf, mean: b.mean, median: b.median, q1: b.q1, q3: b.q3, std: b.std };
    }).filter(Boolean);
  }, [data]);

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{tc("apiUnavailable")}</p>
    </div>
  );

  if (!data) return (
    <div className="space-y-6">
      {[...Array(6)].map((_, i) => <div key={i} className="h-28 rounded-card animate-shimmer" />)}
    </div>
  );

  const stats = data.feature_stats;

  return (
    <div className="space-y-10">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>
          {t("eyebrow")}
        </p>
        <h1 style={{ color: "var(--text-primary)" }}>{t("title")}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {t("subtitle", { count: data.total_campaigns })}
        </p>
      </motion.div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Database}      color="var(--accent)"  label={t("kpiCampaigns")}   value={data.total_campaigns.toLocaleString()} sub={t("kpiCampaignsSub")} delay={0} />
        <StatCard icon={TrendingUp}    color="var(--green)"   label={t("kpiAvgSales")}     value={`${fmt(stats.Sales?.mean ?? 0, 2)} M`} sub={t("kpiAvgSalesSub")} delay={0.07} />
        <StatCard icon={Activity}      color="var(--purple)"  label={t("kpiAvgTv")}         value={`${fmt(stats.TV?.mean ?? 0, 2)} M`}    sub={t("kpiAvgTvSub")} delay={0.14} />
        <StatCard
          icon={AlertTriangle} color={totalOutliers > 0 ? "#f59e0b" : "var(--green)"}
          label={t("kpiOutliers")}
          value={String(totalOutliers)}
          sub={totalOutliers === 0 ? t("kpiOutliersClean") : t("kpiOutliersSub", { pct: fmt(totalOutliers / data.total_campaigns * 100, 1) })}
          delay={0.21}
        />
      </div>

      {/* ── Feature distributions ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4" style={{ color: "var(--accent)" }} strokeWidth={2} />
          <h2 style={{ color: "var(--text-primary)" }}>{t("distTitle")}</h2>
          <Tip content={t("distTip")} />
        </div>
        <p className="text-xs mb-5 -mt-2" style={{ color: "var(--text-muted)" }}>{t("distSub")}</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES_ORDER.map(col => (
            <HistPanel
              key={col}
              col={col}
              displayName={statFeatureLabel(tCh, ts, col)}
              bins={data.histograms[col] ?? []}
              stat={stats[col]!}
              color={FEAT_COLOR[col]}
              ts={ts}
            />
          ))}
        </div>
      </section>

      {/* ── Statistical summary table ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4" style={{ color: "var(--accent)" }} strokeWidth={2} />
          <h2 style={{ color: "var(--text-primary)" }}>{t("summaryTitle")}</h2>
          <Tip content={t("summaryTip")} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-card border overflow-hidden"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-input)" }}>
                  {tableHeaders.map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold whitespace-nowrap"
                      style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES_ORDER.map((col, ri) => {
                  const s = stats[col];
                  if (!s) return null;
                  return (
                    <tr key={col}
                      style={{ borderBottom: ri < FEATURES_ORDER.length - 1 ? "1px solid var(--border)" : "none" }}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: FEAT_COLOR[col] }} />
                          <span className="font-medium" style={{ color: "var(--text-primary)" }}>{statFeatureLabel(tCh, ts, col)}</span>
                        </div>
                      </td>
                      {[s.mean, s.median, s.std, s.min, s.q1, s.q3, s.max, s.iqr].map((v, i) => (
                        <td key={i} className="px-4 py-2.5 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                          {fmt(v, 2)}
                        </td>
                      ))}
                      <td className="px-4 py-2.5 tabular-nums" style={{ color: Math.abs(s.skewness) > 1 ? "#f59e0b" : "var(--text-secondary)" }}>
                        {fmt(s.skewness, 3)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {s.outlier_count > 0
                            ? <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                            : <span className="w-3 h-3 flex-shrink-0 text-center text-[10px]" style={{ color: "var(--green)" }}>✓</span>
                          }
                          <span className="tabular-nums" style={{ color: s.outlier_count > 0 ? "#f59e0b" : "var(--green)" }}>
                            {s.outlier_count} ({fmt(s.outlier_pct, 1)}%)
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* ── Outlier analysis ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-500" strokeWidth={2} />
          <h2 style={{ color: "var(--text-primary)" }}>{t("outlierTitle")}</h2>
          <Tip content={t("outlierTip")} />
        </div>
        <p className="text-xs mb-5 -mt-2" style={{ color: "var(--text-muted)" }}>{t("outlierSub")}</p>

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {FEATURES_ORDER.map(col => {
            const s = stats[col];
            if (!s) return null;
            const color = FEAT_COLOR[col];
            const pct   = s.iqr > 0 ? Math.min(100, ((s.q3 - s.q1) / (s.max - s.min)) * 100) : 50;
            return (
              <motion.div key={col} variants={item}
                className="rounded-card p-5 border"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: s.outlier_count > 0 ? "#f59e0b50" : "var(--border)",
                  borderLeftWidth: 3,
                  borderLeftColor: s.outlier_count > 0 ? "#f59e0b" : "var(--green)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{statFeatureLabel(tCh, ts, col)}</span>
                  </div>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      background: s.outlier_count > 0 ? "#f59e0b18" : "var(--green)18",
                      color: s.outlier_count > 0 ? "#f59e0b" : "var(--green)",
                    }}
                  >
                    {s.outlier_count > 0 ? ts("outlierBadge", { count: s.outlier_count }) : ts("clean")}
                  </span>
                </div>

                {/* IQR range visual */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
                    <span>{fmt(s.whisker_low, 1)}</span>
                    <span className="font-medium" style={{ color }}>{ts("iqrLabel", { iqr: fmt(s.iqr, 1) })}</span>
                    <span>{fmt(s.whisker_high, 1)}</span>
                  </div>
                  <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "var(--track-bg)" }}>
                    {/* IQR box */}
                    <motion.div
                      className="absolute top-0 h-full rounded-full"
                      style={{
                        left:  `${((s.q1 - s.min) / (s.max - s.min)) * 100}%`,
                        width: `${pct}%`,
                        background: color,
                        opacity: 0.7,
                      }}
                      initial={{ scaleX: 0, originX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                    {/* Median tick */}
                    <div
                      className="absolute top-0 h-full w-0.5 rounded"
                      style={{
                        left: `${((s.median - s.min) / (s.max - s.min)) * 100}%`,
                        background: "var(--green)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
                    <span>{ts("q1")} {fmt(s.q1, 1)}</span>
                    <span style={{ color: "var(--green)" }}>{ts("medianShort", { val: fmt(s.median, 1) })}</span>
                    <span>{ts("q3")} {fmt(s.q3, 1)}</span>
                  </div>
                </div>

                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {ts("rangeLabel", { min: fmt(s.min, 1), max: fmt(s.max, 1) })}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {totalOutliers === 0 && (
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="mt-4 rounded-card p-4 border flex items-center gap-3"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--green)40", borderLeftWidth: 3, borderLeftColor: "var(--green)" }}
          >
            <ArrowUpRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--green)" }} />
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{t("noOutliersMsg")}</p>
          </motion.div>
        )}
      </section>

      {/* ── Scatter: TV vs Sales ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: "var(--accent)" }} strokeWidth={2} />
          <h2 style={{ color: "var(--text-primary)" }}>{t("scatterTitle")}</h2>
          <Tip content={t("scatterTip")} />
        </div>
        <p className="text-xs mb-5 -mt-2" style={{ color: "var(--text-muted)" }}>{t("scatterSub")}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { xKey: "tv",    label: ts("tvBudgetM"),    corr: data.pairwise_correlations["TV|Sales"] },
            { xKey: "radio", label: ts("radioBudgetM"), corr: data.pairwise_correlations["Radio|Sales"] },
          ].map(({ xKey, label, corr }) => (
            <motion.div
              key={xKey}
              className="rounded-card p-5 border"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
              initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {ts("vsSales", { label, sales: ts("sales") })}
                </p>
                <span className="text-xs font-mono px-2 py-0.5 rounded-lg border"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--accent)" }}>
                  r = {fmt(corr ?? 0, 4)}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey={xKey} name={label} type="number"
                    tick={{ fontSize: 10 }} label={{ value: label, position: "insideBottom", offset: -2, fontSize: 10, fill: "var(--text-muted)" }}
                    height={40}
                  />
                      <YAxis
                        dataKey="sales" name={ts("salesM")} type="number"
                        tick={{ fontSize: 10 }} label={{ value: ts("salesM"), angle: -90, position: "insideLeft", offset: 14, fontSize: 10, fill: "var(--text-muted)" }}
                        width={50}
                      />
                      <Tooltip content={<ScatterTip labels={scatterLabels} />} />
                  {INF_ORDER.map(inf => (
                    <Scatter
                      key={inf}
                      name={inf}
                      data={(scatterByInf[inf] ?? []).map((pt: EDAStats["scatter_sample"][number]) => ({ ...pt }))}
                      fill={INF_COLOR[inf]}
                      fillOpacity={0.55}
                      r={3}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2">
                {INF_ORDER.map(inf => (
                  <div key={inf} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: INF_COLOR[inf] }} />
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{inf}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Sales by influencer ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4" style={{ color: "var(--accent)" }} strokeWidth={2} />
          <h2 style={{ color: "var(--text-primary)" }}>{t("infTitle")}</h2>
          <Tip content={t("infTip")} />
        </div>
        <p className="text-xs mb-5 -mt-2" style={{ color: "var(--text-muted)" }}>{t("infSub")}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mean ± Std bar chart */}
          <motion.div
            className="rounded-card p-5 border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              {ts("meanStdByTier")}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={infBoxData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}M`} width={48} />
                <Tooltip
                  formatter={(v: number, n: string) => [`${fmt(v, 2)} M`, n === "mean" ? ts("mean") : n]}
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="mean" name={ts("meanSales")} radius={[4, 4, 0, 0]} barSize={36}>
                  {INF_ORDER.map(inf => <Cell key={inf} fill={INF_COLOR[inf]} />)}
                  <ErrorBar dataKey="std" width={6} strokeWidth={2} stroke="var(--text-muted)" direction="y" />
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Box stats table */}
          <motion.div
            className="rounded-card p-5 border overflow-hidden"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              {ts("distStatsByTier")}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {boxHeaders.map(h => (
                      <th key={h} className="px-2 py-1.5 text-left font-semibold"
                        style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INF_ORDER.map((inf, ri) => {
                    const b = data.sales_by_influencer_box[inf];
                    if (!b) return null;
                    return (
                      <tr key={inf} style={{ borderBottom: ri < INF_ORDER.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: INF_COLOR[inf] }} />
                            <span className="font-medium" style={{ color: "var(--text-primary)" }}>{inf}</span>
                          </div>
                        </td>
                        {[b.min, b.q1, b.median, b.mean, b.q3, b.max].map((v, i) => (
                          <td key={i} className="px-2 py-2 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                            {fmt(v, 2)}
                          </td>
                        ))}
                        <td className="px-2 py-2 tabular-nums" style={{ color: "var(--text-muted)" }}>{b.count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Class distribution ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4" style={{ color: "var(--accent)" }} strokeWidth={2} />
          <h2 style={{ color: "var(--text-primary)" }}>{t("classTitle")}</h2>
          <Tip content={t("classTip")} />
        </div>
        <p className="text-xs mb-5 -mt-2" style={{ color: "var(--text-muted)" }}>{t("classSub")}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie chart */}
          <motion.div
            className="rounded-card p-5 border flex flex-col items-center"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={classPieData}
                  dataKey="value"
                  nameKey="label"
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90}
                  paddingAngle={3}
                  label={({ label, percent }) => `${perfClassLabel(tp, label)} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {classPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, n: string) => [v, n]}
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-1">
              {classPieData.map(({ label, fill }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: fill }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{perfClassLabel(tp, label)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Class cards */}
          <motion.div
            className="space-y-3"
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          >
            {(["High", "Medium", "Low"] as const).map(cls => {
              const count = data.class_distribution[cls] ?? 0;
              const pct   = (count / data.total_campaigns * 100).toFixed(1);
              const color = CLASS_COLOR[cls];
              const Icon  = cls === "High" ? ArrowUpRight : cls === "Low" ? ArrowDownRight : Activity;
              return (
                <motion.div key={cls} variants={item}
                  className="rounded-card p-4 border flex items-center gap-4"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: `${color}40`, borderLeftWidth: 3, borderLeftColor: color }}
                >
                  <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${color}18` }}>
                    <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {ts("performanceClass", { cls: perfClassLabel(tp, cls) })}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {t(`class${cls}Desc`)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold tabular-nums" style={{ color }}>{count.toLocaleString()}</p>
                    <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{pct}%</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Pairwise correlations ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4" style={{ color: "var(--accent)" }} strokeWidth={2} />
          <h2 style={{ color: "var(--text-primary)" }}>{t("corrTitle")}</h2>
          <Tip content={t("corrTip")} />
        </div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3"
        >
          {Object.entries(data.pairwise_correlations).map(([key, corr]) => {
            const [a, b] = key.split("|");
            const absCorr = Math.abs(corr);
            const strength = corrStrengthLabel(ts, absCorr);
            const strColor = absCorr > 0.7 ? "var(--green)" : absCorr > 0.4 ? "#f59e0b" : "var(--text-muted)";
            return (
              <motion.div key={key} variants={item}
                className="rounded-card p-4 border"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: FEAT_COLOR[a] ?? "var(--accent)" }} />
                        <span className="truncate" style={{ color: "var(--text-primary)" }}>{statFeatureLabel(tCh, ts, a)}</span>
                        <span style={{ color: "var(--text-muted)" }}>×</span>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: FEAT_COLOR[b] ?? "var(--accent)" }} />
                        <span className="truncate" style={{ color: "var(--text-primary)" }}>{statFeatureLabel(tCh, ts, b)}</span>
                  </div>
                  <span className="text-[10px] font-semibold ml-2 flex-shrink-0" style={{ color: strColor }}>{strength}</span>
                </div>
                <p className="text-xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                  {fmt(corr, 4)}
                </p>
                <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: "var(--track-bg)" }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: strColor }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${absCorr * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

    </div>
  );
}
