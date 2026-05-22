"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const BARS = [
  { h: 32, color: "#3b82f6", delay: 0.00 },
  { h: 56, color: "#6366f1", delay: 0.12 },
  { h: 72, color: "#8b5cf6", delay: 0.24 },
  { h: 48, color: "#06b6d4", delay: 0.36 },
  { h: 64, color: "#8b5cf6", delay: 0.48 },
  { h: 40, color: "#6366f1", delay: 0.60 },
  { h: 56, color: "#3b82f6", delay: 0.72 },
];

export default function Loading() {
  const t = useTranslations("loading");

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage:
          "radial-gradient(circle, rgba(59,130,246,0.12) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />

      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.07) 0%, transparent 60%)",
      }} />

      <div className="relative flex flex-col items-center gap-10">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              boxShadow: "0 0 40px rgba(59,130,246,0.35)",
            }}
            animate={{
              boxShadow: [
                "0 0 40px rgba(59,130,246,0.35)",
                "0 0 64px rgba(139,92,246,0.45)",
                "0 0 40px rgba(59,130,246,0.35)",
              ],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-2xl font-black text-white select-none">R</span>
          </motion.div>

          <div className="text-center">
            <p
              className="text-2xl font-bold tracking-tight"
              style={{
                background: "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ROIintel
            </p>
            <p className="text-xs mt-1 tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
              {t("tagline")}
            </p>
          </div>
        </motion.div>

        <motion.div
          className="flex items-end gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {BARS.map((bar, i) => (
            <motion.div
              key={i}
              className="w-2.5 rounded-full"
              style={{ background: bar.color, minHeight: 4 }}
              animate={{
                height: [bar.h * 0.2, bar.h, bar.h * 0.45, bar.h * 0.8, bar.h * 0.2],
                opacity: [0.55, 1, 0.65, 1, 0.55],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: bar.delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>

        <motion.p
          className="text-xs tracking-widest uppercase"
          style={{ color: "var(--text-muted)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0.3, 0.7, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          {t("status")}
        </motion.p>
      </div>
    </div>
  );
}
