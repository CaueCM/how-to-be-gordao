"use client";

import { Check } from "@/components/icons";
import type { Subtask } from "@/lib/types";

export function SubtaskChecklist({
  subtasks,
  onToggle,
}: {
  subtasks: Subtask[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {subtasks.map((st) => (
        <button
          key={st.id}
          onClick={() => onToggle(st.id)}
          className="flex items-center gap-3 text-left transition-transform active:scale-[0.98]"
        >
          <span
            className="flex items-center justify-center rounded-[4px] transition-colors duration-200"
            style={{
              width: 18,
              height: 18,
              background: st.done ? "var(--color-success)" : "transparent",
              border: st.done ? "none" : "1px solid var(--hairline)",
              flexShrink: 0,
            }}
          >
            {st.done && <Check className="animate-pop-in" size={12} strokeWidth={3} color="#fff" />}
          </span>
          <span
            className="text-[13px] text-[var(--color-text)] transition-opacity duration-200"
            style={{
              textDecoration: st.done ? "line-through" : "none",
              opacity: st.done ? 0.55 : 1,
            }}
          >
            {st.text}
          </span>
        </button>
      ))}
    </div>
  );
}
