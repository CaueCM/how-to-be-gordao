import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  CalendarViewMode,
  Goal,
  Plan,
  Screen,
  UnitPreference,
  WeekStart,
  WizardFields,
} from "./types";
import { INITIAL_PLANS } from "./mockData";
import { todayISO } from "./business";

const EMPTY_WIZARD_FIELDS: WizardFields = {
  title: "",
  unit: "",
  startValue: "0",
  targetValue: "",
  targetDate: "",
  frequency: "weekly",
  taskDate: "",
  subtasksText: "",
  habitFrequency: "3x por semana",
};

interface AppState {
  today: string;
  isLoggedIn: boolean;
  loginStep: 0 | 1;
  screen: Screen;
  selectedPlanId: string | null;
  selectedGoalId: string | null;
  emptyDemo: boolean;
  calendarConnected: boolean;
  calendarViewMode: CalendarViewMode;
  notificationsEnabled: boolean;
  unitPreference: UnitPreference;
  weekStart: WeekStart;
  planSearch: string;
  goalSearch: string;
  plans: Plan[];

  wizardOpen: boolean;
  wizardStep: 1 | 2 | 3 | 4;
  wizardType: "numeric" | "task" | "habit" | null;
  wizardPlanId: string | null;
  wizardFields: WizardFields;
  newGoalId: string | null;

  checkinGoalId: string | null;
  checkinValue: string;
  checkinNote: string;
  checkinHabitDone: boolean;

  goLoginStep: (step: 0 | 1) => void;
  doLogin: () => void;
  doLogout: () => void;

  go: (screen: Screen) => void;
  openPlan: (id: string) => void;
  openGoal: (id: string) => void;
  backToPlans: () => void;
  backToPlan: () => void;

  toggleEmptyDemo: () => void;
  toggleCalendarConnected: () => void;
  setCalendarViewMode: (mode: CalendarViewMode) => void;
  toggleNotifications: () => void;
  setUnitPreference: (v: UnitPreference) => void;
  setWeekStart: (v: WeekStart) => void;
  setPlanSearch: (v: string) => void;
  setGoalSearch: (v: string) => void;

  openWizard: (planId: string | null) => void;
  closeWizard: () => void;
  wizardSetType: (type: "numeric" | "task" | "habit") => void;
  wizardBack: () => void;
  wizardNext: () => void;
  updateWizardField: (key: keyof WizardFields, value: string) => void;
  setWizardPlan: (id: string) => void;
  wizardConfirm: () => void;
  wizardViewGoal: () => void;

  openCheckin: (goalId: string) => void;
  closeCheckin: () => void;
  setCheckinValue: (v: string) => void;
  setCheckinNote: (v: string) => void;
  setCheckinHabitDone: (v: boolean) => void;
  toggleSubtask: (goalId: string, subtaskId: string) => void;
  submitCheckin: () => void;
  deleteGoal: (goalId: string) => void;

  findGoal: (goalId: string) => { plan: Plan | null; goal: Goal | null };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      today: todayISO(),
      isLoggedIn: false,
      loginStep: 0,
      screen: "dashboard",
      selectedPlanId: null,
      selectedGoalId: null,
      emptyDemo: false,
      calendarConnected: true,
      calendarViewMode: "month",
      notificationsEnabled: true,
      unitPreference: "kg",
      weekStart: "sunday",
      planSearch: "",
      goalSearch: "",
      plans: INITIAL_PLANS,

      wizardOpen: false,
      wizardStep: 1,
      wizardType: null,
      wizardPlanId: null,
      wizardFields: EMPTY_WIZARD_FIELDS,
      newGoalId: null,

      checkinGoalId: null,
      checkinValue: "",
      checkinNote: "",
      checkinHabitDone: true,

      goLoginStep: (step) => set({ loginStep: step }),
      doLogin: () => set({ isLoggedIn: true, screen: "dashboard" }),
      doLogout: () => set({ isLoggedIn: false, loginStep: 0, screen: "dashboard" }),

      go: (screen) => set({ screen }),
      openPlan: (id) => set({ screen: "planDetail", selectedPlanId: id }),
      openGoal: (id) => {
        const { plan } = get().findGoal(id);
        set((s) => ({
          screen: "goalDetail",
          selectedGoalId: id,
          selectedPlanId: plan ? plan.id : s.selectedPlanId,
        }));
      },
      backToPlans: () => set({ screen: "plans" }),
      backToPlan: () => set({ screen: "planDetail" }),

      toggleEmptyDemo: () => set((s) => ({ emptyDemo: !s.emptyDemo })),
      toggleCalendarConnected: () => set((s) => ({ calendarConnected: !s.calendarConnected })),
      setCalendarViewMode: (mode) => set({ calendarViewMode: mode }),
      toggleNotifications: () => set((s) => ({ notificationsEnabled: !s.notificationsEnabled })),
      setUnitPreference: (v) => set({ unitPreference: v }),
      setWeekStart: (v) => set({ weekStart: v }),
      setPlanSearch: (v) => set({ planSearch: v }),
      setGoalSearch: (v) => set({ goalSearch: v }),

      openWizard: (planId) =>
        set((s) => ({
          wizardOpen: true,
          wizardStep: 1,
          wizardType: null,
          wizardPlanId: planId || s.plans[0]?.id || null,
          wizardFields: EMPTY_WIZARD_FIELDS,
        })),
      closeWizard: () => set({ wizardOpen: false }),
      wizardSetType: (type) => set({ wizardType: type, wizardStep: 2 }),
      wizardBack: () => set((s) => ({ wizardStep: Math.max(1, s.wizardStep - 1) as 1 | 2 | 3 | 4 })),
      wizardNext: () => set((s) => ({ wizardStep: Math.min(4, s.wizardStep + 1) as 1 | 2 | 3 | 4 })),
      updateWizardField: (key, value) =>
        set((s) => ({ wizardFields: { ...s.wizardFields, [key]: value } })),
      setWizardPlan: (id) => set({ wizardPlanId: id }),

      wizardConfirm: () => {
        const { wizardType, wizardFields, wizardPlanId, plans, today } = get();
        const id = `g${Date.now()}`;
        let goal: Goal;
        if (wizardType === "numeric") {
          goal = {
            id,
            type: "numeric",
            title: wizardFields.title || "Nova meta",
            unit: wizardFields.unit || "",
            startValue: Number(wizardFields.startValue) || 0,
            currentValue: Number(wizardFields.startValue) || 0,
            targetValue: Number(wizardFields.targetValue) || 0,
            targetDate: wizardFields.targetDate || today,
            planStartDate: today,
            frequency: wizardFields.frequency,
            checkins: [],
          };
        } else if (wizardType === "task") {
          const subtasks = (wizardFields.subtasksText || "")
            .split("\n")
            .map((t) => t.trim())
            .filter(Boolean)
            .map((t, i) => ({ id: `st${Date.now()}${i}`, text: t, done: false }));
          goal = {
            id,
            type: "task",
            title: wizardFields.title || "Nova tarefa",
            targetDate: wizardFields.taskDate || today,
            subtasks,
            forceDone: false,
            checkins: [],
          };
        } else {
          goal = {
            id,
            type: "habit",
            title: wizardFields.title || "Novo hábito",
            targetFrequency: wizardFields.habitFrequency,
            streakCurrent: 0,
            streakBest: 0,
            checkins: [],
          };
        }
        const plans2 = plans.map((p) =>
          p.id === wizardPlanId ? { ...p, goals: [...p.goals, goal] } : p
        );
        set({ plans: plans2, wizardStep: 4, newGoalId: id });
      },
      wizardViewGoal: () => {
        const id = get().newGoalId;
        if (!id) {
          set({ wizardOpen: false });
          return;
        }
        set({ wizardOpen: false, screen: "goalDetail", selectedGoalId: id });
      },

      openCheckin: (goalId) => {
        const { goal } = get().findGoal(goalId);
        set({
          checkinGoalId: goalId,
          checkinValue: goal && goal.type === "numeric" ? String(goal.currentValue) : "",
          checkinNote: "",
          checkinHabitDone: true,
        });
      },
      closeCheckin: () => set({ checkinGoalId: null }),
      setCheckinValue: (v) => set({ checkinValue: v }),
      setCheckinNote: (v) => set({ checkinNote: v }),
      setCheckinHabitDone: (v) => set({ checkinHabitDone: v }),
      toggleSubtask: (goalId, subtaskId) =>
        set((s) => ({
          plans: s.plans.map((p) => ({
            ...p,
            goals: p.goals.map((g) =>
              g.id === goalId && g.type === "task"
                ? {
                    ...g,
                    subtasks: g.subtasks.map((st) =>
                      st.id === subtaskId ? { ...st, done: !st.done } : st
                    ),
                  }
                : g
            ),
          })),
        })),
      submitCheckin: () => {
        const { checkinGoalId, checkinValue, checkinNote, checkinHabitDone, plans, today } = get();
        const plans2 = plans.map((p) => ({
          ...p,
          goals: p.goals.map((g) => {
            if (g.id !== checkinGoalId) return g;
            if (g.type === "numeric") {
              return {
                ...g,
                currentValue: Number(checkinValue) || g.currentValue,
                checkins: [{ date: today, value: Number(checkinValue), note: checkinNote }, ...g.checkins],
              };
            }
            if (g.type === "habit") {
              const nc = checkinHabitDone ? g.streakCurrent + 1 : 0;
              return {
                ...g,
                streakCurrent: nc,
                streakBest: Math.max(g.streakBest, nc),
                checkins: [{ date: today, done: checkinHabitDone, note: checkinNote }, ...g.checkins],
              };
            }
            return { ...g, checkins: [{ date: today, note: checkinNote }, ...g.checkins] };
          }),
        }));
        set({ plans: plans2, checkinGoalId: null });
      },

      deleteGoal: (goalId) => {
        set((s) => ({
          plans: s.plans.map((p) => ({ ...p, goals: p.goals.filter((g) => g.id !== goalId) })),
          screen: "planDetail",
          selectedGoalId: null,
        }));
      },

      findGoal: (goalId) => {
        for (const plan of get().plans) {
          const goal = plan.goals.find((g) => g.id === goalId);
          if (goal) return { plan, goal };
        }
        return { plan: null, goal: null };
      },
    }),
    {
      name: "gordao-app-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        isLoggedIn: s.isLoggedIn,
        plans: s.plans,
        emptyDemo: s.emptyDemo,
        calendarConnected: s.calendarConnected,
        notificationsEnabled: s.notificationsEnabled,
        unitPreference: s.unitPreference,
        weekStart: s.weekStart,
      }),
    }
  )
);
