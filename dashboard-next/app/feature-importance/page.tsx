"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Eye, Brain, AlertTriangle } from "lucide-react";
import { api, FeatureImportance, Stats } from "@/lib/api";
import { fmt } from "@/lib/utils";
import { Tip } from "@/components/Tooltip";
import { channelLabel, featureLabel, modelLabel } from "@/lib/i18n-helpers";

const CH_COLOR: Record<string, string> = {
  TV: "#3b82f6", Radio: "#8b5cf6", "Social Media": "#06b6d4",
};

export default function FeatureImportancePage() {
  const t = useTranslations("featureImportance");
  const tFeat = useTranslations("featureImportance.features");
  const tc = useTranslations("common");
  const tCh = useTranslations("channels");
  const tm = useTranslations("modelNames");

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
    payload?: Array<{ value?: unknown }>;
    label?: string;
  }) {
    if (!active || !payload?.length) return null;
    const disp = label ? featureLabel(tFeat as (k: string) => string, label) : "";
    const val = payload[0]?.value as number | undefined;
    return (
      <div className="glass rounded-xl px-3 py-2 shadow-xl text-xs" style={{ borderColor: "var(--border-strong)" }}>
        <p className="mb-1" style={{ color: "var(--text-muted)" }}>{disp}</p>
        <p className="font-semibold" style={{ color: "var(--accent)" }}>
          {t("importanceValue", { value: fmt(val ?? 0, 4) })}
        </p>
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
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-card animate-shimmer" />)}
    </div>
  );

  const modelDisplay = modelLabel(tm as (k: string) => string, fi.model);

  const chartData = fi.features.map(f => ({ name: f.feature, importance: f.importance }));
  const correlations = Object.entries(stats.correlations).sort((a, b) => b[1] - a[1]);

  const staticPlots = [
    { src: "http://localhost:8000/figures/shap_summary.png", labelKey: "shapPlot" as const },
    { src: "http://localhost:8000/figures/feature_importance.png", labelKey: "nativePlot" as const },
  ];

  const findings = [
    {
      icon: TrendingUp, color: "var(--accent)",
      titleKey: "findingTv" as const,
      descKey: "findingTvDesc" as const,
      vars: { r: fmt(stats.correlations["TV"] ?? 0, 3) },
    },
    {
      icon: Eye, color: "var(--green)",
      titleKey: "findingRadio" as const,
      descKey: "findingRadioDesc" as const,
      vars: { r: fmt(stats.correlations["Radio"] ?? 0, 3) },
    },
    {
      icon: Brain, color: "var(--purple)",
      titleKey: "findingInfluencer" as const,
      descKey: "findingInfluencerDesc" as const,
      vars: {} as Record<string, string>,
    },
    {
      icon: AlertTriangle, color: "var(--orange)",
      titleKey: "findingSocial" as const,
      descKey: "findingSocialDesc" as const,
      vars: { r: fmt(stats.correlations["Social Media"] ?? 0, 3) },
    },
  ];

  return (
    <div className="space-y-8">

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>
          {t("eyebrow")}
        </p>
        <h1 style={{ color: "var(--text-primary)" }}>{t("title")}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {t("subtitle", { model: modelDisplay })}
        </p>
      </motion.div>

      <motion.div
        className="flex items-center gap-4 flex-wrap"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-32 h-5 rounded-lg"
            style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.3) 0%, #3b82f6 50%, #8b5cf6 100%)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t("legend")}</span>
        </div>
        <span className="text-xs px-2 py-1 rounded-lg border"
          style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
          {modelDisplay}
        </span>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {staticPlots.map(({ src, labelKey }) => (
          <motion.div key={labelKey}
            className="rounded-card border overflow-hidden"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-xs font-medium px-4 py-2.5 border-b"
              style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
              {t(labelKey)}
            </p>
            <div className="p-3">
              <img src={src} alt={t(labelKey)}
                className="w-full h-auto rounded-lg object-contain"
                style={{ maxHeight: 280 }}
                onError={e => { (e.currentTarget as HTMLImageElement).closest(".rounded-card")?.classList.add("hidden"); }} />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="rounded-card p-6 border"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-1 mb-1">
          <h2 style={{ color: "var(--text-primary)" }}>{t("ranking")}</h2>
          <Tip content={t("rankingTip")} />
        </div>
        <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
          {t("rankingSub")}
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} layout="vertical" barSize={26}
            margin={{ left: 140, right: 20, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="fiGrad2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }}
              tickFormatter={v => `${(Number(v) * 100).toFixed(0)}%`} />
            <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }}
              tickFormatter={v => featureLabel(tFeat as (key: string) => string, String(v))} />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="importance" name={tc("importance")} radius={[0, 6, 6, 0]} fill="url(#fiGrad2)" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-2 gap-6">

        <motion.div
          className="rounded-card p-6 border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="mb-5" style={{ color: "var(--text-primary)" }}>{t("rankings")}</h2>
          <div className="space-y-4">
            {chartData.map((f, i) => {
              const pctNum = Number((f.importance * 100).toFixed(1));
              const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#f97316"];
              const color = colors[i % colors.length];
              return (
                <div key={f.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: `${color}20`, color }}>
                        {i + 1}
                      </span>
                      <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                        {featureLabel(tFeat as (key: string) => string, f.name)}
                      </span>
                    </div>
                    <span className="text-sm font-mono font-semibold tabular-nums" style={{ color }}>
                      {pctNum}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--track-bg)" }}>
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pctNum}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                      style={{ background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          className="rounded-card p-6 border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-1 mb-5">
            <h2 style={{ color: "var(--text-primary)" }}>{t("correlation")}</h2>
            <Tip content={t("correlationTip")} />
          </div>
          <div className="space-y-5">
            {correlations.map(([ch, corr]) => (
              <div key={ch} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
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
                    whileInView={{ width: `${corr * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    style={{ background: CH_COLOR[ch] ?? "var(--accent)" }}
                  />
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {corr > 0.7 ? t("corrStrong")
                    : corr > 0.4 ? t("corrModerate")
                      : t("corrWeak")}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {findings.map(({ icon: Icon, color, titleKey, descKey, vars }, idx) => (
          <div key={idx} className="rounded-card p-5 border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: `${color}40`, borderLeftWidth: 3, borderLeftColor: color }}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{t(titleKey)}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {t(descKey, vars)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
