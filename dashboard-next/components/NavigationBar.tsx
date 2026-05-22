"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  BarChart3, GitCompareArrows, Zap, Lightbulb,
  TrendingUp, Target, Activity, Sun, Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import LocaleSwitcher from "@/components/LocaleSwitcher";

export default function NavigationBar() {
  const path = usePathname();
  const { theme, toggle } = useTheme();
  const t = useTranslations("nav");

  const toolsTabs = [
    { href: "/predict",        label: t("predict"),   icon: Zap },
    { href: "/simulator",      label: t("optimize"),  icon: TrendingUp },
    { href: "/target-planner", label: t("setGoal"),   icon: Target },
  ];

  const analyticsTabs = [
    { href: "/dashboard",           label: t("dashboard"), icon: BarChart3 },
    { href: "/models",             label: t("models"),    icon: GitCompareArrows },
    { href: "/feature-importance", label: t("drivers"),   icon: Lightbulb },
  ];

  const renderTab = ({ href, label, icon: Icon }: typeof toolsTabs[0]) => {
    const isActive = path === href;
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 group",
        )}
        style={{
          color: isActive ? "var(--text-primary)" : "var(--text-muted)",
          background: isActive ? "var(--accent-dim)" : "transparent",
        }}
      >
        <Icon
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: isActive ? "var(--accent)" : "inherit" }}
          strokeWidth={2}
        />
        <span>{label}</span>

        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="nav-active"
              className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
              style={{ background: "var(--accent)" }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </AnimatePresence>

        {!isActive && (
          <span
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "var(--tab-hover-bg)" }}
          />
        )}
      </Link>
    );
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--nav-border)",
      }}
    >
      <div className="flex items-center h-14 px-5 max-w-screen-2xl mx-auto gap-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div
            className="relative flex items-center justify-center w-7 h-7 rounded-lg overflow-hidden"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" }}
          >
            <Activity className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="hidden md:block">
            <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              ROI<span style={{ color: "var(--accent)" }}>intel</span>
            </span>
          </div>
        </Link>

        {/* ── Nav groups ── */}
        <div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex items-center gap-1">

            {/* Tools group */}
            <div className="flex items-center gap-0.5">
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 select-none"
                style={{ color: "var(--accent)" }}
              >
                {t("toolsLabel")}
              </span>
              {toolsTabs.map(renderTab)}
            </div>

            {/* Divider */}
            <div className="w-px h-5 mx-1 flex-shrink-0" style={{ background: "var(--border)" }} />

            {/* Analytics group */}
            <div className="flex items-center gap-0.5">
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 select-none"
                style={{ color: "var(--text-muted)" }}
              >
                {t("analyticsLabel")}
              </span>
              {analyticsTabs.map(renderTab)}
            </div>

          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2.5 pl-3 flex-shrink-0"
          style={{ borderLeft: "1px solid var(--border)" }}>

          <LocaleSwitcher />

          <motion.button
            onClick={toggle}
            whileTap={{ scale: 0.88 }}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{
              background: "var(--tab-hover-bg)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
            title={theme === "dark" ? t("themeLight") : t("themeDark")}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex"
              >
                {theme === "dark"
                  ? <Sun className="w-3.5 h-3.5" />
                  : <Moon className="w-3.5 h-3.5" />}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <div className="hidden md:flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                style={{ background: "var(--green)" }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: "var(--green)" }}
              />
            </span>
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {t("live")}
            </span>
          </div>
        </div>
      </div>

      <style>{`.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
    </nav>
  );
}
