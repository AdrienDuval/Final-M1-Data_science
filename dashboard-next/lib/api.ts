const BASE = "/api";

export interface Stats {
  total_campaigns: number;
  avg_sales: number;
  avg_roi: number;
  avg_total_budget: number;
  best_channel: string;
  sales_distribution: { range: string; count: number }[];
  budget_breakdown: Record<string, number>;
  sales_by_influencer: Record<string, number>;
  roi_by_influencer: Record<string, number>;
  correlations: Record<string, number>;
}

export interface ModelMetric {
  name: string;
  label: string;
  r2: number;
  rmse: number;
  mae: number;
  cv_r2_mean: number;
  cv_r2_std: number;
}

export interface FeatureImportance {
  model: string;
  features: { feature: string; importance: number }[];
}

export interface PredictRequest {
  TV: number;
  Radio: number;
  Social_Media: number;
  Influencer: string;
}

export interface PredictResponse {
  predicted_sales: number;
  roi: number;
  total_budget: number;
  vs_average: number;
  model_used: string;
}

export interface AllPredictions {
  predictions: { model: string; label: string; predicted_sales: number; roi: number }[];
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

export const api = {
  health:            () => get<{ status: string }>("/health"),
  stats:             () => get<Stats>("/stats"),
  metrics:           () => get<{ models: ModelMetric[] }>("/metrics"),
  featureImportance: () => get<FeatureImportance>("/feature-importance"),
  predict:           (body: PredictRequest) => post<PredictResponse>("/predict", body),
  predictAll:        (body: PredictRequest) => post<AllPredictions>("/predict/all", body),
};
