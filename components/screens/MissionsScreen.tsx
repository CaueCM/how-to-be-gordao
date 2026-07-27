"use client";

import { useAppStore } from "@/lib/store";
import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PlanCard } from "@/components/PlanCard";
import { EmptyState } from "@/components/EmptyState";
import { buildPlanVM } from "@/lib/business";

export function MissionsScreen() {
  const plans = useAppStore((s) => s.plans);
  const emptyDemo = useAppStore((s) => s.emptyDemo);
  const planSearch = useAppStore((s) => s.planSearch);
  const setPlanSearch = useAppStore((s) => s.setPlanSearch);
  const openWizard = useAppStore((s) => s.openWizard);

  const hasPlans = !emptyDemo && plans.length > 0;
  const plansVM = plans
    .map((p) => buildPlanVM(p))
    .filter((p) => p.name.toLowerCase().includes(planSearch.toLowerCase()));

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <h1 className="text-[23px] font-light text-[var(--color-text)]">Missões</h1>
        <Button variant="secondary" onClick={() => openWizard(null)}>
          + Nova
        </Button>
      </div>

      {hasPlans && (
        <Input
          placeholder="Buscar missão..."
          value={planSearch}
          onChange={(e) => setPlanSearch(e.target.value)}
        />
      )}

      {hasPlans ? (
        <div className="grid grid-cols-2 gap-4">
          {plansVM.map((p) => (
            <PlanCard key={p.id} plan={p} iconSize={44} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nem uma missão criada ainda"
          subtitle="Missões agrupam suas metas por tema — saúde, leitura, trampo. Cria uma pra organizar a bagunça."
        />
      )}
    </Screen>
  );
}
