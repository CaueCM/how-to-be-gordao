"use client";

export function ProgressBar({ pct, height = 5 }: { pct: number; height?: number }) {
  return (
    <div
      className="w-full rounded-[999px] bg-[var(--color-neutral-200)]"
      style={{ height }}
    >
      <div
        className="rounded-[999px] bg-[var(--color-text)] transition-[width] duration-500 ease-out"
        style={{ height, width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}
