"use client";

export function StatusBadge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span
      className="inline-block rounded-[10px] px-2 py-1 text-[10px] font-bold"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-[999px] bg-[var(--color-neutral-200)] px-[10px] py-1 text-[10px] font-semibold text-[var(--color-neutral-700)]">
      {children}
    </span>
  );
}
