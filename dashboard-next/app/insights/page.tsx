"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, Eye, Brain, AlertTriangle, Zap } from "lucide-react";
import { Tip } from "@/components/Tooltip";
import { api, FeatureImportance, Stats } from "@/lib/api";
import { fmt } from "@/lib/utils";
import { channelLabel, featureLabel, modelLabel } from "@/lib/i18n-helpers";

const CH_COLOR: Record<string, string> = {
  TV:             "#3b82f6",
  Radio:          "#8b5cf6",
  "Social Media": "#06b6d4",
};

const INFLUENCER_COLORS: Record<string, string> = {
  Mega: "#6366f1", Macro: "#8b5cf6", Micro: "#06b6d4", Nano: "#f59e0b",
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export default function InsightsPage() {
  const tIns = useTranslations("insights");
  const tFeat = useTranslations("featureImportance.features");
  const tfi = useTranslations("featureImportance");
  const tc = useTranslations("common");
  const tm = useTranslations("modelNames");
  const tCh = useTranslations("channels");

  const [fi, setFi]       = useState<FeatureImportance | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([api.featureImportance(), api.stats()])
      .then(([f, s]) => { setFi(f); setStats(s); })
      .catch(() => setError(true));
  }, []);

  function ChartTip({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name?: string; value?: unknown; color?: string }>;
    label?: string;
  }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass rounded-xl px-3 py-2 shadow-xl text-xs" style={{ borderColor: "var(--border-strong)" }}>
        <p className="mb-1" style={{ color: "var(--text-muted)" }}>
          {label ? featureLabel(tFeat as (k: string) => string, label) : label}
        </p>
        {payload.map((p) => (
          <p key={String(p.name)} className="font-semibold tabular-nums" style={{ color: p.color || "var(--accent)" }}>
            {tfi("importanceValue", { value: fmt(p.value as number, 4) })}
          </p>
        ))}
      </div>
    );
  }

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p style={{ color: "var(--text-muted)" }} className="text-sm">
        {tc("apiUnavailable")}
      </p>
    </div>
  );

  if (!fi || !stats) return (
    <div className="space-y-6">
      {[...Array(5)].map((_, i) => <div key={i} className="h-28 rounded-card animate-shimmer" />)}
    </div>
  );

  const topFeature      = fi.features[0];
  const chartData       = fi.features.map(f => ({ name: f.feature, importance: f.importance }));
  const correlations    = Object.entries(stats.correlations).sort((a, b) => b[1] - a[1]);
  const roiByInfluencer = Object.entries(stats.roi_by_influencer ?? {});

  const modelDisplay = modelLabel(tm as (k: string) => string, fi.model);
  const corrForTop = stats.correlations[topFeature?.feature ?? ""] ?? 0;

  const insightBlocks = [
    {
      icon: TrendingUp, color: "var(--accent)",
      titleKey: "insightTvTitle" as const,
      descKey: "insightTvDesc" as const,
      vars: { r: fmt(stats.correlations["TV"] ?? 0, 3) },
    },
    {
      icon: Eye, color: "var(--green)",
      titleKey: "insightRadioTitle" as const,
      descKey: "insightRadioDesc" as const,
      vars: { r: fmt(stats.correlations["Radio"] ?? 0, 3) },
    },
    {
      icon: Brain, color: "var(--purple)",
      titleKey: "insightInfluencerTitle" as const,
      descKey: "insightInfluencerDesc" as const,
      vars: {} as Record<string, string>,
    },
    {
      icon: AlertTriangle, color: "var(--orange)",
      titleKey: "insightSocialTitle" as const,
      descKey: "insightSocialDesc" as const,
      vars: { r: fmt(stats.correlations["Social Media"] ?? 0, 3) },
    },
  ];

  return (
    <div className="space-y-8">

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>
          {tIns("eyebrow")}
        </p>
        <h1 style={{ color: "var(--text-primary)" }}>{tIns("title")}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {tIns("subtitle", { model: modelDisplay })}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-card p-6 border relative overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--accent)", boxShadow: "0 0 32px rgba(59,130,246,0.06)" }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at 0% 50%, rgba(59,130,246,0.08) 0%, transparent 60%)" }} />
        <div className="flex items-center gap-4 relative">
          <div className="p-3 rounded-xl" style={{ background: "var(--accent-dim)" }}>
            <Zap className="w-6 h-6" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <p className="text-label mb-0.5">{tIns("heroLabel")}</p>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {featureLabel(tFeat as (k: string) => string, topFeature?.feature ?? "")}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {tIns("heroSub", {
                pct: ((topFeature?.importance ?? 0) * 100).toFixed(1),
                r: fmt(corrForTop, 3),
              })}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-5 gap-6">

        <motion.div
          className="col-span-3 rounded-card p-6 border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-1">
                <h2 style={{ color: "var(--text-primary)" }}>{tIns("featureChartTitle")}</h2>
                <Tip content={tIns("featureChartTip")} />
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {tIns("featureChartSub")}
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded-lg border"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
              {modelDisplay}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} layout="vertical" barSize={22} margin={{ left: 20 }}>
              <defs>
                <linearGradient id="fiGradInsights" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(Number(v) * 100).toFixed(0)}%`} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }}
                tickFormatter={v => featureLabel(tFeat as (key: string) => string, String(v))} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="importance" name={tc("importance")} radius={[0, 6, 6, 0]} fill="url(#fiGradInsights)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="col-span-2 space-y-5">
          <motion.div
            className="rounded-card p-5 border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-1 mb-4">
              <h2 style={{ color: "var(--text-primary)" }}>{tIns("channelCorrTitle")}</h2>
              <Tip content={tIns("channelCorrTip")} />
            </div>
            <div className="space-y-4">
              {correlations.map(([ch, corr]) => (
                <div key={ch} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full"
                        style={{ background: CH_COLOR[ch] ?? "var(--accent)" }} />
                      <span style={{ color: "var(--text-primary)" }}>
                        {channelLabel(tCh as (key: string) => string, ch)}
                      </span>
                    </span>
                    <span className="font-mono font-semibold tabular-nums"
                      style={{ color: CH_COLOR[ch] ?? "var(--accent)" }}>
                      r = {fmt(corr, 4)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden"
                    style={{ background: "var(--track-bg)" }}>
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${corr * 100}%` }}
                      transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      style={{ background: CH_COLOR[ch] ?? "var(--accent)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {roiByInfluencer.length > 0 && (
            <motion.div
              className="rounded-card p-5 border"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center gap-1 mb-4">
                <h2 style={{ color: "var(--text-primary)" }}>{tIns("roiByInfluencerTitle")}</h2>
                <Tip content={tIns("roiByInfluencerTip")} />
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={roiByInfluencer.map(([k, v]) => ({ name: k, roi: v }))}
                  barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(v: number) => [`${fmt(v, 4)}×`, tIns("roiAxisLabel")]}
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 8 }}
                  />
                  <Bar dataKey="roi" name={tIns("roiAxisLabel")} radius={[4, 4, 0, 0]}>
                    {roiByInfluencer.map(([k]) => (
                      <Cell key={k} fill={INFLUENCER_COLORS[k] ?? "#3b82f6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      </div>

      <motion.div
        className="rounded-card p-6 border"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="mb-5" style={{ color: "var(--text-primary)" }}>{tIns("rankingsTitle")}</h2>
        <div className="space-y-4">
          {chartData.map((f, i) => {
            const pct = (f.importance * 100).toFixed(1);
            const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#f97316"];
            const color = colors[i % colors.length];
            const pctNum = Number(pct);
            return (
              <div key={f.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${color}20`, color }}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {featureLabel(tFeat as (key: string) => string, f.name)}
                    </span>
                  </div>
                  <span className="text-sm font-mono font-semibold tabular-nums" style={{ color }}>
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--track-bg)" }}>
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pctNum}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{ background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        variants={stagger} initial="hidden" whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-2 gap-4"
      >
        {insightBlocks.map(({ icon: Icon, color, titleKey, descKey, vars }, idx) => (
          <motion.div key={idx} variants={item}
            className="rounded-card p-5 border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: `${color}40`, borderLeftWidth: 3, borderLeftColor: color }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{tIns(titleKey)}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{tIns(descKey, vars)}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
