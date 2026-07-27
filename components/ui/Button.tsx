"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
  children?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-[999px] text-[13px] font-semibold tracking-[0.02em] transition-colors disabled:opacity-35 disabled:cursor-not-allowed";

const variantClass: Record<Variant, string> = {
  primary: "bg-[var(--color-text)] text-white hover:bg-black min-h-[44px] px-5 py-[11px]",
  secondary:
    "bg-[var(--surface-btn-secondary)] text-[var(--color-text)] hover:bg-white min-h-[44px] px-5 py-[11px]",
  ghost: "bg-transparent text-[var(--color-neutral-600)] font-medium hover:text-[var(--color-text)] min-h-[44px] px-3 py-[11px]",
  icon: "w-11 h-11 bg-[var(--surface-btn-secondary)] text-[var(--color-text)] hover:bg-white",
};

export function Button({ variant = "primary", block, className = "", children, ...rest }: ButtonProps) {
  return (
    <button
      className={`${base} ${variantClass[variant]} ${block ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
