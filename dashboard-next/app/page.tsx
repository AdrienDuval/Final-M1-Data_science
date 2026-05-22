"use client";
import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useInView,
  useMotionTemplate,
} from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Zap, TrendingUp, Target,
  BarChart3, GitCompareArrows, Lightbulb,
  ArrowRight, Activity,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   SCROLL PROGRESS BAR
───────────────────────────────────────────────────────── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      className="fixed left-0 right-0 h-[2px] origin-left z-[59]"
      style={{
        top: "56px",
        scaleX,
        background: "linear-gradient(90deg, #3b82f6, #8b5cf6 50%, #10b981)",
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────
   ANIMATED BACKGROUND
───────────────────────────────────────────────────────── */
function Background() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!ref.current) return;
    const orbs = ref.current.querySelectorAll<HTMLElement>(".bg-orb");
    orbs.forEach((orb, i) => {
      gsap.to(orb, {
        x: `random(-110, 110)`,
        y: `random(-70, 70)`,
        duration: gsap.utils.random(12, 22),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 3.2,
      });
      gsap.to(orb, {
        scale: gsap.utils.random(0.82, 1.18),
        duration: gsap.utils.random(7, 13),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 1.8,
      });
    });
  }, { scope: ref });

  return (
    <div ref={ref} className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.055) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      {/* Orb 1 — blue, top-left */}
      <div
        className="bg-orb absolute -top-52 -left-28 w-[750px] h-[750px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 65%)",
          filter: "blur(72px)",
        }}
      />
      {/* Orb 2 — purple, top-right */}
      <div
        className="bg-orb absolute -top-36 -right-20 w-[640px] h-[640px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.17) 0%, transparent 65%)",
          filter: "blur(88px)",
        }}
      />
      {/* Orb 3 — green, mid-lower */}
      <div
        className="bg-orb absolute top-[50%] left-[15%] w-[520px] h-[520px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 65%)",
          filter: "blur(90px)",
        }}
      />
      {/* Orb 4 — cyan accent, far right */}
      <div
        className="bg-orb absolute top-[30%] right-[-80px] w-[380px] h-[380px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />
      {/* Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 110% 80% at 50% 50%, transparent 35%, rgba(14,21,37,0.65) 100%)",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   WORD-SPLIT HERO TITLE
───────────────────────────────────────────────────────── */
function SplitTitle({ line1, accentLine }: { line1: string; accentLine: string }) {
  const words1 = line1.trim().split(" ");
  const words2 = accentLine.trim().split(" ");
  const total1 = words1.length;

  return (
    <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] mb-5">
      <span className="block">
        {words1.map((w, i) => (
          <span
            key={i}
            style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", marginRight: "0.3em" }}
          >
            <motion.span
              style={{ display: "inline-block", color: "var(--text-primary)" }}
              initial={{ y: "108%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              {w}
            </motion.span>
          </span>
        ))}
      </span>
      <span className="block">
        {words2.map((w, i) => (
          <span
            key={i}
            style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", marginRight: "0.3em" }}
          >
            <motion.span
              style={{ display: "inline-block", color: "var(--accent)" }}
              initial={{ y: "108%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 + (total1 + i) * 0.07, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              {w}
            </motion.span>
          </span>
        ))}
      </span>
    </h1>
  );
}

/* ─────────────────────────────────────────────────────────
   ANIMATED STAT COUNTER
───────────────────────────────────────────────────────── */
function AnimatedStat({
  from, to, fmt, sub, accent, delay = 0,
}: {
  from: number; to: number; fmt: (v: number) => string;
  sub: string; accent: string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(from);
  const spring = useSpring(mv, { stiffness: 45, damping: 16 });
  const fmtRef = useRef(fmt);
  fmtRef.current = fmt;
  const [display, setDisplay] = useState(fmt(from));

  useEffect(() => {
    if (!inView) return;
    const id = setTimeout(() => mv.set(to), delay * 1000);
    return () => clearTimeout(id);
  }, [inView, mv, to, delay]);

  useEffect(() => spring.on("change", (v) => setDisplay(fmtRef.current(v))), [spring]);

  return (
    <motion.div
      ref={ref}
      className="text-center px-6 py-3"
      initial={{ opacity: 0, y: 8 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }}
    >
      <p className="text-lg font-extrabold tabular-nums leading-none" style={{ color: accent }}>{display}</p>
      <p className="text-[10px] font-medium mt-1 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{sub}</p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   BEAM DIVIDER
───────────────────────────────────────────────────────── */
function BeamDivider() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div ref={ref} className="relative h-px w-full overflow-hidden">
      <motion.div
        className="absolute inset-0 h-full origin-left"
        style={{ background: "linear-gradient(90deg, transparent 0%, var(--accent) 30%, #8b5cf6 70%, transparent 100%)" }}
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   3D TOOL CARD
───────────────────────────────────────────────────────── */
function ToolCard({
  href, icon: Icon, accent, title, question, desc, cta, delay = 0,
}: {
  href: string; icon: React.ElementType; accent: string;
  title: string; question: string; desc: string; cta: string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [hovered, setHovered] = useState(false);

  const rX = useMotionValue(0);
  const rY = useMotionValue(0);
  const rotateX = useSpring(rX, { stiffness: 340, damping: 28 });
  const rotateY = useSpring(rY, { stiffness: 340, damping: 28 });

  const glowXPct = useMotionValue(30);
  const glowYPct = useMotionValue(30);
  const glowBg = useMotionTemplate`radial-gradient(240px circle at ${glowXPct}% ${glowYPct}%, ${accent}16, transparent 65%)`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: "900px" }}
    >
      <Link href={href}>
        <motion.div
          className="relative rounded-card p-6 border h-full flex flex-col cursor-pointer overflow-hidden"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: hovered ? accent : "var(--border)",
            boxShadow: hovered ? `0 24px 64px ${accent}24` : "none",
            transition: "border-color 0.25s, box-shadow 0.35s",
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const nx = (e.clientX - rect.left) / rect.width;
            const ny = (e.clientY - rect.top) / rect.height;
            rX.set((ny - 0.5) * -10);
            rY.set((nx - 0.5) * 10);
            glowXPct.set(nx * 100);
            glowYPct.set(ny * 100);
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { setHovered(false); rX.set(0); rY.set(0); }}
        >
          {/* Dynamic cursor-tracking glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: glowBg, opacity: hovered ? 1 : 0, transition: "opacity 0.3s" }}
          />

          {/* Top shimmer bar */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-[2px] origin-left"
            style={{ background: `linear-gradient(90deg, ${accent}, ${accent}66)` }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: hovered ? 1 : 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />

          {/* Icon with spring-bounce on hover */}
          <motion.div
            className="p-3 rounded-xl w-fit mb-5"
            style={{ background: `${accent}18` }}
            animate={hovered ? { rotate: [0, -8, 8, -3, 0], scale: [1, 1.1, 1.1, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 0.45 }}
          >
            <Icon className="w-5 h-5" style={{ color: accent }} strokeWidth={1.8} />
          </motion.div>

          <p className="text-base font-bold mb-2" style={{ color: "var(--text-primary)" }}>{title}</p>

          <div
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg mb-3 w-fit"
            style={{ background: `${accent}18`, color: accent }}
          >
            <ArrowRight className="w-3 h-3 flex-shrink-0" />
            <span className="font-medium">{question}</span>
          </div>

          <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--text-muted)" }}>{desc}</p>

          <motion.div
            className="flex items-center gap-1.5 mt-5 text-sm font-semibold"
            style={{ color: accent }}
            animate={{ x: hovered ? 5 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {cta}
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   ANALYTICS CARD
───────────────────────────────────────────────────────── */
function AnalyticsCard({
  href, icon: Icon, accent, title, desc, delay = 0,
}: {
  href: string; icon: React.ElementType; accent: string;
  title: string; desc: string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={href}>
        <motion.div
          className="relative rounded-xl p-4 border flex items-center gap-4 cursor-pointer overflow-hidden"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: hovered ? accent : "var(--border)",
            boxShadow: hovered ? `0 8px 30px ${accent}18` : "none",
            transition: "border-color 0.2s, box-shadow 0.3s",
          }}
          animate={{ y: hovered ? -3 : 0 }}
          transition={{ duration: 0.2 }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-400"
            style={{
              opacity: hovered ? 1 : 0,
              background: `radial-gradient(ellipse at 0% 50%, ${accent}12 0%, transparent 60%)`,
            }}
          />
          <motion.div
            className="p-2.5 rounded-lg flex-shrink-0"
            style={{ background: `${accent}18` }}
            animate={{ scale: hovered ? 1.12 : 1, rotate: hovered ? 5 : 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 20 }}
          >
            <Icon className="w-4 h-4" style={{ color: accent }} strokeWidth={1.8} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{title}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{desc}</p>
          </div>
          <motion.div
            animate={{ x: hovered ? 0 : -6, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const TOOLS = [
  { href: "/predict",        icon: Zap,             accent: "#3b82f6", titleKey: "predictTitle",  questionKey: "predictQ",  descKey: "predictDesc",  ctaKey: "predictCta",  delay: 0.1 },
  { href: "/simulator",      icon: TrendingUp,      accent: "#8b5cf6", titleKey: "optimizeTitle", questionKey: "optimizeQ", descKey: "optimizeDesc", ctaKey: "optimizeCta", delay: 0.2 },
  { href: "/target-planner", icon: Target,          accent: "#10b981", titleKey: "goalTitle",     questionKey: "goalQ",     descKey: "goalDesc",     ctaKey: "goalCta",     delay: 0.3 },
] as const;

const ANALYTICS = [
  { href: "/dashboard",          icon: BarChart3,        accent: "#f59e0b", titleKey: "analyticsOverview", descKey: "analyticsOverviewDesc" },
  { href: "/models",             icon: GitCompareArrows, accent: "#06b6d4", titleKey: "analyticsModels",   descKey: "analyticsModelsDesc"   },
  { href: "/feature-importance", icon: Lightbulb,        accent: "#f43f5e", titleKey: "analyticsDrivers",  descKey: "analyticsDriversDesc"  },
] as const;

const STAT_DEFS = [
  { from: 0,    to: 4572,   fmt: (v: number) => Math.round(v).toLocaleString(), subKey: "stat1Sub", accent: "#3b82f6", delay: 0.1 },
  { from: 0.99, to: 0.9965, fmt: (v: number) => `R² = ${v.toFixed(4)}`,        subKey: "stat2Sub", accent: "#8b5cf6", delay: 0.2 },
  { from: 0,    to: 4,      fmt: (v: number) => `${Math.round(v)}`,             subKey: "stat3Sub", accent: "#10b981", delay: 0.3 },
] as const;

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
export default function LandingPage() {
  const t = useTranslations("landing");

  /* Hero parallax */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY       = useTransform(scrollY, [0, 360], [0, -55]);
  const heroOpacity = useTransform(scrollY, [0, 280], [1, 0.55]);

  /* Cursor glow in hero */
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const smoothX = useSpring(cursorX, { stiffness: 55, damping: 18 });
  const smoothY = useSpring(cursorY, { stiffness: 55, damping: 18 });
  const cursorGlow = useMotionTemplate`radial-gradient(420px circle at ${smoothX}px ${smoothY}px, rgba(59,130,246,0.08), transparent 70%)`;

  return (
    <>
      <ScrollProgress />
      <Background />

      <div className="space-y-20 pb-20">

        {/* ══ HERO ══════════════════════════════════════════════ */}
        <motion.section
          ref={heroRef}
          className="relative text-center pt-8 pb-2"
          style={{ y: heroY, opacity: heroOpacity }}
          onMouseMove={(e) => {
            const rect = heroRef.current?.getBoundingClientRect();
            if (rect) { cursorX.set(e.clientX - rect.left); cursorY.set(e.clientY - rect.top); }
          }}
        >
          {/* Cursor glow */}
          <motion.div className="absolute inset-0 pointer-events-none" style={{ background: cursorGlow }} />

          {/* Eyebrow badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-7"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid rgba(59,130,246,0.28)",
            }}
            initial={{ opacity: 0, scale: 0.82, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ background: "var(--accent)" }}
              />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "var(--accent)" }} />
            </span>
            {t("eyebrow")}
          </motion.div>

          {/* Word-split title */}
          <SplitTitle line1={t("titleLine1")} accentLine={t("titleAccent")} />

          {/* Subtitle */}
          <motion.p
            className="text-base max-w-lg mx-auto leading-relaxed mb-10"
            style={{ color: "var(--text-muted)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.55 }}
          >
            {t("subtitle")}
          </motion.p>

          {/* Stats strip with count-up */}
          <motion.div
            className="inline-flex items-center rounded-2xl border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.85, duration: 0.5 }}
          >
            {STAT_DEFS.map((s, i) => (
              <div
                key={s.subKey}
                className={i > 0 ? "border-l" : ""}
                style={{ borderColor: "var(--border)" }}
              >
                <AnimatedStat
                  from={s.from as number}
                  to={s.to as number}
                  fmt={s.fmt}
                  sub={t(s.subKey)}
                  accent={s.accent}
                  delay={s.delay}
                />
              </div>
            ))}
          </motion.div>
        </motion.section>

        <BeamDivider />

        {/* ══ TOOLS ═════════════════════════════════════════════ */}
        <section>
          <motion.p
            className="text-xs font-bold uppercase tracking-widest mb-6"
            style={{ color: "var(--accent)" }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
          >
            {t("toolsHeading")}
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TOOLS.map((tool) => (
              <ToolCard
                key={tool.href}
                href={tool.href}
                icon={tool.icon}
                accent={tool.accent}
                title={t(tool.titleKey)}
                question={t(tool.questionKey)}
                desc={t(tool.descKey)}
                cta={t(tool.ctaKey)}
                delay={tool.delay}
              />
            ))}
          </div>
        </section>

        <BeamDivider />

        {/* ══ ANALYTICS ═════════════════════════════════════════ */}
        <section>
          <motion.p
            className="text-xs font-bold uppercase tracking-widest mb-6"
            style={{ color: "var(--text-muted)" }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
          >
            {t("analyticsHeading")}
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ANALYTICS.map(({ href, icon, accent, titleKey, descKey }, i) => (
              <AnalyticsCard
                key={href}
                href={href}
                icon={icon}
                accent={accent}
                title={t(titleKey)}
                desc={t(descKey)}
                delay={0.05 + i * 0.08}
              />
            ))}
          </div>
        </section>

        {/* ══ FOOTER ════════════════════════════════════════════ */}
        <motion.div
          className="flex items-center justify-center gap-2 pt-2 opacity-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div
            className="flex items-center justify-center w-5 h-5 rounded-md"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" }}
          >
            <Activity className="w-3 h-3 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            ROI<span style={{ color: "var(--accent)" }}>intel</span>
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t("credit")}
          </span>
        </motion.div>

      </div>
    </>
  );
}
