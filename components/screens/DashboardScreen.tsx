"use client";

import { useSession } from "next-auth/react";
import { useAppStore } from "@/lib/store";
import { Screen, SectionLabel } from "@/components/ui/Screen";
import { PlanCard } from "@/components/PlanCard";
import { EmptyState } from "@/components/EmptyState";
import { DailyTaskList } from "@/components/DailyTaskList";
import { Button } from "@/components/ui/Button";
import { CalendarDisconnectedBanner, TodayCheckinCard, StreakHighlightCard } from "@/components/DashboardBits";
import { buildPlanVM, goalsDueToday } from "@/lib/business";
import type { HabitGoal } from "@/lib/types";

export function DashboardScreen() {
  const { data: session } = useSession();
  const plans = useAppStore((s) => s.plans);
  const emptyDemo = useAppStore((s) => s.emptyDemo);
  const toggleEmptyDemo = useAppStore((s) => s.toggleEmptyDemo);
  const today = useAppStore((s) => s.today);

  const hasPlans = !emptyDemo && plans.length > 0;
  const plansVM = plans.map((p) => buildPlanVM(p));
  const allGoals = plans.flatMap((p) => p.goals);

  const todayGoals = goalsDueToday(allGoals, today);
  const streakGoals = allGoals.filter((g): g is HabitGoal => g.type === "habit");

  return (
    <Screen>
      <div>
        <h1 className="text-[27px] font-light text-[var(--color-text)]">E aí, ainda vivo?</h1>
        <p className="mt-1 text-[13px] text-[var(--color-neutral-400)]">
          Resumo da sua bagunça. Vê se resolve algo hoje.
        </p>
      </div>

      {!session?.calendarConnected && <CalendarDisconnectedBanner />}

      <div className="flex flex-col gap-3">
        <SectionLabel>Suas missões</SectionLabel>
        {hasPlans ? (
          <div className="grid grid-cols-2 gap-4">
            {plansVM.map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nem uma missão criada, vagabundo"
            subtitle="Cria logo a primeira e para de enrolar."
            action={
              <Button className="mt-3" onClick={toggleEmptyDemo}>
                Sai desse modo vazio
              </Button>
            }
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>Lista de hoje</SectionLabel>
        <DailyTaskList />
      </div>

      {hasPlans && todayGoals.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionLabel>Prestação de contas de hoje</SectionLabel>
          <div className="flex flex-col gap-3">
            {todayGoals.map((g) => (
              <TodayCheckinCard key={g.id} goal={g} />
            ))}
          </div>
        </div>
      )}

      {hasPlans && streakGoals.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionLabel>Sequências (não fode isso)</SectionLabel>
          <div className="flex flex-col gap-3">
            {streakGoals.map((g) => (
              <StreakHighlightCard key={g.id} goal={g} />
            ))}
          </div>
        </div>
      )}
    </Screen>
  );
}
