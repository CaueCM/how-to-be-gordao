"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { ChevronLeft, Pencil, Trash } from "@/components/icons";
import { buildChart, buildGoalVM, buildHeatmap, formatDate } from "@/lib/business";
import { PromiseVsRealityChart } from "@/components/PromiseVsRealityChart";
import { HabitHeatmap } from "@/components/HabitHeatmap";
import { SubtaskChecklist } from "@/components/SubtaskChecklist";
import { CheckinHistory } from "@/components/CheckinHistory";

export function GoalDetailScreen() {
  const selectedGoalId = useAppStore((s) => s.selectedGoalId);
  const findGoal = useAppStore((s) => s.findGoal);
  const backToPlan = useAppStore((s) => s.backToPlan);
  const openCheckin = useAppStore((s) => s.openCheckin);
  const toggleSubtask = useAppStore((s) => s.toggleSubtask);
  const deleteGoal = useAppStore((s) => s.deleteGoal);
  const openEditGoal = useAppStore((s) => s.openEditGoal);
  const today = useAppStore((s) => s.today);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const goal = selectedGoalId ? findGoal(selectedGoalId).goal : null;
  if (!goal) return null;

  const vm = buildGoalVM(goal, today);

  return (
    <Screen>
      <button onClick={backToPlan} className="flex items-center gap-1 text-[13px] font-medium text-[var(--color-neutral-600)]">
        <ChevronLeft size={16} strokeWidth={2.2} />
        Voltar
      </button>

      <div>
        <h1 className="text-[20px] font-light text-[var(--color-text)]">{goal.title}</h1>
        <div className="mt-2">
          <StatusBadge label={vm.statusLabel} bg={vm.badgeBg} color={vm.badgeColor} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button className="flex-1" onClick={() => openCheckin(goal.id)}>
          Registrar progresso
        </Button>
        <Button variant="icon" aria-label="Editar" onClick={() => openEditGoal(goal.id)}>
          <Pencil size={16} strokeWidth={2.2} />
        </Button>
        <Button variant="icon" aria-label="Excluir" onClick={() => setConfirmingDelete(true)}>
          <Trash size={16} strokeWidth={2.2} />
        </Button>
      </div>

      {confirmingDelete && (
        <Modal
          title="Excluir de vez?"
          onClose={() => setConfirmingDelete(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
                Cancelar
              </Button>
              <Button onClick={() => deleteGoal(goal.id)}>Excluir</Button>
            </>
          }
        >
          <p className="text-[14px] text-[var(--color-text)]">
            {`"${goal.title}" some pra sempre. Não tem volta.`}
          </p>
        </Modal>
      )}

      {goal.type === "numeric" && (
        <>
          <div className="flex flex-col items-center text-center" style={{ paddingTop: 38, paddingBottom: 28 }}>
            <span className="text-[46px] font-light leading-none tracking-[-0.035em] text-[var(--color-text)]">
              {goal.currentValue} / {goal.targetValue} {goal.unit}
            </span>
            <span className="mt-2 text-[12px] text-[var(--color-neutral-400)]">
              prazo {formatDate(goal.targetDate)}
            </span>
          </div>
          <div>
            <h6 className="mb-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-500)]">
              Promessa vs. realidade
            </h6>
            <PromiseVsRealityChart chart={buildChart(goal, today)} />
          </div>
        </>
      )}

      {goal.type === "habit" && (
        <div className="flex flex-col gap-3 rounded-[22px] bg-[var(--surface-card)] p-5">
          <h6 className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-500)]">
            Mapa da preguiça
          </h6>
          <HabitHeatmap cells={buildHeatmap(goal)} />
          <p className="text-[12px] text-[var(--color-neutral-500)]">
            {goal.streakCurrent} dias seguidos (recorde {goal.streakBest}) · meta: {goal.targetFrequency}
          </p>
        </div>
      )}

      {goal.type === "task" && (
        <div className="flex flex-col gap-4 rounded-[22px] bg-[var(--surface-card)] p-5">
          <h6 className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-500)]">
            Tarefinhas · prazo {formatDate(goal.targetDate)}
          </h6>
          <SubtaskChecklist subtasks={goal.subtasks} onToggle={(id) => toggleSubtask(goal.id, id)} />
        </div>
      )}

      <CheckinHistory goal={goal} />
    </Screen>
  );
}
