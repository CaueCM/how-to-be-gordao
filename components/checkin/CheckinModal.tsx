"use client";

import { useAppStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, FieldLabel } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

export function CheckinModal() {
  const checkinGoalId = useAppStore((s) => s.checkinGoalId);
  const findGoal = useAppStore((s) => s.findGoal);
  const checkinValue = useAppStore((s) => s.checkinValue);
  const checkinNote = useAppStore((s) => s.checkinNote);
  const checkinHabitDone = useAppStore((s) => s.checkinHabitDone);
  const checkinTaskDone = useAppStore((s) => s.checkinTaskDone);

  const closeCheckin = useAppStore((s) => s.closeCheckin);
  const setCheckinValue = useAppStore((s) => s.setCheckinValue);
  const setCheckinNote = useAppStore((s) => s.setCheckinNote);
  const setCheckinHabitDone = useAppStore((s) => s.setCheckinHabitDone);
  const setCheckinTaskDone = useAppStore((s) => s.setCheckinTaskDone);
  const submitCheckin = useAppStore((s) => s.submitCheckin);

  if (!checkinGoalId) return null;
  const goal = findGoal(checkinGoalId).goal;
  if (!goal) return null;

  return (
    <Modal
      title={`Registro — ${goal.title}`}
      onClose={closeCheckin}
      actions={
        <>
          <Button variant="ghost" onClick={closeCheckin}>
            Cancelar
          </Button>
          <Button onClick={submitCheckin}>Confirma</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {goal.type === "numeric" && (
          <div>
            <FieldLabel>Valor real ({goal.unit})</FieldLabel>
            <div className="mt-1">
              <Input type="number" value={checkinValue} onChange={(e) => setCheckinValue(e.target.value)} />
            </div>
          </div>
        )}

        {goal.type === "habit" && (
          <SegmentedControl
            value={checkinHabitDone ? "fiz" : "enrolei"}
            onChange={(v) => setCheckinHabitDone(v === "fiz")}
            options={[
              { value: "fiz", label: "Fiz" },
              { value: "enrolei", label: "Enrolei" },
            ]}
          />
        )}

        {goal.type === "task" && (
          <SegmentedControl
            value={checkinTaskDone ? "feito" : "nao_feito"}
            onChange={(v) => setCheckinTaskDone(v === "feito")}
            options={[
              { value: "feito", label: "Feito" },
              { value: "nao_feito", label: "Não feito" },
            ]}
          />
        )}

        <div>
          <FieldLabel>Nota (opcional, sem justificativa mole)</FieldLabel>
          <div className="mt-1">
            <Textarea value={checkinNote} onChange={(e) => setCheckinNote(e.target.value)} rows={3} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
