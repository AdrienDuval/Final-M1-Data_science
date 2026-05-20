"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { RefreshCw, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { api, PredictResponse, ClassifyResponse } from "@/lib/api";
import { fmt } from "@/lib/utils";

function CustomSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "M",
  onChange,
  trainingMax = max,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  trainingMax?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const isInRange = value <= trainingMax;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {label}
        </label>
        <span className="text-sm font-mono font-bold" style={{ color: "var(--accent)" }}>
          {fmt(value, 1)}
          {unit}
        </span>
      </div>

      {/* Slider */}
      <div className="relative group">
        <div
          className="absolute inset-0 h-2 rounded-full pointer-events-none"
          style={{ backgroundColor: "var(--border)" }}
        />
        <div
          className="absolute h-2 rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: "var(--accent)",
          }}
        />

        {/* Tooltip */}
        <div
          className="absolute -top-10 transform -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:-top-12 transition-all pointer-events-none"
          style={{
            left: `${pct}%`,
            backgroundColor: "var(--accent)",
            color: "white",
          }}
        >
          {fmt(value, 1)}
          {unit}
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
        />

        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 pointer-events-none"
          style={{
            left: `${pct}%`,
            backgroundColor: "white",
            borderColor: "var(--accent)",
          }}
        />
      </div>

      {/* Training range info */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: isInRange ? "var(--green)" : "var(--red)" }}
          />
          <span style={{ color: "var(--text-muted)" }}>
            Training range: {min}–{trainingMax}
            {unit}
          </span>
        </div>
        {!isInRange && (
          <span style={{ color: "var(--red)" }} className="font-semibold">
            Out of range
          </span>
        )}
      </div>
    </div>
  );
}

function AnimatedNumber({
  value,
  duration = 800,
  decimals = 2,
}: {
  value: number;
  duration?: number;
  decimals?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const frame = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayValue(value * progress);

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };
    requestAnimationFrame(frame);
  }, [value, duration]);

  return <>{fmt(displayValue, decimals)}</>;
}

function PerformanceBadge({ performance }: { performance: string }) {
  let bgColor = "var(--red)";
  let textColor = "white";

  if (performance === "High") {
    bgColor = "var(--green)";
  } else if (performance === "Medium") {
    bgColor = "var(--orange)";
  }

  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {performance}
    </span>
  );
}

export default function PredictPage() {
  const [TV, setTV] = useState(50);
  const [Radio, setRadio] = useState(20);
  const [Social, setSocial] = useState(5);
  const [influencer, setInfluencer] = useState("Mega");
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [classification, setClassification] = useState<ClassifyResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const runPrediction = useCallback(async () => {
    setLoading(true);
    try {
      const body = { TV, Radio, Social_Media: Social, Influencer: influencer };
      const [r, clf] = await Promise.all([api.predict(body), api.classify(body)]);
      setResult(r);
      setClassification(clf);
    } catch {
      alert("API error — make sure the FastAPI server is running.");
    } finally {
      setLoading(false);
    }
  }, [TV, Radio, Social, influencer]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1>Predict Sales</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Adjust budget inputs and get real-time sales predictions
        </p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Controls panel */}
        <div className="col-span-2 space-y-6">
          {/* Budget Sliders */}
          <div
            className="rounded-xl p-6 border space-y-6"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            <p className="text-label">Budget Allocation</p>
            <CustomSlider
              label="TV Budget"
              value={TV}
              min={10}
              max={100}
              onChange={setTV}
              trainingMax={100}
            />
            <CustomSlider
              label="Radio Budget"
              value={Radio}
              min={0}
              max={50}
              onChange={setRadio}
              trainingMax={50}
            />
            <CustomSlider
              label="Social Media"
              value={Social}
              min={0}
              max={14}
              step={0.5}
              onChange={setSocial}
              trainingMax={14}
            />

            {/* Influencer Type */}
            <div>
              <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Influencer Type
              </label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {["Mega", "Macro", "Micro", "Nano"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setInfluencer(opt)}
                    className="py-2 text-xs font-medium rounded-lg border transition-all"
                    style={{
                      backgroundColor: influencer === opt ? "var(--accent)" : "var(--bg-input)",
                      borderColor: influencer === opt ? "var(--accent)" : "var(--border)",
                      color: influencer === opt ? "white" : "var(--text-muted)",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Budget */}
            <div
              className="pt-4 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Total Budget
                </span>
                <span className="text-sm font-bold font-mono" style={{ color: "var(--text-primary)" }}>
                  {fmt(TV + Radio + Social, 1)}M
                </span>
              </div>
            </div>
          </div>

          {/* Predict Button */}
          <button
            onClick={runPrediction}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 font-semibold rounded-xl transition-all shadow-lg"
            style={{
              backgroundColor: loading ? "var(--text-muted)" : "var(--accent)",
              color: "white",
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Predicting…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run Prediction
              </>
            )}
          </button>
        </div>

        {/* Results panel */}
        <div className="col-span-3 space-y-6">
          {!result ? (
            <div
              className="h-full flex items-center justify-center rounded-xl border border-dashed py-16"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border)",
              }}
            >
              <div className="text-center">
                <Zap className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.3 }} />
                <p style={{ color: "var(--text-muted)" }} className="text-sm">
                  Configure your budget and click Run Prediction
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Main Prediction */}
              <div
                className="rounded-xl p-8 border"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--accent)",
                }}
              >
                <p className="text-label mb-3">Predicted Sales</p>
                <p
                  className="text-5xl font-bold tracking-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  <AnimatedNumber value={result.predicted_sales} />
                  <span className="text-2xl" style={{ color: "var(--text-muted)" }}>
                    M
                  </span>
                </p>
                <div className="mt-4 flex items-center gap-2">
                  {result.vs_average >= 0 ? (
                    <TrendingUp className="w-4 h-4" style={{ color: "var(--green)" }} />
                  ) : (
                    <TrendingDown className="w-4 h-4" style={{ color: "var(--red)" }} />
                  )}
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: result.vs_average >= 0 ? "var(--green)" : "var(--red)",
                    }}
                  >
                    {result.vs_average >= 0 ? "+" : ""}
                    <AnimatedNumber value={result.vs_average} decimals={2} />M vs dataset
                    avg
                  </span>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="rounded-xl p-5 border"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border)",
                  }}
                >
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    ROI
                  </p>
                  <p
                    className="text-3xl font-bold mt-2"
                    style={{ color: "var(--accent)" }}
                  >
                    <AnimatedNumber value={result.roi} decimals={2} />
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                      ×
                    </span>
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Sales / Budget
                  </p>
                </div>

                <div
                  className="rounded-xl p-5 border"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border)",
                  }}
                >
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Performance
                  </p>
                  <div className="mt-2">
                    <PerformanceBadge performance={classification?.label ?? "—"} />
                  </div>
                  <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                    {classification ? `${(classification.confidence * 100).toFixed(0)}% confidence` : "Campaign rating"}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

