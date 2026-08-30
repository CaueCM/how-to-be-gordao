"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatDate } from "@/lib/business";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Goal } from "@/lib/types";

export function CheckinHistory({ goal }: { goal: Goal }) {
  const updateCheckin = useAppStore((s) => s.updateCheckin);
  const deleteCheckin = useAppStore((s) => s.deleteCheckin);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [draftDone, setDraftDone] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function startEdit(c: Goal["checkins"][number]) {
    setEditingId(c.id);
    setConfirmDeleteId(null);
    setDraftValue(goal.type === "numeric" && "value" in c ? String(c.value) : "");
    setDraftDone(goal.type === "habit" && "done" in c ? c.done : false);
    setDraftNote(c.note ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setConfirmDeleteId(null);
  }

  function saveEdit(checkinId: string) {
    const updates: { value?: number; done?: boolean; note?: string } = { note: draftNote };
    if (goal.type === "numeric") {
      const parsed = Number(draftValue.replace(",", "."));
      if (Number.isNaN(parsed)) return;
      updates.value = parsed;
    } else if (goal.type === "habit") {
      updates.done = draftDone;
    }
    updateCheckin(goal.id, checkinId, updates);
    setEditingId(null);
  }

  function describe(c: Goal["checkins"][number]): string {
    if (goal.type === "numeric" && "value" in c) {
      return `${c.value} ${goal.unit}${c.note ? ` — ${c.note}` : ""}`;
    }
    if (goal.type === "habit" && "done" in c) {
      return (c.done ? "Feito" : "Não feito") + (c.note ? ` — ${c.note}` : "");
    }
    return c.note || "Check-in registrado";
  }

  return (
    <div className="flex flex-col rounded-[22px] bg-[var(--surface-card)] p-5">
      <h6 className="mb-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-500)]">
        Histórico de confissões
      </h6>

      {goal.checkins.length === 0 && (
        <p className="py-2 text-[12px] text-[var(--color-neutral-400)]">Nada registrado ainda. Cadê você?</p>
      )}

      {goal.checkins.map((c) =>
        editingId === c.id ? (
          <div key={c.id} className="flex flex-col gap-3 py-3" style={{ borderBottom: "1px solid var(--color-divider)" }}>
            <span className="text-[11px] font-semibold text-[var(--color-neutral-500)]">{formatDate(c.date)}</span>

            {goal.type === "numeric" && (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={draftValue}
                  onChange={(e) => setDraftValue(e.target.value)}
                  aria-label="Valor"
                  autoFocus
                />
                <span className="shrink-0 text-[12px] text-[var(--color-neutral-400)]">{goal.unit}</span>
              </div>
            )}

            {goal.type === "habit" && (
              <div className="flex gap-2">
                <Button variant={draftDone ? "primary" : "secondary"} onClick={() => setDraftDone(true)}>
                  Feito
                </Button>
                <Button variant={!draftDone ? "primary" : "secondary"} onClick={() => setDraftDone(false)}>
                  Não feito
                </Button>
              </div>
            )}

            <Input
              type="text"
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              placeholder="Observação (opcional)"
              aria-label="Observação"
            />

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => saveEdit(c.id)}>Salvar</Button>
              <Button variant="secondary" onClick={cancelEdit}>Cancelar</Button>
              {confirmDeleteId === c.id ? (
                <Button
                  variant="secondary"
                  className="text-[var(--color-danger)]"
                  onClick={() => {
                    deleteCheckin(goal.id, c.id);
                    cancelEdit();
                  }}
                >
                  Confirmar exclusão
                </Button>
              ) : (
                <Button variant="ghost" className="text-[var(--color-danger)]" onClick={() => setConfirmDeleteId(c.id)}>
                  Excluir
                </Button>
              )}
            </div>
          </div>
        ) : (
          <button
            key={c.id}
            onClick={() => startEdit(c)}
            className="flex items-center gap-3 py-2 text-left text-[12px] text-[var(--color-text)] transition-colors duration-150 active:bg-[var(--color-neutral-100)]"
            style={{ borderBottom: "1px solid var(--color-divider)" }}
          >
            <span className="shrink-0 text-[var(--color-neutral-400)]">{formatDate(c.date)}</span>
            <span className="flex-1 min-w-0 truncate">{describe(c)}</span>
            <span className="shrink-0 text-[10px] text-[var(--color-neutral-400)]">editar</span>
          </button>
        )
      )}
    </div>
  );
}
