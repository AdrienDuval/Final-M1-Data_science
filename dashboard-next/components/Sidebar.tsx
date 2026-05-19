"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitCompareArrows,
  Sliders,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/",          label: "Overview",    icon: LayoutDashboard },
  { href: "/models",    label: "Models",      icon: GitCompareArrows },
  { href: "/simulator", label: "Simulator",   icon: Sliders },
  { href: "/insights",  label: "Insights",    icon: Lightbulb },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="fixed top-0 left-0 h-full w-60 bg-slate-900 border-r border-slate-800 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100 leading-tight">Marketing ROI</p>
          <p className="text-xs text-slate-500 leading-tight">Analytics Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-brand-600/20 text-brand-400 border border-brand-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              )}
            >
              <Icon className={cn("w-4 h-4", active ? "text-brand-400" : "text-slate-500")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-600">EFREI M1 Data Engineering</p>
        <p className="text-xs text-slate-700 mt-0.5">RNCP40875 — Bloc 2</p>
      </div>
    </aside>
  );
}
