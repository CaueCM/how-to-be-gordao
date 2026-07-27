"use client";

import type { ReactNode } from "react";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex flex-col gap-6 px-5 pt-5"
      style={{ paddingBottom: 148 }}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h6 className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-500)]">
      {children}
    </h6>
  );
}
