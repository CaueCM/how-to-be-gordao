import type {
  Goal,
  GoalStatus,
  GoalViewModel,
  HabitGoal,
  NumericGoal,
  Plan,
  PlanViewModel,
  TaskGoal,
} from "./types";
import { isHabitCheckpointDay } from "./habitSchedule";

const MONTHS_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

const MONTHS_FULL_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function formatMonthYear(year: number, month: number): string {
  return `${MONTHS_FULL_PT[month]} de ${year}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86400000
  );
}

export function formatDate(d: string): string {
  const dt = new Date(`${d}T00:00:00`);
  return `${dt.getDate()} ${MONTHS_PT[dt.getMonth()]}`;
}

export function clamp(min: number, max: number, v: number): number {
  return Math.max(min, Math.min(max, v));
}

function isNumeric(g: Goal): g is NumericGoal {
  return g.type === "numeric";
}
function isTask(g: Goal): g is TaskGoal {
  return g.type === "task";
}
function isHabit(g: Goal): g is HabitGoal {
  return g.type === "habit";
}

export function numericStatus(goal: NumericGoal, today: string): GoalStatus {
  const reached =
    goal.targetValue >= goal.startValue
      ? goal.currentValue >= goal.targetValue
      : goal.currentValue <= goal.targetValue;
  if (reached) return "concluida";
  if (today > goal.targetDate) return "atrasada";
  return "no_prazo";
}

export function taskStatus(goal: TaskGoal, today: string): GoalStatus {
  const allDone = goal.subtasks.length
    ? goal.subtasks.every((s) => s.done)
    : goal.forceDone;
  if (allDone) return "concluida";
  if (today > goal.targetDate) return "atrasada";
  return "pendente";
}

export function habitStatus(goal: HabitGoal): GoalStatus {
  return goal.streakCurrent > 0 ? "ativa" : "quebrada";
}

export function goalStatus(goal: Goal, today: string): GoalStatus {
  if (isNumeric(goal)) return numericStatus(goal, today);
  if (isTask(goal)) return taskStatus(goal, today);
  return habitStatus(goal);
}

export function goalProgressPct(goal: Goal): number {
  if (isNumeric(goal)) {
    const span = goal.targetValue - goal.startValue;
    const done = goal.currentValue - goal.startValue;
    const pct = span === 0 ? 100 : Math.round((done / span) * 100);
    return clamp(0, 100, pct);
  }
  if (isTask(goal)) {
    if (!goal.subtasks.length) return goal.forceDone ? 100 : 0;
    const done = goal.subtasks.filter((s) => s.done).length;
    return Math.round((done / goal.subtasks.length) * 100);
  }
  return clamp(0, 100, Math.round((goal.streakCurrent / Math.max(goal.streakBest, 8)) * 100));
}

export function planProgressPct(plan: Plan): number {
  if (!plan.goals.length) return 0;
  return Math.round(
    plan.goals.reduce((s, g) => s + goalProgressPct(g), 0) / plan.goals.length
  );
}

export function buildGoalVM(goal: Goal, today: string): GoalViewModel {
  const status = goalStatus(goal, today);
  const pct = goalProgressPct(goal);
  let subtitle = "";
  let statusLabel = "";
  let badgeBg = "";
  let badgeColor = "";

  if (isNumeric(goal)) subtitle = `${goal.currentValue} / ${goal.targetValue} ${goal.unit}`;
  else if (isTask(goal))
    subtitle = goal.subtasks.length
      ? `${goal.subtasks.filter((s) => s.done).length}/${goal.subtasks.length} sub-tarefas`
      : "Sem sub-tarefas";
  else subtitle = `${goal.streakCurrent} dias seguidos (recorde ${goal.streakBest})`;

  if (status === "concluida") {
    statusLabel = "Resolvido";
    badgeBg = "var(--color-success)";
    badgeColor = "#fff";
  } else if (status === "atrasada") {
    const targetDate = isNumeric(goal) || isTask(goal) ? goal.targetDate : "";
    const late = daysBetween(targetDate, today);
    statusLabel = `${late}d atrasado, cadê você`;
    badgeBg = "var(--color-danger)";
    badgeColor = "#fff";
  } else if (status === "ativa") {
    statusLabel = "Rolando liso";
    badgeBg = "var(--color-success-tint)";
    badgeColor = "var(--color-success)";
  } else if (status === "quebrada") {
    statusLabel = "Zerou tudo, parabéns";
    badgeBg = "var(--color-danger-tint)";
    badgeColor = "var(--color-danger)";
  } else {
    statusLabel = "Ainda na cola";
    badgeBg = "var(--color-neutral-200)";
    badgeColor = "var(--color-text)";
  }

  return {
    id: goal.id,
    title: goal.title,
    type: goal.type,
    unit: isNumeric(goal) ? goal.unit : "",
    isNumeric: isNumeric(goal),
    isTask: isTask(goal),
    isHabit: isHabit(goal),
    progressPct: pct,
    subtitle,
    statusLabel,
    badgeBg,
    badgeColor,
    dateLabel: isNumeric(goal) || isTask(goal) ? formatDate(goal.targetDate) : "",
    targetFrequencyLabel: isHabit(goal) ? goal.targetFrequency : "",
  };
}

export function buildPlanVM(plan: Plan): PlanViewModel {
  return {
    id: plan.id,
    name: plan.name,
    icon: plan.icon,
    progressPct: planProgressPct(plan),
    goalCount: plan.goals.length,
  };
}

export interface ChartData {
  expectedPoints: string;
  actualPoints: string;
}

export function buildChart(goal: NumericGoal, today: string): ChartData {
  const start = new Date(`${goal.planStartDate}T00:00:00`);
  const end = new Date(`${goal.targetDate}T00:00:00`);
  const totalMs = end.getTime() - start.getTime() || 1;
  const W = 380;
  const H = 160;
  const pad = 20;
  const xFor = (d: string) =>
    pad + ((new Date(`${d}T00:00:00`).getTime() - start.getTime()) / totalMs) * (W - 2 * pad);
  const yRange = Math.abs(goal.targetValue - goal.startValue) || 1;
  const yFor = (v: number) =>
    H - pad - (Math.abs(v - goal.startValue) / yRange) * (H - 2 * pad);

  const expectedPoints = `${pad},${yFor(goal.startValue).toFixed(1)} ${W - pad},${yFor(goal.targetValue).toFixed(1)}`;

  const sorted = [...goal.checkins].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const pts = [
    { date: goal.planStartDate, value: goal.startValue },
    ...sorted,
    { date: today, value: goal.currentValue },
  ];
  const actualPoints = pts.map((p) => `${xFor(p.date).toFixed(1)},${yFor(p.value).toFixed(1)}`).join(" ");

  return { expectedPoints, actualPoints };
}

export interface HeatmapCell {
  key: number;
  filled: boolean;
}

export function buildHeatmap(goal: HabitGoal): HeatmapCell[] {
  const days = 70;
  const cells: HeatmapCell[] = [];
  for (let i = 0; i < days; i++) {
    const idx = days - 1 - i;
    let filled: boolean;
    if (idx < goal.streakCurrent) filled = true;
    else if (idx === goal.streakCurrent) filled = false;
    else filled = (i * 13 + idx) % 5 !== 0;
    cells.push({ key: i, filled });
  }
  return cells;
}

export interface CalendarEvent {
  label: string;
  goalId: string;
  bg: string;
  color: string;
}

export interface CalendarDay {
  key: string;
  day: number | null;
  events: CalendarEvent[];
  inWeek: boolean;
  borderColor: string;
  weekdayLabel: string;
}

const TONE_STYLE: Record<string, [string, string]> = {
  accent: ["var(--color-neutral-200)", "var(--color-text)"],
  accent2: ["var(--color-success-tint)", "var(--color-success)"],
  done: ["var(--color-success)", "#fff"],
  late: ["var(--color-danger)", "#fff"],
};

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function toneFor(tone: keyof typeof TONE_STYLE): { bg: string; color: string } {
  const [bg, color] = TONE_STYLE[tone];
  return { bg, color };
}

function isNumericCheckpoint(goal: NumericGoal, dateIso: string): boolean {
  if (dateIso < goal.planStartDate || dateIso > goal.targetDate) return false;
  if (goal.frequency === "daily") return true;
  const diff = daysBetween(goal.planStartDate, dateIso);
  return diff >= 0 && diff % 7 === 0;
}

function eventsForDate(goals: Goal[], dateIso: string, today: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const g of goals) {
    if (isNumeric(g) && isNumericCheckpoint(g, dateIso)) {
      const hasCheckin = g.checkins.some((c) => c.date === dateIso);
      const tone = hasCheckin ? "done" : dateIso < today ? "late" : "accent";
      events.push({ label: `Confessar: ${g.title}`, goalId: g.id, ...toneFor(tone) });
    } else if (isTask(g) && dateIso === g.targetDate) {
      const concluded = taskStatus(g, today) === "concluida";
      const tone = concluded ? "done" : dateIso < today ? "late" : "accent";
      events.push({ label: `Prazo: ${g.title}`, goalId: g.id, ...toneFor(tone) });
    } else if (isHabit(g) && isHabitCheckpointDay(g.targetFrequency, dateIso)) {
      const hasCheckin = g.checkins.some((c) => c.date === dateIso);
      const tone = hasCheckin ? "done" : dateIso < today ? "late" : "accent2";
      events.push({ label: `Hábito: ${g.title}`, goalId: g.id, ...toneFor(tone) });
    }
  }
  return events;
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function buildCalendarDays(plans: Plan[], year: number, month: number, today: string): CalendarDay[] {
  const goals = plans.flatMap((p) => p.goals);
  const leading = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: CalendarDay[] = [];
  for (let i = 0; i < leading; i++) {
    cells.push({ key: `b${i}`, day: null, events: [], inWeek: false, borderColor: "transparent", weekdayLabel: "" });
  }
  for (let d = 1; d <= totalDays; d++) {
    const dateIso = isoDate(year, month, d);
    cells.push({
      key: `d${d}`,
      day: d,
      events: eventsForDate(goals, dateIso, today),
      inWeek: false,
      borderColor: dateIso === today ? "var(--color-text)" : "var(--color-divider)",
      weekdayLabel: WEEKDAY_LABELS[new Date(year, month, d).getDay()],
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ key: `t${cells.length}`, day: null, events: [], inWeek: false, borderColor: "transparent", weekdayLabel: "" });
  }
  return cells;
}

export function buildWeekDays(plans: Plan[], today: string): CalendarDay[] {
  const goals = plans.flatMap((p) => p.goals);
  const todayDate = new Date(`${today}T00:00:00`);
  const start = new Date(todayDate);
  start.setDate(todayDate.getDate() - todayDate.getDay());
  const cells: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    cells.push({
      key: `w${i}`,
      day: d.getDate(),
      events: eventsForDate(goals, dateIso, today),
      inWeek: true,
      borderColor: dateIso === today ? "var(--color-text)" : "var(--color-divider)",
      weekdayLabel: WEEKDAY_LABELS[d.getDay()],
    });
  }
  return cells;
}

export interface WizardPreview {
  preview: string;
  eventsPreview: string;
}

export function computeWizardPreview(
  type: "numeric" | "task" | "habit" | null,
  fields: { startValue: string; targetValue: string; targetDate: string; frequency: "daily" | "weekly"; unit: string; taskDate: string; habitFrequency: string },
  today: string
): WizardPreview {
  if (type === "numeric") {
    const start = Number(fields.startValue) || 0;
    const target = Number(fields.targetValue) || 0;
    const date = fields.targetDate;
    if (date) {
      const days = Math.max(1, daysBetween(today, date));
      const remaining = Math.abs(target - start);
      const perDay = fields.frequency === "daily" ? remaining / days : remaining / Math.max(1, Math.round(days / 7));
      const preview = `${remaining.toFixed(0)} ${fields.unit || ""} até ${formatDate(date)} → ~${perDay.toFixed(1)} ${fields.unit || ""} por ${fields.frequency === "daily" ? "dia" : "semana"}`;
      const count = fields.frequency === "daily" ? days : Math.max(1, Math.round(days / 7));
      return { preview, eventsPreview: `${count} eventos serão criados no Google Calendar` };
    }
    return { preview: "Defina o prazo pra ver a prévia.", eventsPreview: "" };
  }
  if (type === "task") {
    const preview = fields.taskDate ? `Prazo em ${formatDate(fields.taskDate)}` : "Defina o prazo pra ver a prévia.";
    return { preview, eventsPreview: "1 evento será criado no Google Calendar, no dia do prazo" };
  }
  if (type === "habit") {
    return {
      preview: `Lembretes ${fields.habitFrequency}`,
      eventsPreview: "Eventos recorrentes serão criados no Google Calendar",
    };
  }
  return { preview: "", eventsPreview: "" };
}
