"use client";

import { signIn } from "next-auth/react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Zap } from "@/components/icons";
import type { Goal } from "@/lib/types";

function RowCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row items-center gap-3 rounded-[22px] bg-[var(--surface-card)] p-5">
      {children}
    </div>
  );
}

export function CalendarDisconnectedBanner() {
  return (
    <div className="flex items-center gap-3 rounded-[22px] bg-[var(--surface-card)] px-5 py-4">
      <AlertTriangle size={18} strokeWidth={2.2} color="var(--color-danger)" />
      <p className="flex-1 text-[12px] text-[var(--color-text)]">Calendar caiu, gênio. Nada sincroniza.</p>
      <Button variant="secondary" onClick={() => signIn("google", { callbackUrl: "/" })}>
        Reconecta
      </Button>
    </div>
  );
}

export function TodayCheckinCard({ goal }: { goal: Goal }) {
  const openCheckin = useAppStore((s) => s.openCheckin);
  const hint =
    goal.type === "numeric"
      ? `Registrar ${goal.unit}`
      : goal.type === "task"
        ? "Marcar sub-tarefas"
        : "Marcar feito hoje";
  return (
    <RowCard>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-[var(--color-text)] truncate">{goal.title}</p>
        <p className="text-[11px] text-[var(--color-neutral-400)]">{hint}</p>
      </div>
      <Button onClick={() => openCheckin(goal.id)}>Confessa</Button>
    </RowCard>
  );
}

export function StreakHighlightCard({ goal }: { goal: Goal & { type: "habit" } }) {
  const color = goal.streakCurrent > 0 ? "var(--color-success)" : "var(--color-neutral-500)";
  return (
    <RowCard>
      <Zap size={18} strokeWidth={2.2} color={color} />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-[var(--color-text)] truncate">{goal.title}</p>
        <p className="text-[11px] text-[var(--color-neutral-400)]">
          {goal.streakCurrent} dias seguidos · recorde {goal.streakBest}
        </p>
      </div>
    </RowCard>
  );
}
