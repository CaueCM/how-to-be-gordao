"use client";

import { useAppStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, FieldLabel } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Target, ListChecks, Zap, Calendar } from "@/components/icons";
import { computeWizardPreview } from "@/lib/business";

const TYPE_CARDS = [
  { type: "numeric" as const, Icon: Target, label: "Número", hint: "Peso, páginas, R$..." },
  { type: "task" as const, Icon: ListChecks, label: "Tarefa", hint: "Com prazo, sem choro" },
  { type: "habit" as const, Icon: Zap, label: "Hábito", hint: "Repete ou fica pra trás" },
];

const HABIT_FREQUENCIES = ["1x por semana", "2x por semana", "3x por semana", "5x por semana", "todos os dias"];

export function NewGoalWizard() {
  const wizardOpen = useAppStore((s) => s.wizardOpen);
  const wizardStep = useAppStore((s) => s.wizardStep);
  const wizardType = useAppStore((s) => s.wizardType);
  const wizardFields = useAppStore((s) => s.wizardFields);
  const wizardPlanId = useAppStore((s) => s.wizardPlanId);
  const plans = useAppStore((s) => s.plans);
  const today = useAppStore((s) => s.today);

  const closeWizard = useAppStore((s) => s.closeWizard);
  const wizardBack = useAppStore((s) => s.wizardBack);
  const wizardNext = useAppStore((s) => s.wizardNext);
  const wizardSetType = useAppStore((s) => s.wizardSetType);
  const updateWizardField = useAppStore((s) => s.updateWizardField);
  const setWizardPlan = useAppStore((s) => s.setWizardPlan);
  const wizardConfirm = useAppStore((s) => s.wizardConfirm);
  const wizardViewGoal = useAppStore((s) => s.wizardViewGoal);

  if (!wizardOpen) return null;

  const typeLabel =
    wizardType === "numeric" ? "Meta numérica" : wizardType === "task" ? "Tarefa com prazo" : "Hábito recorrente";

  if (wizardStep === 1) {
    return (
      <Modal title="Nova missão — qual é a treta?" onClose={closeWizard}>
        <div className="grid grid-cols-3 gap-3">
          {TYPE_CARDS.map(({ type, Icon, label, hint }) => (
            <button
              key={type}
              onClick={() => wizardSetType(type)}
              className="flex flex-col items-center gap-2 rounded-[22px] bg-[var(--color-neutral-100)] p-4 text-center"
            >
              <Icon size={20} strokeWidth={2.2} color="var(--color-text)" />
              <span className="text-[13px] font-semibold text-[var(--color-text)]">{label}</span>
              <span className="text-[10px] text-[var(--color-neutral-500)]">{hint}</span>
            </button>
          ))}
        </div>
      </Modal>
    );
  }

  if (wizardStep === 2) {
    return (
      <Modal
        title={typeLabel}
        onClose={closeWizard}
        actions={
          <>
            <Button variant="ghost" onClick={wizardBack}>
              Voltar
            </Button>
            <Button onClick={wizardNext} disabled={!wizardFields.title}>
              Avançar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <FieldLabel>Missão</FieldLabel>
            <div className="mt-1">
              <Select value={wizardPlanId ?? ""} onChange={(e) => setWizardPlan(e.target.value)}>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <FieldLabel>Título</FieldLabel>
            <div className="mt-1">
              <Input
                value={wizardFields.title}
                onChange={(e) => updateWizardField("title", e.target.value)}
                placeholder="Nome da meta"
              />
            </div>
          </div>

          {wizardType === "numeric" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <FieldLabel>Início</FieldLabel>
                  <div className="mt-1">
                    <Input
                      type="number"
                      value={wizardFields.startValue}
                      onChange={(e) => updateWizardField("startValue", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Alvo</FieldLabel>
                  <div className="mt-1">
                    <Input
                      type="number"
                      value={wizardFields.targetValue}
                      onChange={(e) => updateWizardField("targetValue", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Unidade</FieldLabel>
                  <div className="mt-1">
                    <Input
                      value={wizardFields.unit}
                      onChange={(e) => updateWizardField("unit", e.target.value)}
                      placeholder="kg"
                    />
                  </div>
                </div>
              </div>
              <div>
                <FieldLabel>Prazo</FieldLabel>
                <div className="mt-1">
                  <Input
                    type="date"
                    value={wizardFields.targetDate}
                    onChange={(e) => updateWizardField("targetDate", e.target.value)}
                  />
                </div>
              </div>
              <SegmentedControl
                value={wizardFields.frequency}
                onChange={(v) => updateWizardField("frequency", v)}
                options={[
                  { value: "daily", label: "Todo dia" },
                  { value: "weekly", label: "Toda semana" },
                ]}
              />
            </>
          )}

          {wizardType === "task" && (
            <>
              <div>
                <FieldLabel>Prazo</FieldLabel>
                <div className="mt-1">
                  <Input
                    type="date"
                    value={wizardFields.taskDate}
                    onChange={(e) => updateWizardField("taskDate", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Sub-tarefas (uma por linha, se tiver saco)</FieldLabel>
                <div className="mt-1">
                  <Textarea
                    value={wizardFields.subtasksText}
                    onChange={(e) => updateWizardField("subtasksText", e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </>
          )}

          {wizardType === "habit" && (
            <div>
              <FieldLabel>Frequência</FieldLabel>
              <div className="mt-1">
                <Select
                  value={wizardFields.habitFrequency}
                  onChange={(e) => updateWizardField("habitFrequency", e.target.value)}
                >
                  {HABIT_FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  }

  if (wizardStep === 3) {
    const { preview, eventsPreview } = computeWizardPreview(wizardType, wizardFields, today);
    return (
      <Modal
        title="Isso é o que te espera"
        onClose={closeWizard}
        actions={
          <>
            <Button variant="ghost" onClick={wizardBack}>
              Voltar
            </Button>
            <Button onClick={wizardConfirm}>Confirmar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-[14px] text-[var(--color-text)]">{preview}</p>
          {eventsPreview && (
            <div className="flex items-center gap-3 rounded-[22px] bg-[var(--color-neutral-100)] p-4">
              <Calendar size={18} strokeWidth={2.2} color="var(--color-text)" />
              <span className="text-[12px] text-[var(--color-text)]">{eventsPreview}</span>
            </div>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Missão criada, agora vai"
      onClose={closeWizard}
      actions={
        <>
          <Button variant="ghost" onClick={closeWizard}>
            Fechar
          </Button>
          <Button onClick={wizardViewGoal}>Ver missão</Button>
        </>
      }
    >
      <p className="text-[14px] text-[var(--color-text)]">
        Já quebrei tudo em pedaço pequeno e lotei seu Google Calendar. Sem desculpa agora.
      </p>
    </Modal>
  );
}
