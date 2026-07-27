export type PlanIcon = "pulse" | "book" | "briefcase";

export interface NumericCheckin {
  date: string;
  value: number;
  note: string;
}

export interface HabitCheckin {
  date: string;
  done: boolean;
  note: string;
}

export interface TaskCheckin {
  date: string;
  note: string;
}

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface NumericGoal {
  id: string;
  type: "numeric";
  title: string;
  unit: string;
  startValue: number;
  currentValue: number;
  targetValue: number;
  targetDate: string;
  planStartDate: string;
  frequency: "daily" | "weekly";
  checkins: NumericCheckin[];
}

export interface TaskGoal {
  id: string;
  type: "task";
  title: string;
  targetDate: string;
  forceDone: boolean;
  subtasks: Subtask[];
  checkins: TaskCheckin[];
}

export interface HabitGoal {
  id: string;
  type: "habit";
  title: string;
  targetFrequency: string;
  streakCurrent: number;
  streakBest: number;
  checkins: HabitCheckin[];
}

export type Goal = NumericGoal | TaskGoal | HabitGoal;
export type GoalType = Goal["type"];

export interface Plan {
  id: string;
  name: string;
  icon: PlanIcon;
  goals: Goal[];
}

export type NumericGoalStatus = "concluida" | "atrasada" | "no_prazo";
export type TaskGoalStatus = "concluida" | "atrasada" | "pendente";
export type HabitGoalStatus = "ativa" | "quebrada";
export type GoalStatus = NumericGoalStatus | TaskGoalStatus | HabitGoalStatus;

export type Screen =
  | "dashboard"
  | "plans"
  | "planDetail"
  | "goalDetail"
  | "calendar"
  | "settings";

export type CalendarViewMode = "month" | "week";
export type UnitPreference = "kg" | "lb" | "páginas";
export type WeekStart = "sunday" | "monday";

export interface WizardFields {
  title: string;
  unit: string;
  startValue: string;
  targetValue: string;
  targetDate: string;
  frequency: "daily" | "weekly";
  taskDate: string;
  subtasksText: string;
  habitFrequency: string;
}

export interface GoalViewModel {
  id: string;
  title: string;
  type: GoalType;
  unit: string;
  isNumeric: boolean;
  isTask: boolean;
  isHabit: boolean;
  progressPct: number;
  subtitle: string;
  statusLabel: string;
  badgeBg: string;
  badgeColor: string;
  dateLabel: string;
  targetFrequencyLabel: string;
}

export interface PlanViewModel {
  id: string;
  name: string;
  icon: PlanIcon;
  progressPct: number;
  goalCount: number;
}
