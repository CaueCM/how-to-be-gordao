"use client";

import type { HeatmapCell } from "@/lib/business";

export function HabitHeatmap({ cells }: { cells: HeatmapCell[] }) {
  return (
    <div className="grid grid-cols-7 gap-[3px]">
      {cells.map((c) => (
        <span
          key={c.key}
          className="block rounded-[3px]"
          style={{
            width: 11,
            height: 11,
            background: c.filled ? "var(--color-success)" : "var(--color-neutral-200)",
          }}
        />
      ))}
    </div>
  );
}
