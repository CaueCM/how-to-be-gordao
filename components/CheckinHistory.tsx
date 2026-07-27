"use client";

import { formatDate } from "@/lib/business";
import type { Goal } from "@/lib/types";

export function CheckinHistory({ goal }: { goal: Goal }) {
  const rows = goal.checkins.map((c, i) => {
    let text = "";
    if (goal.type === "numeric" && "value" in c) {
      text = `${c.value} ${goal.unit}${c.note ? ` — ${c.note}` : ""}`;
    } else if (goal.type === "habit" && "done" in c) {
      text = (c.done ? "Feito" : "Não feito") + (c.note ? ` — ${c.note}` : "");
    } else {
      text = ("note" in c && c.note) || "Check-in registrado";
    }
    return { key: i, date: formatDate(c.date), text };
  });

  return (
    <div className="flex flex-col rounded-[22px] bg-[var(--surface-card)] p-5">
      <h6 className="mb-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-500)]">
        Histórico de confissões
      </h6>
      {rows.length > 0 ? (
        rows.map((r) => (
          <div
            key={r.key}
            className="flex items-center gap-3 py-2 text-[12px] text-[var(--color-text)]"
            style={{ borderBottom: "1px solid var(--color-divider)" }}
          >
            <span className="text-[var(--color-neutral-400)]">{r.date}</span>
            <span>{r.text}</span>
          </div>
        ))
      ) : (
        <p className="py-2 text-[12px] text-[var(--color-neutral-400)]">Nada registrado ainda. Cadê você?</p>
      )}
    </div>
  );
}
