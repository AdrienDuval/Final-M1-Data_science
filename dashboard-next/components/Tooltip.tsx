"use client";
import * as T from "@radix-ui/react-tooltip";
import { HelpCircle } from "lucide-react";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <T.Provider delayDuration={180}>{children}</T.Provider>;
}

/**
 * Wrap any element in <Tip content="..."> to give it a hover tooltip.
 * If no children are given, renders a subtle HelpCircle icon trigger.
 */
export function Tip({
  content,
  children,
  side = "top",
  maxWidth = 260,
}: {
  content: React.ReactNode;
  children?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  maxWidth?: number;
}) {
  return (
    <T.Root>
      <T.Trigger asChild>
        {children ? (
          <span className="cursor-help">{children}</span>
        ) : (
          <span className="inline-flex items-center cursor-help ml-1 opacity-50 hover:opacity-100 transition-opacity">
            <HelpCircle className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
          </span>
        )}
      </T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          style={{
            maxWidth,
            background: "var(--bg-card)",
            border: "1px solid var(--border-strong)",
            borderRadius: "0.625rem",
            padding: "0.5rem 0.75rem",
            fontSize: "0.75rem",
            lineHeight: "1.5",
            color: "var(--text-secondary)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            zIndex: 9999,
          }}
        >
          {content}
          <T.Arrow style={{ fill: "var(--border-strong)" }} />
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
