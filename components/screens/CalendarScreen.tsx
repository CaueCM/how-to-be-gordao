"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useAppStore } from "@/lib/store";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Check, AlertTriangle, ChevronLeft } from "@/components/icons";
import { buildCalendarDays, buildWeekDays, formatMonthYear } from "@/lib/business";

const WEEKDAY_HEADER = ["D", "S", "T", "Q", "Q", "S", "S"];

export function CalendarScreen() {
  const { data: session } = useSession();
  const calendarConnected = !!session?.calendarConnected;
  const calendarViewMode = useAppStore((s) => s.calendarViewMode);
  const setCalendarViewMode = useAppStore((s) => s.setCalendarViewMode);
  const openGoal = useAppStore((s) => s.openGoal);
  const plans = useAppStore((s) => s.plans);
  const today = useAppStore((s) => s.today);

  const todayDate = new Date(`${today}T00:00:00`);
  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const days = buildCalendarDays(plans, viewYear, viewMonth, today);
  const weekDays = buildWeekDays(plans, today);
  const weekAgenda = weekDays.flatMap((d) => d.events.map((e) => ({ ...e, dayLabel: d.day })));

  return (
    <Screen>
      <h1 className="text-[23px] font-light text-[var(--color-text)]">Agenda</h1>

      <SegmentedControl
        value={calendarViewMode}
        onChange={setCalendarViewMode}
        options={[
          { value: "month", label: "Mês" },
          { value: "week", label: "Semana" },
        ]}
      />

      <div className="flex items-center gap-2">
        {calendarConnected ? (
          <Check size={16} strokeWidth={2.2} color="var(--color-success)" />
        ) : (
          <AlertTriangle size={16} strokeWidth={2.2} color="var(--color-danger)" />
        )}
        <span className="flex-1 text-[12px] text-[var(--color-text)]">
          {calendarConnected ? "Sincronizado com o Google Calendar" : "Google Calendar desconectado"}
        </span>
        {!calendarConnected && (
          <Button variant="secondary" onClick={() => signIn("google", { callbackUrl: "/" })}>
            Reconecta
          </Button>
        )}
      </div>

      {calendarViewMode === "month" ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={goPrevMonth}
              aria-label="Mês anterior"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-90"
            >
              <ChevronLeft size={16} strokeWidth={2.2} color="var(--color-text)" />
            </button>
            <span className="text-[13px] font-semibold capitalize text-[var(--color-text)]">
              {formatMonthYear(viewYear, viewMonth)}
            </span>
            <button
              onClick={goNextMonth}
              aria-label="Próximo mês"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-90"
              style={{ transform: "rotate(180deg)" }}
            >
              <ChevronLeft size={16} strokeWidth={2.2} color="var(--color-text)" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAY_HEADER.map((w, i) => (
              <div key={i} className="text-center text-[10px]" style={{ opacity: 0.5 }}>
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => (
              <div
                key={d.key}
                className="flex flex-col gap-1 rounded-[14px] p-1"
                style={{
                  minHeight: 56,
                  background: d.day ? "rgba(255,255,255,0.6)" : "transparent",
                  border: `1px solid ${d.borderColor}`,
                }}
              >
                {d.day && <span className="text-[10px] text-[var(--color-text)]">{d.day}</span>}
                {d.events.map((e, i) => (
                  <button
                    key={i}
                    onClick={() => openGoal(e.goalId)}
                    className="truncate rounded-[999px] px-1 text-[9px]"
                    style={{ background: e.bg, color: e.color }}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d) => (
              <div
                key={d.key}
                className="flex flex-col gap-1 rounded-[14px] p-1"
                style={{
                  minHeight: 90,
                  background: "rgba(255,255,255,0.6)",
                  border: `1px solid ${d.borderColor}`,
                }}
              >
                <span className="text-[10px] text-[var(--color-text)]">
                  {d.weekdayLabel} {d.day}
                </span>
                {d.events.map((e, i) => (
                  <button
                    key={i}
                    onClick={() => openGoal(e.goalId)}
                    className="truncate rounded-[999px] px-1 text-[9px]"
                    style={{ background: e.bg, color: e.color }}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-[22px] bg-[var(--surface-card)] p-5">
            <h6 className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-500)]">
              Agenda da semana
            </h6>
            {weekAgenda.length > 0 ? (
              weekAgenda.map((e, i) => (
                <button
                  key={i}
                  onClick={() => openGoal(e.goalId)}
                  className="text-left text-[12px] text-[var(--color-text)]"
                >
                  Dia {e.dayLabel} — {e.label}
                </button>
              ))
            ) : (
              <p className="text-[12px] text-[var(--color-neutral-400)]">Nada marcado essa semana.</p>
            )}
          </div>
        </div>
      )}
    </Screen>
  );
}
