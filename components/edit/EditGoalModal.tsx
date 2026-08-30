"use client";

import { useState } from "react";
import { useAppStore, useGoal } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, FieldLabel } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Trash, Plus } from "@/components/icons";
import { HABIT_FREQUENCIES } from "@/components/wizard/NewGoalWizard";

export function EditGoalModal() {
  const editGoalId = useAppStore((s) => s.editGoalId);
  const editFields = useAppStore((s) => s.editFields);
  const closeEditGoal = useAppStore((s) => s.closeEditGoal);
  const updateEditField = useAppStore((s) => s.updateEditField);
  const addEditSubtask = useAppStore((s) => s.addEditSubtask);
  const updateEditSubtaskText = useAppStore((s) => s.updateEditSubtaskText);
  const removeEditSubtask = useAppStore((s) => s.removeEditSubtask);
  const submitGoalEdit = useAppStore((s) => s.submitGoalEdit);

  const [newSubtaskText, setNewSubtaskText] = useState("");

  const goal = useGoal(editGoalId);
  if (!editGoalId || !goal) return null;

  const handleAddSubtask = () => {
    const text = newSubtaskText.trim();
    if (!text) return;
    addEditSubtask(text);
    setNewSubtaskText("");
  };

  return (
    <Modal
      title={`Editar — ${goal.title}`}
      onClose={closeEditGoal}
      actions={
        <>
          <Button variant="ghost" onClick={closeEditGoal}>
            Cancelar
          </Button>
          <Button onClick={submitGoalEdit} disabled={!editFields.title}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <FieldLabel>Título</FieldLabel>
          <div className="mt-1">
            <Input value={editFields.title} onChange={(e) => updateEditField("title", e.target.value)} />
          </div>
        </div>

        {goal.type === "numeric" && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <FieldLabel>Início</FieldLabel>
                <div className="mt-1">
                  <Input
                    type="number"
                    value={editFields.startValue}
                    onChange={(e) => updateEditField("startValue", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Alvo</FieldLabel>
                <div className="mt-1">
                  <Input
                    type="number"
                    value={editFields.targetValue}
                    onChange={(e) => updateEditField("targetValue", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Unidade</FieldLabel>
                <div className="mt-1">
                  <Input value={editFields.unit} onChange={(e) => updateEditField("unit", e.target.value)} />
                </div>
              </div>
            </div>
            <div>
              <FieldLabel>Prazo</FieldLabel>
              <div className="mt-1">
                <Input
                  type="date"
                  value={editFields.targetDate}
                  onChange={(e) => updateEditField("targetDate", e.target.value)}
                />
              </div>
            </div>
            <SegmentedControl
              value={editFields.frequency}
              onChange={(v) => updateEditField("frequency", v)}
              options={[
                { value: "daily", label: "Todo dia" },
                { value: "weekly", label: "Toda semana" },
              ]}
            />
          </>
        )}

        {goal.type === "task" && (
          <>
            <div>
              <FieldLabel>Prazo</FieldLabel>
              <div className="mt-1">
                <Input
                  type="date"
                  value={editFields.targetDate}
                  onChange={(e) => updateEditField("targetDate", e.target.value)}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Sub-tarefas</FieldLabel>
              <div className="mt-2 flex flex-col gap-2">
                {editFields.subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2">
                    <Input value={st.text} onChange={(e) => updateEditSubtaskText(st.id, e.target.value)} />
                    <Button variant="icon" aria-label="Remover" onClick={() => removeEditSubtask(st.id)}>
                      <Trash size={14} strokeWidth={2.2} />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Nova sub-tarefa"
                  />
                  <Button variant="icon" aria-label="Adicionar" onClick={handleAddSubtask}>
                    <Plus size={14} strokeWidth={2.2} />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {goal.type === "habit" && (
          <div>
            <FieldLabel>Frequência</FieldLabel>
            <div className="mt-1">
              <Select
                value={editFields.targetFrequency}
                onChange={(e) => updateEditField("targetFrequency", e.target.value)}
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
