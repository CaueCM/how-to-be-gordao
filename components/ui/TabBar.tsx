"use client";

import { useAppStore } from "@/lib/store";
import type { Screen } from "@/lib/types";
import { Home, Menu, Calendar, Settings } from "@/components/icons";

const TABS: { screen: Screen; label: string; Icon: typeof Home }[] = [
  { screen: "dashboard", label: "Início", Icon: Home },
  { screen: "plans", label: "Missões", Icon: Menu },
  { screen: "calendar", label: "Agenda", Icon: Calendar },
  { screen: "settings", label: "Ajustes", Icon: Settings },
];

export function TabBar() {
  const screen = useAppStore((s) => s.screen);
  const go = useAppStore((s) => s.go);

  const activeGroup: Screen[] = ["planDetail", "goalDetail"].includes(screen)
    ? ["plans"]
    : [screen];

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] flex"
      style={{
        background: "linear-gradient(to top, rgba(249,250,251,0.96), rgba(249,250,251,0.72))",
        backdropFilter: "blur(12px)",
      }}
    >
      {TABS.map(({ screen: s, label, Icon }) => {
        const active = activeGroup.includes(s);
        return (
          <button
            key={s}
            onClick={() => go(s)}
            className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[60px] active:scale-90"
            style={{
              color: active ? "var(--color-text)" : "var(--color-neutral-400)",
              transition: "color 200ms ease, transform 150ms ease",
            }}
          >
            <Icon size={18} strokeWidth={2.2} />
            <span className="text-[8px] font-semibold uppercase tracking-[0.18em]">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
