"use client";

import type { ChartData } from "@/lib/business";

export function PromiseVsRealityChart({ chart }: { chart: ChartData }) {
  return (
    <div className="flex flex-col gap-3">
      <svg viewBox="0 0 380 160" width="100%" height="160">
        <polyline
          points={chart.expectedPoints}
          fill="none"
          stroke="var(--color-neutral-400)"
          strokeWidth={2}
          strokeDasharray="1,7"
          strokeLinecap="round"
        />
        <polyline
          points={chart.actualPoints}
          fill="none"
          stroke="var(--color-text)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex items-center gap-5 text-[11px] text-[var(--color-neutral-500)]">
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-[3px] w-[10px]"
            style={{ background: "var(--color-neutral-400)" }}
          />
          Prometido
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-[3px] w-[10px]" style={{ background: "var(--color-text)" }} />
          Real
        </span>
      </div>
    </div>
  );
}
