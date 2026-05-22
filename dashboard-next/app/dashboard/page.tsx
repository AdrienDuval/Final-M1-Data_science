"use client";
import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { channelLabel } from "@/lib/i18n-helpers";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import {
  TrendingUp, Target, DollarSign, Users, ArrowRight,
  Zap, BarChart3, Activity, ChevronRight,
} from "lucide-react";
import { Tip } from "@/components/Tooltip";
import Link from "next/link";
import { api, Stats } from "@/lib/api";
import { fmt, INFLUENCER_COLORS } from "@/lib/utils";

/* ─ Channel colours ─ */
const CH = { TV: "#3b82f6", Radio: "#8b5cf6", "Social Media": "#06b6d4" };

/* ─ Animated counter using Framer Motion spring ─ */
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

/* ─ KPI card ─ */
function KpiCard({
  title, value, sub, icon: Icon, accent, delay = 0,
}: {
  title: string; value: number; sub: string; accent: string; delay?: number;
  icon: React.ElementType;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-card p-5 border overflow-hidden group cursor-default"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 0% 0%, ${accent}14 0%, transparent 60%)` }} />

      {/* Top accent bar */}
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

/* ─ Chart tooltip ─ */
const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 shadow-xl text-xs"
      style={{ borderColor: "var(--border-strong)" }}>
      <p className="mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color || "var(--accent)" }}>
          {p.name}: <span className="tabular-nums">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

/* ─ Section header ─ */
const SectionHeader = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="mb-5">
    <h2 style={{ color: "var(--text-primary)" }}>{title}</h2>
    {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
  </div>
);

/* ─ Quick action card ─ */
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

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function OverviewPage() {
  const t = useTranslations("overview");
  const tc = useTranslations("common");
  const tCh = useTranslations("channels");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.stats().then(setStats).catch(() => setError(true));
  }, []);

  /* ─ Error state ─ */
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

  /* ─ Skeleton ─ */
  if (!stats) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-72 rounded-lg animate-shimmer" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-card animate-shimmer" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-72 rounded-card animate-shimmer" />
        ))}
      </div>
    </div>
  );

  /* ─ Data ─ */
  const budgetData    = Object.entries(stats.budget_breakdown).map(([name, value]) => ({ name, value }));
  const influencerData = Object.entries(stats.sales_by_influencer).map(([name, value]) => ({ name, value }));
  const roiByInf      = Object.entries(stats.roi_by_influencer ?? {}).map(([name, value]) => ({ name, value }));
  const correlData    = Object.entries(stats.correlations).map(([name, value]) => ({ name, value }));
  const totalBudget   = Object.values(stats.budget_breakdown).reduce((a, b) => a + b, 0);

  /* Revenue per $M spent by channel */
  const efficiencyData = correlData.map(({ name, value }) => ({
    name,
    efficiency: stats.avg_sales * value,
    color: CH[name as keyof typeof CH] ?? "#3b82f6",
  }));

  return (
    <div className="space-y-10">

      {/* ── Hero header ── */}
      <motion.div
        className="relative bg-gradient-hero pt-2 pb-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: "var(--accent)" }}>
          {t("eyebrow")}
        </p>
        <h1 style={{ color: "var(--text-primary)" }}>
          {t("title")}
        </h1>
        <p className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>
          {t("subtitle", { count: stats.total_campaigns.toLocaleString() })}
        </p>
      </motion.div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title={t("kpiCampaigns")} value={stats.total_campaigns} sub={t("kpiCampaignsSub")} icon={Target} accent="#3b82f6" delay={0.05} />
        <KpiCard title={t("kpiAvgRevenue")} value={stats.avg_sales} sub={t("kpiAvgRevenueSub", { q66: fmt(stats.sales_q66 ?? 0) })} icon={TrendingUp} accent="#8b5cf6" delay={0.1} />
        <KpiCard title={t("kpiRoi")} value={stats.avg_roi} sub={t("kpiRoiSub")} icon={DollarSign} accent="#10b981" delay={0.15} />
        <KpiCard title={t("kpiBudget")} value={stats.avg_total_budget ?? totalBudget} sub={t("kpiBudgetSub")} icon={Users} accent="#f59e0b" delay={0.2} />
      </div>

      {/* ── Charts row 1 ── */}
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
        </motion.div>
      </div>

      {/* ── Charts row 2 ── */}
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
                  <div className="h-2 rounded-full overflow-hidden"
                    style={{ background: "var(--track-bg)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t("efficiencyIndex")}
                  </p>
                </div>
              );
            })}
          </div>
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
            {
              tier: t("tierHigh"),
              threshold: `> ${fmt(stats.sales_q66 ?? 0, 1)}M`,
              desc: t("tierHighDesc"),
              color: "var(--green)",
              bgColor: "var(--green-dim)",
            },
            {
              tier: t("tierMedium"),
              threshold: `${fmt(stats.sales_q33 ?? 0, 1)}M – ${fmt(stats.sales_q66 ?? 0, 1)}M`,
              desc: t("tierMediumDesc"),
              color: "var(--orange)",
              bgColor: "var(--orange-dim)",
            },
            {
              tier: t("tierLow"),
              threshold: `< ${fmt(stats.sales_q33 ?? 0, 1)}M`,
              desc: t("tierLowDesc"),
              color: "var(--red)",
              bgColor: "var(--red-dim)",
            },
          ].map(({ tier, threshold, desc, color, bgColor }) => (
            <div key={tier} className="rounded-xl p-4 border"
              style={{ background: bgColor, borderColor: color + "33" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color }}>
                {tier}
              </p>
              <p className="text-lg font-bold font-mono mb-2" style={{ color: "var(--text-primary)" }}>
                {threshold}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Quick actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <SectionHeader title={t("explore")} sub={t("exploreSub")} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard href="/predict"        icon={Zap}          accent="#3b82f6"
            title={t("actionForecast")}   sub={t("actionForecastSub")} />
          <ActionCard href="/simulator"      icon={TrendingUp}   accent="#8b5cf6"
            title={t("actionOptimizer")}   sub={t("actionOptimizerSub")} />
          <ActionCard href="/target-planner" icon={Target}       accent="#10b981"
            title={t("actionPlanner")}     sub={t("actionPlannerSub")} />
          <ActionCard href="/models"         icon={BarChart3}    accent="#f59e0b"
            title={t("actionModels")}          sub={t("actionModelsSub")} />
        </div>
      </motion.div>
    </div>
  );
}
