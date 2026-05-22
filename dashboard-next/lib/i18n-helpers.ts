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
