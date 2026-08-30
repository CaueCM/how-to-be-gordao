"use client";

import { useAppStore } from "@/lib/store";
import { IconBox } from "@/components/ui/IconBox";
import { GoalIconGlyph } from "@/components/icons";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/Badge";
import type { GoalViewModel } from "@/lib/types";

export function GoalRow({ goal }: { goal: GoalViewModel }) {
  const openGoal = useAppStore((s) => s.openGoal);
  return (
    <button
      onClick={() => openGoal(goal.id)}
      className="flex items-center gap-3 py-3 text-left w-full transition-colors duration-150 active:bg-[var(--color-neutral-100)]"
      style={{ borderBottom: "1px solid var(--color-divider)" }}
    >
      <IconBox size={36}>
        <GoalIconGlyph type={goal.type} size={16} strokeWidth={2.2} color="var(--color-text)" />
      </IconBox>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[var(--color-text)] truncate">{goal.title}</p>
        <p className="text-[11px] text-[var(--color-neutral-400)] truncate">
          {goal.dateLabel && (
            <span className="font-semibold text-[var(--color-text)]">{goal.dateLabel}</span>
          )}
          {goal.dateLabel && goal.subtitle ? " · " : ""}
          {goal.subtitle}
        </p>
        <div className="mt-1">
          <ProgressBar pct={goal.progressPct} height={4} />
        </div>
      </div>
      <StatusBadge label={goal.statusLabel} bg={goal.badgeBg} color={goal.badgeColor} />
    </button>
  );
}
