import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

export const CHART_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#2D1B69", // amber
  "#f97316", // orange
  "#ef4444", // red
];

export const INFLUENCER_COLORS: Record<string, string> = {
  Mega:  "#6366f1",
  Macro: "#8b5cf6",
  Micro: "#06b6d4",
  Nano:  "#f59e0b",
};
