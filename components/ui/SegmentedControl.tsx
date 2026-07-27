"use client";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="flex items-center gap-[18px]">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              active
                ? "text-[15px] font-bold text-[var(--color-text)]"
                : "text-[15px] font-normal text-[var(--color-neutral-400)]"
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
