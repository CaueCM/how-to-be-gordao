"use client";

import { Plus } from "@/components/icons";

export function Fab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Nova meta"
      className="fixed z-10 flex items-center justify-center rounded-full bg-[var(--color-text)] text-white transition-transform duration-150 active:scale-90 animate-pop-in"
      style={{ width: 52, height: 52, bottom: 76, right: "max(20px, calc(50% - 195px))" }}
    >
      <Plus size={24} strokeWidth={2.2} />
    </button>
  );
}
