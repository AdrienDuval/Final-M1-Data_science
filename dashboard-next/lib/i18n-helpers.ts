type ChannelKey = "TV" | "Radio" | "Social Media";
type PerfKey = "High" | "Medium" | "Low";

const CHANNEL_KEYS = new Set<string>(["TV", "Radio", "Social Media"]);
const PERF_KEYS = new Set<string>(["High", "Medium", "Low"]);

export function channelLabel(
  t: (key: ChannelKey) => string,
  name: string,
): string {
  return CHANNEL_KEYS.has(name) ? t(name as ChannelKey) : name;
}

export function modelLabel(
  t: (key: string) => string,
  slug: string,
): string {
  try {
    return t(slug);
  } catch {
    return slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function perfClassLabel(
  t: (key: PerfKey) => string,
  label: string,
): string {
  return PERF_KEYS.has(label) ? t(label as PerfKey) : label;
}

export function featureLabel(
  t: (key: string) => string,
  key: string,
): string {
  try {
    return t(key);
  } catch {
    return key;
  }
}

export function statFeatureLabel(
  tCh: (key: ChannelKey) => string,
  tStats: (key: string) => string,
  col: string,
): string {
  if (col === "Sales") return tStats("sales");
  if (CHANNEL_KEYS.has(col)) return tCh(col as ChannelKey);
  return col;
}

export function skewLabel(
  t: (key: string) => string,
  sk: number,
): string {
  if (Math.abs(sk) < 0.5) return t("symmetric");
  return sk > 0 ? t("rightSkewed") : t("leftSkewed");
}

export function corrStrengthLabel(
  t: (key: string) => string,
  absCorr: number,
): string {
  if (absCorr > 0.7) return t("strong");
  if (absCorr > 0.4) return t("moderate");
  return t("weak");
}

/** Table column headers for statistical summary tables */
export function statTableHeaders(t: (key: string) => string): string[] {
  return [
    t("feature"), t("mean"), t("median"), t("std"), t("min"),
    t("q1"), t("q3"), t("max"), t("iqr"), t("skew"), t("outliersCol"),
  ];
}

/** Box-plot stats table headers */
export function boxTableHeaders(t: (key: string) => string): string[] {
  return [t("tier"), t("min"), t("q1"), t("median"), t("mean"), t("q3"), t("max"), t("n")];
}
