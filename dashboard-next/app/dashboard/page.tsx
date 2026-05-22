"use client";
import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { channelLabel } from "@/lib/i18n-helpers";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
  ScatterChart, Scatter, ComposedChart, ErrorBar,
} from "recharts";
import {
  TrendingUp, Target, DollarSign, Users, ArrowRight,
  Zap, BarChart3, Activity, ChevronRight, Lightbulb, AlertTriangle,
  BarChart2, FlaskConical, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Tip } from "@/components/Tooltip";
import Link from "next/link";
import { api, Stats, EDAStats, FeatureStat, ScatterPoint } from "@/lib/api";
import { fmt, INFLUENCER_COLORS } from "@/lib/utils";

// ── Colour palettes ───────────────────────────────────────────────────────────
const CH: Record<string, string>       = { TV: "#3b82f6", Radio: "#8b5cf6", "Social Media": "#06b6d4" };
const FEAT_COLOR: Record<string, string> = { TV: "#3b82f6", Radio: "#8b5cf6", "Social Media": "#06b6d4", Sales: "#10b981" };
const INF_COLOR: Record<string, string>  = { Mega: "#6366f1", Macro: "#8b5cf6", Micro: "#06b6d4", Nano: "#f59e0b" };
const CLASS_COLOR: Record<string, string>= { High: "#10b981", Medium: "#f59e0b", Low: "#ef4444" };
const FEATURES_ORDER = ["TV", "Radio", "Social Media", "Sales"];
const INF_ORDER      = ["Mega", "Macro", "Micro", "Nano"];

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedCounter({
  value, decimals = 0, prefix = "", suffix = "",
}: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const mv  = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18 });
  const [display, setDisplay] = useState("0");
  useEffect(() => { mv.set(value); }, [value, mv]);
  useEffect(() => spring.on("change", (v) =>
    setDisplay(`${prefix}${v.toFixed(decimals)}${suffix}`)
  ), [spring, prefix, suffix, decimals]);
  return <span className="tabular-nums">{display}</span>;
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({
  title, value, sub, icon: Icon, accent, delay = 0,
}: {
  title: string; value: number; sub: string; accent: string; delay?: number;
  icon: React.ElementType;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-card p-5 border overflow-hidden group cursor-default"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 0% 0%, ${accent}14 0%, transparent 60%)` }} />
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accent }} />
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-label">{title}</p>
          <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            <AnimatedCounter value={value} decimals={2} />
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: `${accent}1a` }}>
          <Icon className="w-5 h-5" style={{ color: accent }} strokeWidth={1.8} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 shadow-xl text-xs" style={{ borderColor: "var(--border-strong)" }}>
      <p className="mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color || "var(--accent)" }}>
          {p.name}: <span className="tabular-nums">{fmt(p.value ?? 0)}</span>
        </p>
      ))}
    </div>
  );
};

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="mb-5">
    <h2 style={{ color: "var(--text-primary)" }}>{title}</h2>
    {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
  </div>
);

// ── Chart note (explanation below each figure) ────────────────────────────────
const ChartNote = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
    <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "var(--accent)" }} strokeWidth={2} />
    <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{children}</p>
  </div>
);

// ── Action card ───────────────────────────────────────────────────────────────
function ActionCard({ href, icon: Icon, title, sub, accent }: {
  href: string; icon: React.ElementType; title: string; sub: string; accent: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        className="group relative rounded-card p-5 border cursor-pointer overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        whileHover={{ y: -2, borderColor: accent }}
        transition={{ duration: 0.2 }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 100%, ${accent}10 0%, transparent 70%)` }} />
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl flex-shrink-0" style={{ background: `${accent}18` }}>
            <Icon className="w-5 h-5" style={{ color: accent }} strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{title}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{sub}</p>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: accent }} />
        </div>
      </motion.div>
    </Link>
  );
}

// ── Histogram panel (EDA) ─────────────────────────────────────────────────────
function HistPanel({ col, bins, stat, color, note }: {
  col: string;
  bins: { bin_start: number; bin_end: number; count: number; midpoint: number }[];
  stat: FeatureStat;
  color: string;
  note: string;
}) {
  const skewLabel = (sk: number) =>
    Math.abs(sk) < 0.5 ? "Symmetric" : sk > 0 ? "Right-skewed" : "Left-skewed";

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
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{col}</p>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{ background: `${color}18`, color }}>
          {skewLabel(stat.skewness)}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={bins} barGap={0} barCategoryGap={1}>
          <XAxis dataKey="midpoint" hide />
          <YAxis hide />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const b = payload[0].payload as typeof bins[0];
              return (
                <div className="glass rounded-xl px-3 py-2 text-xs shadow-xl" style={{ borderColor: "var(--border-strong)" }}>
                  <p style={{ color: "var(--text-muted)" }}>{fmt(b.bin_start, 1)} – {fmt(b.bin_end, 1)}</p>
                  <p className="font-semibold tabular-nums" style={{ color: "var(--accent)" }}>{b.count} campaigns</p>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {bins.map((b, i) => {
              const isOut = b.midpoint < stat.whisker_low || b.midpoint > stat.whisker_high;
              return <Cell key={i} fill={isOut ? "#ef4444" : color} fillOpacity={isOut ? 0.85 : 0.65} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { label: "Mean",   val: fmt(stat.mean,   2) },
          { label: "Median", val: fmt(stat.median, 2) },
          { label: "Std",    val: `±${fmt(stat.std, 2)}` },
        ].map(({ label, val }) => (
          <div key={label} className="text-center">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{val}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-2">
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          IQR: {fmt(stat.iqr, 1)} · Skew: {fmt(stat.skewness, 2)}
        </span>
        {stat.outlier_count > 0 && (
          <span className="text-[10px] font-medium" style={{ color: "#f59e0b" }}>
            {stat.outlier_count} outliers ({fmt(stat.outlier_pct, 1)}%)
          </span>
        )}
      </div>

      <ChartNote>{note}</ChartNote>
    </motion.div>
  );
}

// ── Scatter tooltip ───────────────────────────────────────────────────────────
function ScatterTip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload?: ScatterPoint; color?: string }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs shadow-xl" style={{ borderColor: "var(--border-strong)" }}>
      <p className="font-semibold mb-0.5" style={{ color: payload[0].color || "var(--accent)" }}>{d.influencer}</p>
      <p style={{ color: "var(--text-muted)" }}>Sales: <span className="tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>{fmt(d.sales, 2)} M</span></p>
      <p style={{ color: "var(--text-muted)" }}>TV: <span className="tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>{fmt(d.tv, 1)} M</span></p>
      <p style={{ color: "var(--text-muted)" }}>Radio: <span className="tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>{fmt(d.radio, 1)} M</span></p>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────
function groupByInf(pts: ScatterPoint[]) {
  const m: Record<string, ScatterPoint[]> = {};
  for (const pt of pts) (m[pt.influencer] ??= []).push(pt);
  return m;
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function OverviewPage() {
  const t  = useTranslations("overview");
  const tc = useTranslations("common");
  const tCh = useTranslations("channels");

  const [stats, setStats] = useState<Stats | null>(null);
  const [eda, setEda]     = useState<EDAStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.stats().then(setStats).catch(() => setError(true));
    api.analytics().then(setEda).catch(() => {});
  }, []);

  // Scatter: filter out zero-budget campaigns (no channel spend = irrelevant for that axis)
  const tvScatterGroups = useMemo(() =>
    groupByInf((eda?.scatter_sample ?? []).filter(pt => pt.tv > 0)),
  [eda]);
  const radioScatterGroups = useMemo(() =>
    groupByInf((eda?.scatter_sample ?? []).filter(pt => pt.radio > 0)),
  [eda]);

  const classPieData = useMemo(() => {
    if (!eda) return [];
    return Object.entries(eda.class_distribution).map(([label, value]) => ({
      label, value, fill: CLASS_COLOR[label] ?? "#6b7280",
    }));
  }, [eda]);

  // ─ Error state ─
  if (error) return (
    <div className="flex items-center justify-center h-72">
      <div className="text-center space-y-3">
        <Activity className="w-10 h-10 mx-auto opacity-20" style={{ color: "var(--text-muted)" }} />
        <p style={{ color: "var(--text-muted)" }} className="text-sm">{tc("apiError")}</p>
        <code className="block text-xs px-3 py-2 rounded-lg"
          style={{ color: "var(--accent)", backgroundColor: "var(--bg-card)" }}>
          {tc("apiCommand")}
        </code>
      </div>
    </div>
  );

  // ─ Skeleton ─
  if (!stats) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-72 rounded-lg animate-shimmer" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-card animate-shimmer" />)}
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-72 rounded-card animate-shimmer" />)}
      </div>
    </div>
  );

  // ─ Derived data ─
  const budgetData     = Object.entries(stats.budget_breakdown).map(([name, value]) => ({ name, value }));
  const influencerData = Object.entries(stats.sales_by_influencer).map(([name, value]) => ({ name, value }));
  const correlData     = Object.entries(stats.correlations).map(([name, value]) => ({ name, value }));
  const totalBudget    = Object.values(stats.budget_breakdown).reduce((a, b) => a + b, 0);
  const efficiencyData = correlData.map(({ name, value }) => ({
    name, efficiency: stats.avg_sales * value,
    color: CH[name as keyof typeof CH] ?? "#3b82f6",
  }));

  const tvCorr     = fmt(stats.correlations["TV"]           ?? 0, 3);
  const radioCorr  = fmt(stats.correlations["Radio"]        ?? 0, 3);
  const smCorr     = fmt(stats.correlations["Social Media"] ?? 0, 3);
  const tvBudgetPct = totalBudget > 0
    ? Math.round((stats.budget_breakdown["TV"] ?? 0) / totalBudget * 100)
    : 0;

  return (
    <div className="space-y-10">

      {/* ── Hero header ── */}
      <motion.div
        className="relative bg-gradient-hero pt-2 pb-1"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--accent)" }}>
          {t("eyebrow")}
        </p>
        <h1 style={{ color: "var(--text-primary)" }}>{t("title")}</h1>
        <p className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>
          {t("subtitle", { count: stats.total_campaigns.toLocaleString() })}
        </p>
      </motion.div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title={t("kpiCampaigns")}  value={stats.total_campaigns}                              sub={t("kpiCampaignsSub")}                                        icon={Target}    accent="#3b82f6" delay={0.05} />
        <KpiCard title={t("kpiAvgRevenue")} value={stats.avg_sales}                                    sub={t("kpiAvgRevenueSub", { q66: fmt(stats.sales_q66 ?? 0) })}  icon={TrendingUp} accent="#8b5cf6" delay={0.1}  />
        <KpiCard title={t("kpiRoi")}        value={stats.avg_roi}                                      sub={t("kpiRoiSub")}                                              icon={DollarSign} accent="#10b981" delay={0.15} />
        <KpiCard title={t("kpiBudget")}     value={stats.avg_total_budget ?? totalBudget}              sub={t("kpiBudgetSub")}                                           icon={Users}      accent="#f59e0b" delay={0.2}  />
      </div>

      {/* ── Charts row 1: Revenue distribution + Budget donut ── */}
      <div className="grid grid-cols-3 gap-6">

        {/* Sales distribution */}
        <motion.div
          className="col-span-2 rounded-card p-6 border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionHeader title={t("salesDistribution")} sub={t("salesDistributionSub")} />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.sales_distribution} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 9 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="count" name={tc("campaigns")}
                stroke="#3b82f6" strokeWidth={2} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          <ChartNote>
            Revenue is spread broadly across the $0–$360M range with no heavy clustering,
            indicating that the model was trained on campaigns spanning the full spectrum of marketing investment.
            The slight peaks at both ends reflect low-budget Nano campaigns and high-spend Mega campaigns,
            while the middle bands represent the majority of the training distribution.
          </ChartNote>
        </motion.div>

        {/* Budget donut */}
        <motion.div
          className="rounded-card p-6 border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionHeader title={t("budgetMix")} sub={t("budgetMixSub")} />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={budgetData} dataKey="value" nameKey="name"
                cx="50%" cy="44%" innerRadius={52} outerRadius={78} paddingAngle={4}>
                {budgetData.map((e) => (
                  <Cell key={e.name} fill={CH[e.name as keyof typeof CH] ?? "#3b82f6"} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${fmt(v)}M`, tc("budget")]}
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 10 }}
                labelStyle={{ color: "var(--text-muted)" }} />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{channelLabel(tCh, String(v))}</span>} />
            </PieChart>
          </ResponsiveContainer>
          <ChartNote>
            TV represents ~{tvBudgetPct}% of the average total budget, confirming it as
            the dominant channel by spend. Radio and Social Media each absorb a smaller share.
            Since TV also shows the highest correlation with revenue (r = {tvCorr}), this allocation
            is well-optimised for revenue generation.
          </ChartNote>
        </motion.div>
      </div>

      {/* ── Charts row 2: Influencer + Correlation + Efficiency ── */}
      <div className="grid grid-cols-3 gap-6">

        {/* Influencer performance */}
        <motion.div
          className="rounded-card p-6 border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionHeader title={t("revenueByInfluencer")} sub={t("revenueByInfluencerSub")} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={influencerData} layout="vertical" barSize={18}
              margin={{ left: 4, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={44} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="value" name={t("avgRevenueM")} radius={[0, 5, 5, 0]}>
                {influencerData.map((e) => (
                  <Cell key={e.name} fill={INFLUENCER_COLORS[e.name] ?? "#3b82f6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <ChartNote>
            Mega influencer campaigns generate the highest mean revenue, but this partly reflects that
            Mega campaigns also tend to have larger overall budgets — not just the influencer tier itself.
            Influencer tier is a low-importance feature in the model; budget magnitude (especially TV) is
            far more predictive of raw revenue.
          </ChartNote>
        </motion.div>

        {/* Channel correlation */}
        <motion.div
          className="rounded-card p-6 border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-start gap-1 mb-5">
            <div>
              <h2 style={{ color: "var(--text-primary)" }}>{t("correlation")}</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{t("correlationSub")}</p>
            </div>
            <Tip content={t("correlationTip")} />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={correlData} barSize={40} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="value" name={t("correlation")} radius={[5, 5, 0, 0]}>
                {correlData.map((e) => (
                  <Cell key={e.name} fill={CH[e.name as keyof typeof CH] ?? "#3b82f6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <ChartNote>
            TV shows near-perfect linear correlation with revenue (r = {tvCorr}) — every dollar of TV spend
            maps almost directly to a predictable revenue lift. Radio is a strong secondary driver (r = {radioCorr}).
            Social Media has the weakest link (r = {smCorr}): at current spend levels, additional Social budget
            yields diminishing returns compared to an equivalent TV increase.
          </ChartNote>
        </motion.div>

        {/* Revenue efficiency */}
        <motion.div
          className="rounded-card p-6 border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-start gap-1 mb-5">
            <div>
              <h2 style={{ color: "var(--text-primary)" }}>{t("efficiency")}</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{t("efficiencySub")}</p>
            </div>
            <Tip content={t("efficiencyTip")} />
          </div>
          <div className="space-y-5 mt-2">
            {efficiencyData.map(({ name, efficiency, color }) => {
              const max = Math.max(...efficiencyData.map(d => d.efficiency));
              const pct = (efficiency / max) * 100;
              return (
                <div key={name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>{channelLabel(tCh, name)}</span>
                    <span className="font-mono font-semibold" style={{ color }}>{fmt(efficiency, 1)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--track-bg)" }}>
                    <motion.div className="h-full rounded-full" style={{ background: color }}
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("efficiencyIndex")}</p>
                </div>
              );
            })}
          </div>
          <ChartNote>
            The efficiency index weights each channel&apos;s average spend by its Pearson correlation with revenue.
            TV&apos;s dominant score means redirecting even a small fraction of Social Media budget toward TV
            typically generates a net positive return — use this as a reallocation guide.
          </ChartNote>
        </motion.div>
      </div>

      {/* ── Revenue performance benchmarks ── */}
      <motion.div
        className="rounded-card p-6 border"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-start gap-1 mb-5">
          <div>
            <h2 style={{ color: "var(--text-primary)" }}>{t("benchmarks")}</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{t("benchmarksSub")}</p>
          </div>
          <Tip content={t("benchmarksTip")} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { tier: t("tierHigh"),   threshold: `> ${fmt(stats.sales_q66 ?? 0, 1)}M`,                                         desc: t("tierHighDesc"),   color: "var(--green)",  bgColor: "var(--green-dim)"  },
            { tier: t("tierMedium"), threshold: `${fmt(stats.sales_q33 ?? 0, 1)}M – ${fmt(stats.sales_q66 ?? 0, 1)}M`,         desc: t("tierMediumDesc"), color: "var(--orange)", bgColor: "var(--orange-dim)" },
            { tier: t("tierLow"),    threshold: `< ${fmt(stats.sales_q33 ?? 0, 1)}M`,                                          desc: t("tierLowDesc"),    color: "var(--red)",    bgColor: "var(--red-dim)"    },
          ].map(({ tier, threshold, desc, color, bgColor }) => (
            <div key={tier} className="rounded-xl p-4 border" style={{ background: bgColor, borderColor: color + "33" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color }}>{tier}</p>
              <p className="text-lg font-bold font-mono mb-2" style={{ color: "var(--text-primary)" }}>{threshold}</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════
          EDA SECTION DIVIDER
      ══════════════════════════════════════════════════════════ */}
      {eda && (
        <>
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg" style={{ background: "var(--accent-dim)" }}>
                <FlaskConical className="w-4 h-4" style={{ color: "var(--accent)" }} strokeWidth={2} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                  Exploratory Data Analysis
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Statistical distributions, outlier detection &amp; channel scatter analysis
                </p>
              </div>
            </div>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </motion.div>

          {/* ── Feature distributions ── */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="w-4 h-4" style={{ color: "var(--accent)" }} strokeWidth={2} />
              <h2 style={{ color: "var(--text-primary)" }}>Feature Distributions</h2>
              <Tip content="25-bin histograms for each numeric feature. Red bars mark the outlier region (outside 1.5×IQR). Blue dashed = mean · green dashed = median. A symmetric shape means values are evenly spread; skewed shapes indicate a tail." />
            </div>
            <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
              25-bin histograms across 4,572 campaigns · red = outlier zone · skewness and IQR shown per feature
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <HistPanel col="TV"           bins={eda.histograms["TV"] ?? []}           stat={eda.feature_stats["TV"]!}           color={FEAT_COLOR.TV}
                note={`TV budget spans $0–$${fmt(eda.feature_stats["TV"]?.max ?? 0, 0)}M with a near-uniform distribution (skew ≈ ${fmt(eda.feature_stats["TV"]?.skewness ?? 0, 2)}). No significant outliers detected — campaigns are well-distributed across all budget levels, making TV the most stable predictor.`}
              />
              <HistPanel col="Radio"        bins={eda.histograms["Radio"] ?? []}        stat={eda.feature_stats["Radio"]!}        color={FEAT_COLOR.Radio}
                note={`Radio budget is also broadly distributed (mean $${fmt(eda.feature_stats["Radio"]?.mean ?? 0, 1)}M, std ±${fmt(eda.feature_stats["Radio"]?.std ?? 0, 1)}M). Its near-symmetric shape means the model sees balanced low-and-high Radio investment, supporting reliable correlation estimates with revenue.`}
              />
              <HistPanel col="Social Media" bins={eda.histograms["Social Media"] ?? []} stat={eda.feature_stats["Social Media"]!} color={FEAT_COLOR["Social Media"]}
                note={`Social Media budget is compressed into a narrow range ($0–$50M), giving it less variance than TV or Radio. This limited spread partly explains Social Media's weaker correlation with revenue — the model has less signal to learn from at higher spend levels.`}
              />
              <HistPanel col="Sales"        bins={eda.histograms["Sales"] ?? []}        stat={eda.feature_stats["Sales"]!}        color={FEAT_COLOR.Sales}
                note={`Revenue follows a broad, roughly uniform distribution from $${fmt(eda.feature_stats["Sales"]?.min ?? 0, 0)}M to $${fmt(eda.feature_stats["Sales"]?.max ?? 0, 0)}M. The balanced spread across the full range is ideal for regression — the model is exposed to all revenue levels rather than being biased toward a narrow band.`}
              />
            </div>
          </section>

          {/* ── Statistical summary table ── */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4" style={{ color: "var(--accent)" }} strokeWidth={2} />
              <h2 style={{ color: "var(--text-primary)" }}>Statistical Summary</h2>
              <Tip content="IQR = Q3 − Q1, the spread of the middle 50% of data. Skewness > 1 or < −1 = non-symmetric distribution. Outliers use the IQR fence: values outside [Q1 − 1.5×IQR, Q3 + 1.5×IQR]." />
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
                      {["Feature", "Mean", "Median", "Std", "Min", "Q1", "Q3", "Max", "IQR", "Skew", "Outliers"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-semibold whitespace-nowrap"
                          style={{ color: "var(--text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURES_ORDER.map((col, ri) => {
                      const s = eda.feature_stats[col];
                      if (!s) return null;
                      return (
                        <tr key={col} style={{ borderBottom: ri < FEATURES_ORDER.length - 1 ? "1px solid var(--border)" : "none" }}>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: FEAT_COLOR[col] }} />
                              <span className="font-medium" style={{ color: "var(--text-primary)" }}>{col}</span>
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
              <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
                <ChartNote>
                  All four features show near-zero skewness and zero IQR outliers, confirming a clean, well-bounded dataset.
                  The IQR (Q3 − Q1) measures the central 50% spread — TV has the widest IQR ({fmt(eda.feature_stats["TV"]?.iqr ?? 0, 1)}M),
                  reflecting the broadest range of investment. Sales IQR ({fmt(eda.feature_stats["Sales"]?.iqr ?? 0, 1)}M) confirms
                  that revenue is also widely distributed, giving the model a full range of outcomes to learn from.
                </ChartNote>
              </div>
            </motion.div>
          </section>

          {/* ── Outlier detection (IQR cards) ── */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" strokeWidth={2} />
              <h2 style={{ color: "var(--text-primary)" }}>Outlier Detection — IQR Method</h2>
              <Tip content="IQR method: a value is an outlier if it falls below Q1 − 1.5×IQR or above Q3 + 1.5×IQR. The coloured band shows the middle 50% of data (IQR box). The green tick marks the median." />
            </div>
            <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
              Fences: Q1 − 1.5×IQR and Q3 + 1.5×IQR · coloured band = middle 50% · green tick = median
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURES_ORDER.map(col => {
                const s = eda.feature_stats[col];
                if (!s) return null;
                const color = FEAT_COLOR[col];
                const span  = s.max - s.min || 1;
                const boxLeft  = ((s.q1 - s.min) / span) * 100;
                const boxWidth = (s.iqr / span) * 100;
                const medPct   = ((s.median - s.min) / span) * 100;

                return (
                  <motion.div key={col}
                    className="rounded-card p-5 border"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: s.outlier_count > 0 ? "#f59e0b50" : "var(--border)",
                      borderLeftWidth: 3,
                      borderLeftColor: s.outlier_count > 0 ? "#f59e0b" : "var(--green)",
                    }}
                    initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{col}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                        style={{
                          background: s.outlier_count > 0 ? "#f59e0b18" : "rgba(16,185,129,0.12)",
                          color: s.outlier_count > 0 ? "#f59e0b" : "var(--green)",
                        }}>
                        {s.outlier_count > 0 ? `${s.outlier_count} outliers` : "Clean"}
                      </span>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
                        <span>{fmt(s.whisker_low, 1)}</span>
                        <span className="font-medium" style={{ color }}>IQR {fmt(s.iqr, 1)}</span>
                        <span>{fmt(s.whisker_high, 1)}</span>
                      </div>
                      <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "var(--track-bg)" }}>
                        <motion.div
                          className="absolute top-0 h-full rounded-full"
                          style={{ left: `${boxLeft}%`, width: `${boxWidth}%`, background: color, opacity: 0.7 }}
                          initial={{ scaleX: 0, originX: 0 }}
                          whileInView={{ scaleX: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        />
                        <div className="absolute top-0 h-full w-0.5" style={{ left: `${medPct}%`, background: "var(--green)" }} />
                      </div>
                      <div className="flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
                        <span>Q1 {fmt(s.q1, 1)}</span>
                        <span style={{ color: "var(--green)" }}>M {fmt(s.median, 1)}</span>
                        <span>Q3 {fmt(s.q3, 1)}</span>
                      </div>
                    </div>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      Range: {fmt(s.min, 1)} – {fmt(s.max, 1)} · σ = {fmt(s.std, 2)}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {Object.values(eda.feature_stats).every(s => s.outlier_count === 0) && (
              <motion.div
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="mt-4 rounded-card p-4 border flex items-center gap-3"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(16,185,129,0.3)", borderLeftWidth: 3, borderLeftColor: "var(--green)" }}
              >
                <ArrowUpRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--green)" }} />
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  No outliers detected in any feature using the IQR method. The dataset is clean and well-bounded
                  across all channels — no campaign had an anomalously high or low budget for any channel relative
                  to its peers. This means the model was not influenced by extreme data points during training.
                </p>
              </motion.div>
            )}
          </section>

          {/* ── Scatter plots ── */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" style={{ color: "var(--accent)" }} strokeWidth={2} />
              <h2 style={{ color: "var(--text-primary)" }}>Channel vs Revenue Scatter</h2>
              <Tip content="Each dot is one campaign (500 sampled), coloured by influencer tier. Zero-budget campaigns are excluded since they carry no signal for that channel's spend-revenue relationship. Pearson r in the top-right quantifies the linear correlation strength." />
            </div>
            <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
              500 sampled campaigns · zero-budget rows excluded · coloured by influencer tier · Pearson r shown
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { xKey: "tv"    as const, label: "TV Budget (M)",    groups: tvScatterGroups,    corr: eda.pairwise_correlations["TV|Sales"],
                  note: `The TV-vs-Revenue scatter forms a nearly perfect straight line (r = ${fmt(eda.pairwise_correlations["TV|Sales"] ?? 0, 4)}), confirming that TV spend is almost deterministically linked to campaign revenue. All four influencer tiers overlap closely, showing that TV spend dominates over tier choice for revenue prediction.` },
                { xKey: "radio" as const, label: "Radio Budget (M)", groups: radioScatterGroups, corr: eda.pairwise_correlations["Radio|Sales"],
                  note: `Radio shows a strong positive relationship with revenue (r = ${fmt(eda.pairwise_correlations["Radio|Sales"] ?? 0, 4)}), but with considerably more scatter than TV — indicating that Radio spend alone is less sufficient to predict revenue. The fan-shaped spread suggests Radio's effect is amplified when combined with TV investment.` },
              ].map(({ xKey, label, groups, corr, note }) => (
                <motion.div
                  key={xKey}
                  className="rounded-card p-5 border"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
                  initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {label} vs Sales
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
                        tick={{ fontSize: 10 }}
                        label={{ value: label, position: "insideBottom", offset: -2, fontSize: 10, fill: "var(--text-muted)" }}
                        height={40}
                      />
                      <YAxis
                        dataKey="sales" name="Sales (M)" type="number"
                        tick={{ fontSize: 10 }}
                        label={{ value: "Sales (M)", angle: -90, position: "insideLeft", offset: 14, fontSize: 10, fill: "var(--text-muted)" }}
                        width={50}
                      />
                      <Tooltip content={<ScatterTip />} />
                      {INF_ORDER.map(inf => (
                        <Scatter
                          key={inf}
                          name={inf}
                          data={groups[inf] ?? []}
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
                  <ChartNote>{note}</ChartNote>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── Class distribution ── */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" style={{ color: "var(--accent)" }} strokeWidth={2} />
              <h2 style={{ color: "var(--text-primary)" }}>Performance Class Distribution</h2>
              <Tip content="Campaigns are split into three equal thirds (quantile-based): top 33% = High, middle 33% = Medium, bottom 33% = Low performance. The perfectly balanced split ensures classifiers are not biased toward any class during training." />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                className="rounded-card p-5 border flex flex-col items-center"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={classPieData} dataKey="value" nameKey="label"
                      cx="50%" cy="50%" innerRadius={55} outerRadius={88} paddingAngle={3}
                      label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {classPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
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
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
                    </div>
                  ))}
                </div>
                <ChartNote>
                  The three performance classes are exactly balanced by design — each contains ~{Math.round(stats.total_campaigns / 3)} campaigns (~33%).
                  This intentional balance ensures the classification models are trained without class-imbalance bias,
                  giving equal predictive weight to High, Medium, and Low campaign outcomes.
                </ChartNote>
              </motion.div>

              <div className="space-y-3">
                {(["High", "Medium", "Low"] as const).map(cls => {
                  const count = eda.class_distribution[cls] ?? 0;
                  const pct   = (count / stats.total_campaigns * 100).toFixed(1);
                  const color = CLASS_COLOR[cls];
                  const Icon  = cls === "High" ? ArrowUpRight : cls === "Low" ? ArrowDownRight : Activity;
                  const descs: Record<string, string> = {
                    High:   `Top 33% revenue (> ${fmt(stats.sales_q66 ?? 0, 1)}M) · Strong channel investment across TV and Radio`,
                    Medium: `Middle 33% (${fmt(stats.sales_q33 ?? 0, 1)}M – ${fmt(stats.sales_q66 ?? 0, 1)}M) · Solid results with room to optimise channel mix`,
                    Low:    `Bottom 33% (< ${fmt(stats.sales_q33 ?? 0, 1)}M) · Underspend or misaligned channel weighting detected`,
                  };
                  return (
                    <motion.div key={cls}
                      className="rounded-card p-4 border flex items-center gap-4"
                      style={{ backgroundColor: "var(--bg-card)", borderColor: `${color}40`, borderLeftWidth: 3, borderLeftColor: color }}
                      initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${color}18` }}>
                        <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{cls} Performance</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{descs[cls]}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold tabular-nums" style={{ color }}>{count.toLocaleString()}</p>
                        <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{pct}%</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Pairwise correlations ── */}
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-4 h-4" style={{ color: "var(--accent)" }} strokeWidth={2} />
              <h2 style={{ color: "var(--text-primary)" }}>Pairwise Feature Correlations</h2>
              <Tip content="Pearson r between every pair of numeric features. Budget channels (TV, Radio, Social Media) show near-zero correlation with each other — no multicollinearity — meaning each channel contributes independent signal to the model. High channel-to-sales correlations confirm strong linear predictability." />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(eda.pairwise_correlations).map(([key, corr]) => {
                const [a, b] = key.split("|");
                const absCorr = Math.abs(corr);
                const strength = absCorr > 0.7 ? "Strong" : absCorr > 0.4 ? "Moderate" : "Weak";
                const strColor = absCorr > 0.7 ? "var(--green)" : absCorr > 0.4 ? "#f59e0b" : "var(--text-muted)";
                return (
                  <motion.div key={key}
                    className="rounded-card p-4 border"
                    style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
                    initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: FEAT_COLOR[a] ?? "var(--accent)" }} />
                        <span className="truncate" style={{ color: "var(--text-primary)" }}>{a}</span>
                        <span style={{ color: "var(--text-muted)" }}>×</span>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: FEAT_COLOR[b] ?? "var(--accent)" }} />
                        <span className="truncate" style={{ color: "var(--text-primary)" }}>{b}</span>
                      </div>
                      <span className="text-[10px] font-semibold ml-2 flex-shrink-0" style={{ color: strColor }}>{strength}</span>
                    </div>
                    <p className="text-xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>{fmt(corr, 4)}</p>
                    <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: "var(--track-bg)" }}>
                      <motion.div className="h-full rounded-full" style={{ background: strColor }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${absCorr * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-4">
              <ChartNote>
                Budget channels (TV, Radio, Social Media) are nearly uncorrelated with each other (r ≈ 0),
                confirming no multicollinearity — each channel contributes independent, non-redundant signal
                to the regression model. TV × Sales and Radio × Sales show the strongest linear links,
                directly validating why these two channels dominate feature importance.
              </ChartNote>
            </div>
          </section>
        </>
      )}

      {/* ── Quick actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <SectionHeader title={t("explore")} sub={t("exploreSub")} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard href="/predict"        icon={Zap}       accent="#3b82f6" title={t("actionForecast")}  sub={t("actionForecastSub")} />
          <ActionCard href="/simulator"      icon={TrendingUp} accent="#8b5cf6" title={t("actionOptimizer")} sub={t("actionOptimizerSub")} />
          <ActionCard href="/target-planner" icon={Target}     accent="#10b981" title={t("actionPlanner")}   sub={t("actionPlannerSub")} />
          <ActionCard href="/models"         icon={BarChart3}  accent="#f59e0b" title={t("actionModels")}    sub={t("actionModelsSub")} />
        </div>
      </motion.div>
    </div>
  );
}
