"use client";

import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      className={`min-h-[46px] w-full rounded-[999px] bg-[var(--surface-input)] px-[18px] text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-neutral-400)] outline-none ${className}`}
      {...rest}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      className={`min-h-[80px] w-full rounded-[22px] bg-[var(--surface-input)] px-[18px] py-3 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-neutral-400)] outline-none resize-none ${className}`}
      {...rest}
    />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children?: ReactNode;
}

export function Select({ className = "", children, ...rest }: SelectProps) {
  return (
    <select
      className={`min-h-[46px] w-full rounded-[999px] bg-[var(--surface-input)] px-[18px] text-[14px] text-[var(--color-text)] outline-none ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
      {children}
    </label>
  );
}
