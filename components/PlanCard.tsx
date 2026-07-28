"use client";

import { useAppStore } from "@/lib/store";
import { IconBox } from "@/components/ui/IconBox";
import { PlanIconGlyph } from "@/components/icons";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tag } from "@/components/ui/Badge";
import type { PlanViewModel } from "@/lib/types";

export function PlanCard({ plan, iconSize = 40 }: { plan: PlanViewModel; iconSize?: number }) {
  const openPlan = useAppStore((s) => s.openPlan);
  return (
    <button
      onClick={() => openPlan(plan.id)}
      className="flex flex-col items-start gap-2 rounded-[22px] bg-[var(--surface-card)] p-5 text-left transition-transform duration-150 active:scale-[0.97]"
    >
      <IconBox size={iconSize}>
        <PlanIconGlyph icon={plan.icon} size={iconSize === 40 ? 18 : 20} strokeWidth={2.2} color="var(--color-text)" />
      </IconBox>
      <h3 className="mt-2 text-[14px] font-semibold text-[var(--color-text)]">{plan.name}</h3>
      <p className="text-[11px] text-[var(--color-neutral-400)]">{plan.goalCount} pepinos</p>
      <div className="w-full">
        <ProgressBar pct={plan.progressPct} />
      </div>
      <Tag>{plan.progressPct}% feito</Tag>
    </button>
  );
}
