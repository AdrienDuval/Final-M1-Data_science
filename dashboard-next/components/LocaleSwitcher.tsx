"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";
import { locales, type Locale, LOCALE_COOKIE } from "@/i18n/config";

function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

export default function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const t = useTranslations("locale");

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    setLocaleCookie(next);
    startTransition(() => router.refresh());
  };

  return (
    <div
      className="flex items-center rounded-lg p-0.5"
      style={{ background: "var(--tab-hover-bg)", border: "1px solid var(--border)" }}
      role="group"
      aria-label={t("ariaLabel")}
    >
      {locales.map((loc) => {
        const active = locale === loc;
        return (
          <motion.button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            disabled={pending}
            whileTap={{ scale: 0.95 }}
            className="relative px-2.5 py-1 text-xs font-semibold rounded-md transition-colors uppercase tracking-wide"
            style={{
              color: active ? "var(--text-primary)" : "var(--text-muted)",
              opacity: pending && !active ? 0.6 : 1,
            }}
            aria-pressed={active}
            aria-label={t(loc)}
          >
            {active && (
              <motion.span
                layoutId="locale-pill"
                className="absolute inset-0 rounded-md"
                style={{ background: "var(--accent-dim)", border: "1px solid var(--accent)" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{loc}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
