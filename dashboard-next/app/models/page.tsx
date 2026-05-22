"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Trophy, CheckCircle2, Shield, Zap, Brain } from "lucide-react";
import { api, ModelMetric, ClassificationMetric } from "@/lib/api";
import { fmt } from "@/lib/utils";
import { Tip } from "@/components/Tooltip";
import { modelLabel } from "@/lib/i18n-helpers";

const MODEL_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981"];

function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ name?: string; value?: unknown; color?: string }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 shadow-xl text-xs" style={{ borderColor: "var(--border-strong)" }}>
      <p className="mb-1" style={{ color: "var(--text-muted)" }}>{label != null ? String(label) : ""}</p>
      {payload.map((p) => (
        <p key={String(p.name)} className="font-semibold tabular-nums" style={{ color: p.color || "var(--accent)" }}>
          {p.name}: {fmt(p.value as number, 4)}
        </p>
      ))}
    </div>
  );
}

const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function ModelsPage() {
  const t = useTranslations("models");
  const tt = useTranslations("models.tips");
  const tCols = useTranslations("models.cols");
  const tc = useTranslations("common");
  const tm = useTranslations("modelNames");

  const [models, setModels]       = useState<ModelMetric[] | null>(null);
  const [clfModels, setClfModels] = useState<ClassificationMetric[]>([]);
  const [error, setError]         = useState(false);

  useEffect(() => {
    api.metrics().then(d => setModels(d.models)).catch(() => setError(true));
    api.metricsClassification().then(d => setClfModels(d.models)).catch(() => {});
  }, []);

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p style={{ color: "var(--text-muted)" }} className="text-sm">
        {tc("apiUnavailable")}
      </p>
    </div>
  );

  if (!models) return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 rounded-card animate-shimmer" />
      ))}
    </div>
  );

  const bestR2 = Math.max(...models.map(m => m.r2));
  const best   = models.find(m => m.r2 === bestR2)!;
  const bestAccLabel = modelLabel(tm as (key: string) => string, best.name);

  const regressionColKeys = ["model", "r2", "rmse", "mae", "cvR2"] as const;
  const regressionTipKeys: (null | "r2" | "rmse" | "mae" | "cvR2")[] = [
    null, "r2", "rmse", "mae", "cvR2",
  ];

  const chartData = models.map((m, i) => ({
    name:  modelLabel(tm as (key: string) => string, m.name),
    R2:    m.r2,
    RMSE:  m.rmse,
    MAE:   m.mae,
    fill:  MODEL_COLORS[i % MODEL_COLORS.length],
  }));

  const clfHeaders = ["model", "accuracy", "f1", "roc"] as const;
  const clfTipKeys: ("accuracy" | "f1" | "roc")[] = ["accuracy", "f1", "roc"];

  const minCvStd = Math.min(...models.map(m => m.cv_r2_std));
  const mlpR2 = models.find(x => x.name === "mlp")?.r2 ?? "—";
  const mlpr2Str = typeof mlpR2 === "number" ? fmt(mlpR2, 4) : String(mlpR2);

  const r2Legend = tCols("r2");
  const f1Legend = tCols("f1");

  const nameMarker = "\uFFF0";
  const bestModelParts = t("bestModel", { name: nameMarker }).split(nameMarker);

  return (
    <div className="space-y-8">

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: "var(--accent)" }}>{t("eyebrow")}</p>
        <h1 style={{ color: "var(--text-primary)" }}>{t("title")}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {t("subtitle", { best: bestAccLabel, r2: fmt(best.r2, 4) })}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-card p-6 border relative overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--accent)", boxShadow: "0 0 40px rgba(59,130,246,0.06)" }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at 100% 0%, rgba(59,130,246,0.07) 0%, transparent 55%)" }} />
        <div className="flex items-center gap-4 relative">
          <div className="p-3 rounded-xl" style={{ background: "var(--accent-dim)" }}>
            <Trophy className="w-6 h-6" style={{ color: "var(--accent)" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {bestModelParts[0]}
              <span style={{ color: "var(--accent)" }}>{bestAccLabel}</span>
              {bestModelParts.slice(1).join("")}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {t("bestStats", {
                r2: fmt(best.r2, 4),
                rmse: fmt(best.rmse, 4),
                mae: fmt(best.mae, 4),
                cvMean: fmt(best.cv_r2_mean, 4),
                cvStd: fmt(best.cv_r2_std, 4),
              })}
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--green)" }}>
                {(best.r2 * 100).toFixed(1)}%
              </p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("r2Score")}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                {(best.cv_r2_mean * 100).toFixed(1)}%
              </p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("cvR2")}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            icon: Shield,
            titleKey: "predAccuracy",
            subKey: "predAccuracySub",
            value: `${(best.r2 * 100).toFixed(2)}%`,
            color: "var(--green)",
            i: 0,
          },
          {
            icon: Zap,
            titleKey: "cvStability",
            subKey: "cvStabilitySub",
            value: `±${(best.cv_r2_std * 100).toFixed(3)}%`,
            color: "var(--accent)",
            i: 1,
          },
          {
            icon: Brain,
            titleKey: "avgRmse",
            subKey: "avgRmseSub",
            value: `${best.rmse}M`,
            color: "var(--orange)",
            i: 2,
          },
        ].map(({ icon: Icon, titleKey, subKey, value, color, i }) => (
          <motion.div key={titleKey}
            custom={i} initial="hidden" animate="visible" variants={cardVariants}
            className="rounded-card p-5 border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl" style={{ background: `${color}1a` }}>
                <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-label mb-1">{t(titleKey)}</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color }}>
                  {value}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{t(subKey)}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">

        <motion.div
          className="col-span-3 rounded-card border overflow-hidden"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h2 style={{ color: "var(--text-primary)" }}>{t("regressionTable")}</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                {regressionColKeys.map((col, idx) => {
                  const tipK = regressionTipKeys[idx];
                  return (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-muted)" }}>
                      <span className="flex items-center gap-1">
                        {tCols(col)}
                        {tipK && <Tip content={tt(tipK)} />}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {models.map((m, i) => {
                const isBest = m.name === best.name;
                return (
                  <motion.tr key={m.name}
                    custom={i} initial="hidden" animate="visible" variants={cardVariants}
                    className="border-b transition-colors"
                    style={{
                      borderColor: "var(--border)",
                      background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-input)",
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: MODEL_COLORS[i] }} />
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {modelLabel(tm as (key: string) => string, m.name)}
                        </span>
                        {isBest && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background: "var(--green-dim)", color: "var(--green)" }}>
                            <CheckCircle2 className="w-2.5 h-2.5" />{tc("best")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <span className={isBest ? "font-bold" : ""}
                        style={{ color: isBest ? "var(--green)" : "var(--text-primary)" }}>
                        {fmt(m.r2, 4)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {fmt(m.rmse, 4)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {fmt(m.mae, 4)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {fmt(m.cv_r2_mean, 4)} ± {fmt(m.cv_r2_std, 4)}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>

        <motion.div
          className="col-span-2 rounded-card p-5 border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="mb-4" style={{ color: "var(--text-primary)" }}>{t("r2Chart")}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" barSize={16}
              margin={{ left: 4, right: 16, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0.98, 1]} tick={{ fontSize: 9 }}
                tickFormatter={v => v.toFixed(3)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="R2" name={r2Legend} radius={[0, 5, 5, 0]}>
                {chartData.map((d, i) => <Cell key={d.name} fill={MODEL_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {clfModels.length > 0 && (
        <motion.div
          className="space-y-5"
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <h2 style={{ color: "var(--text-primary)" }}>{t("classificationTitle")}</h2>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {t("classificationSub")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="rounded-card border overflow-hidden"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    {clfHeaders.map((col, idx) => {
                      if (col === "model") {
                        return (
                          <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                            style={{ color: "var(--text-muted)" }}>
                            <span className="flex items-center gap-1">{tCols(col)}</span>
                          </th>
                        );
                      }
                      const tipK = clfTipKeys[idx - 1];
                      return (
                        <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "var(--text-muted)" }}>
                          <span className="flex items-center gap-1">
                            {tCols(col)}
                            <Tip content={tt(tipK)} />
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {clfModels.map((m, i) => {
                    const bestF1 = Math.max(...clfModels.map(x => x["F1-macro"]));
                    const isBest = Math.abs(m["F1-macro"] - bestF1) < 1e-6;
                    return (
                      <tr key={m.Model} className="border-b"
                        style={{ borderColor: "var(--border)", background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-input)" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: MODEL_COLORS[i] }} />
                            <span className="font-medium text-xs" style={{ color: "var(--text-primary)" }}>
                              {modelLabel(tm as (key: string) => string, m.Model)}
                            </span>
                            {isBest && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                                style={{ background: "var(--green-dim)", color: "var(--green)" }}>{tc("best")}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {fmt(m.Accuracy, 4)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs"
                          style={{ color: isBest ? "var(--accent)" : "var(--text-primary)", fontWeight: isBest ? 700 : 400 }}>
                          {fmt(m["F1-macro"], 4)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {fmt(m["ROC-AUC"], 4)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rounded-card p-5 border"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
              <h2 className="mb-4" style={{ color: "var(--text-primary)" }}>{t("f1Chart")}</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={clfModels.map((m, i) => ({
                    name: modelLabel(tm as (key: string) => string, m.Model),
                    f1: m["F1-macro"],
                    fill: MODEL_COLORS[i],
                  }))}
                  layout="vertical" barSize={14}
                  margin={{ left: 4, right: 20, top: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0.95, 1]} tick={{ fontSize: 9 }} tickFormatter={v => v.toFixed(3)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="f1" name={f1Legend} radius={[0, 5, 5, 0]}>
                    {clfModels.map((_, j) => <Cell key={j} fill={MODEL_COLORS[j]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        className="grid grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {[
          {
            label: t("insightBest"),
            body: t("insightBestBody", {
              name: bestAccLabel,
              r2: fmt(best.r2, 4),
              pct: (best.r2 * 100).toFixed(1),
            }),
            color: "var(--accent)",
          },
          {
            label: t("insightGen"),
            body: t("insightGenBody", {
              std: fmt(minCvStd, 4),
            }),
            color: "var(--green)",
          },
          {
            label: t("insightDl"),
            body: t("insightDlBody", { r2: mlpr2Str }),
            color: "var(--purple)",
          },
        ].map(({ label, body, color }, idx) => (
          <div key={`insight-${idx}`} className="rounded-card p-4 border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: `${color}33`, borderLeftWidth: 3, borderLeftColor: color }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color }}>{label}</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{body}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
