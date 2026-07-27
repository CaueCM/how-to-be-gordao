"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function EmptyState({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <Card className="items-center text-center py-8">
      <h3 className="text-[16px] font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="text-[13px] text-[var(--color-neutral-500)]">{subtitle}</p>
      {action}
    </Card>
  );
}
