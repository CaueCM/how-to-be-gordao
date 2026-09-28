"use client";

import { useAppStore } from "@/lib/store";
import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Badge";
import { GoalRow } from "@/components/GoalRow";
import { EmptyState } from "@/components/EmptyState";
import { ChevronLeft } from "@/components/icons";
import { buildGoalVM, buildPlanVM, sortGoalsByDate } from "@/lib/business";

export function PlanDetailScreen() {
  const plans = useAppStore((s) => s.plans);
  const selectedPlanId = useAppStore((s) => s.selectedPlanId);
  const backToPlans = useAppStore((s) => s.backToPlans);
  const openWizard = useAppStore((s) => s.openWizard);
  const goalSearch = useAppStore((s) => s.goalSearch);
  const setGoalSearch = useAppStore((s) => s.setGoalSearch);
  const today = useAppStore((s) => s.today);

  const plan = plans.find((p) => p.id === selectedPlanId);
  if (!plan) return null;

  const planVM = buildPlanVM(plan);
  const goalsVM = sortGoalsByDate(plan.goals)
    .map((g) => buildGoalVM(g, today))
    .filter((g) => g.title.toLowerCase().includes(goalSearch.toLowerCase()));

  return (
    <Screen>
      <button onClick={backToPlans} className="flex items-center gap-1 text-[13px] font-medium text-[var(--color-neutral-600)]">
        <ChevronLeft size={16} strokeWidth={2.2} />
        Missões
      </button>

      <div>
        <h1 className="text-[21px] font-light text-[var(--color-text)]">{plan.name}</h1>
        <div className="mt-2">
          <Tag>
            {planVM.progressPct}% feito · {planVM.goalCount} pepinos
          </Tag>
        </div>
      </div>

      <Button block onClick={() => openWizard(plan.id)}>
        + Nova Missão
      </Button>

      {plan.goals.length > 0 && (
        <Input placeholder="Buscar meta..." value={goalSearch} onChange={(e) => setGoalSearch(e.target.value)} />
      )}

      {goalsVM.length > 0 ? (
        <div className="flex flex-col">
          {goalsVM.map((g) => (
            <GoalRow key={g.id} goal={g} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma meta por aqui"
          subtitle="Cria a primeira meta dessa missão e para de enrolar."
        />
      )}
    </Screen>
  );
}
