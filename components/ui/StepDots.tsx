"use client";

export function StepDots({ total, step }: { total: number; step: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="block h-[3px] w-7 rounded-full transition-colors duration-200"
          style={{ background: i === step ? "var(--color-text)" : "var(--color-neutral-300)" }}
        />
      ))}
    </div>
  );
}
