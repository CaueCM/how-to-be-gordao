"use client";

import type { ReactNode } from "react";

export function IconBox({ children, size = 40 }: { children: ReactNode; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-[10px]"
      style={{ width: size, height: size, background: "var(--color-neutral-100)" }}
    >
      {children}
    </div>
  );
}
