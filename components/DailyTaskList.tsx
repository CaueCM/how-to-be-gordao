"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Input } from "@/components/ui/Input";
import { Check, Plus, Trash } from "@/components/icons";

export function DailyTaskList() {
  const dailyTasks = useAppStore((s) => s.dailyTasks);
  const addDailyTask = useAppStore((s) => s.addDailyTask);
  const toggleDailyTask = useAppStore((s) => s.toggleDailyTask);
  const updateDailyTaskText = useAppStore((s) => s.updateDailyTaskText);
  const deleteDailyTask = useAppStore((s) => s.deleteDailyTask);

  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const doneCount = dailyTasks.filter((t) => t.done).length;

  function submitNew() {
    if (!newText.trim()) return;
    addDailyTask(newText);
    setNewText("");
  }

  function commitEdit(taskId: string) {
    if (draft.trim()) updateDailyTaskText(taskId, draft);
    setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-4 rounded-[22px] bg-[var(--surface-card)] p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-semibold text-[var(--color-text)]">O que tem pra hoje</p>
        {dailyTasks.length > 0 && (
          <span className="shrink-0 text-[11px] text-[var(--color-neutral-400)]">
            {doneCount}/{dailyTasks.length} feitos
          </span>
        )}
      </div>

      {dailyTasks.length === 0 && (
        <p className="text-[12px] text-[var(--color-neutral-400)]">
          Lista limpa. Anota aí o que precisa sair do papel hoje.
        </p>
      )}

      {dailyTasks.length > 0 && (
        <div className="flex flex-col">
          {dailyTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 py-2"
              style={{ borderBottom: "1px solid var(--color-divider)" }}
            >
              <button
                onClick={() => toggleDailyTask(task.id)}
                aria-label={task.done ? "Desmarcar" : "Marcar como feito"}
                className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] transition-transform active:scale-90"
                style={{
                  background: task.done ? "var(--color-success)" : "var(--surface-input)",
                }}
              >
                {task.done && <Check size={14} strokeWidth={3} color="#fff" />}
              </button>

              {editingId === task.id ? (
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => commitEdit(task.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit(task.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="min-h-[32px] px-3 text-[13px]"
                  aria-label="Texto da tarefa"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => {
                    setEditingId(task.id);
                    setDraft(task.text);
                  }}
                  className="min-w-0 flex-1 text-left text-[13px] text-[var(--color-text)]"
                  style={{
                    textDecoration: task.done ? "line-through" : "none",
                    color: task.done ? "var(--color-neutral-400)" : "var(--color-text)",
                  }}
                >
                  {task.text}
                </button>
              )}

              <button
                onClick={() => deleteDailyTask(task.id)}
                aria-label="Remover"
                className="shrink-0 p-1 text-[var(--color-neutral-400)] transition-transform active:scale-90"
              >
                <Trash size={14} strokeWidth={2.2} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitNew();
          }}
          placeholder="Adicionar item..."
          aria-label="Nova tarefa do dia"
          className="min-h-[40px] text-[13px]"
        />
        <button
          onClick={submitNew}
          disabled={!newText.trim()}
          aria-label="Adicionar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[999px] bg-[var(--color-text)] text-white transition-transform active:scale-90 disabled:opacity-30"
        >
          <Plus size={18} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
