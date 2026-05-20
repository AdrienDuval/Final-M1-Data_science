"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  GitCompareArrows,
  Zap,
  Lightbulb,
  TrendingUp,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Data Overview", icon: BarChart3 },
  { href: "/models", label: "Model Comparison", icon: GitCompareArrows },
  { href: "/feature-importance", label: "Feature Importance", icon: Lightbulb },
  { href: "/predict", label: "Predict", icon: Zap },
  { href: "/simulator", label: "Budget Simulator", icon: TrendingUp },
  { href: "/target-planner", label: "Target Planner", icon: Target },
];

export default function NavigationBar() {
  const path = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[--bg-primary] border-b border-[--border] backdrop-blur-sm">
      {/* Container */}
      <div className="flex items-center h-16 px-6">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2 mr-8 flex-shrink-0">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-white hidden md:inline">
            Marketing ROI
          </span>
        </div>

        {/* Tab Navigation - Scrollable on mobile */}
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1">
            {tabs.map(({ href, label, icon: Icon }) => {
              const isActive = path === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 group"
                  style={{
                    color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                  }}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{label.split(" ")[0]}</span>

                  {/* Animated underline */}
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5 animate-underline"
                      style={{ backgroundColor: "var(--accent)" }}
                    />
                  )}

                  {/* Hover state for inactive tabs */}
                  {!isActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                      style={{ backgroundColor: "var(--text-muted)" }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hide scrollbar on nav */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </nav>
  );
}

