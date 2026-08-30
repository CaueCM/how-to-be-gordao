import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  CalendarViewMode,
  Goal,
  HabitCheckin,
  NumericCheckin,
  Plan,
  TaskCheckin,
  Screen,
  UnitPreference,
  WeekStart,
  WizardFields,
} from "./types";
import { todayISO } from "./business";
import * as api from "./actions";

// Espelha recomputeGoalAggregates no servidor: o streak é desnormalizado na
// meta, então editar o histórico exige recalcular a sequência do zero.
function habitStreaks(checkins: HabitCheckin[]): { streakCurrent: number; streakBest: number } {
  const asc = [...checkins].sort((a, b) => a.date.localeCompare(b.date));
  let best = 0;
  let run = 0;
  for (const c of asc) {
    if (c.done) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return { streakCurrent: run, streakBest: best };
}

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

interface EditGoalFields {
  title: string;
  unit: string;
  startValue: string;
  targetValue: string;
  targetDate: string;
  frequency: "daily" | "weekly";
  targetFrequency: string;
  subtasks: { id: string; text: string }[];
}

const EMPTY_EDIT_FIELDS: EditGoalFields = {
  title: "",
  unit: "",
  startValue: "0",
  targetValue: "",
  targetDate: "",
  frequency: "weekly",
  targetFrequency: "3x por semana",
  subtasks: [],
};

function newId(): string {
  return crypto.randomUUID();
}

interface AppState {
  today: string;
  loginStep: 0 | 1;
  screen: Screen;
  selectedPlanId: string | null;
  selectedGoalId: string | null;
  emptyDemo: boolean;
  calendarViewMode: CalendarViewMode;
  notificationsEnabled: boolean;
  unitPreference: UnitPreference;
  weekStart: WeekStart;
  planSearch: string;
  goalSearch: string;
  plans: Plan[];
  plansLoaded: boolean;
  plansLoading: boolean;
  plansError: string | null;

  hasOnboarded: boolean;
  onboardingOpen: boolean;
  onboardingStep: number;

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
  checkinTaskDone: boolean;

  editGoalId: string | null;
  editFields: EditGoalFields;
  editOriginalSubtasks: { id: string; text: string }[];

  goLoginStep: (step: 0 | 1) => void;
  loadPlans: () => Promise<void>;

  openOnboarding: () => void;
  closeOnboarding: () => void;
  onboardingNext: () => void;
  onboardingBack: () => void;
  finishOnboarding: () => void;

  go: (screen: Screen) => void;
  openPlan: (id: string) => void;
  openGoal: (id: string) => void;
  backToPlans: () => void;
  backToPlan: () => void;

  toggleEmptyDemo: () => void;
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
  setCheckinTaskDone: (v: boolean) => void;
  toggleSubtask: (goalId: string, subtaskId: string) => void;
  submitCheckin: () => void;
  updateCheckin: (goalId: string, checkinId: string, updates: { value?: number; done?: boolean; note?: string }) => void;
  deleteCheckin: (goalId: string, checkinId: string) => void;
  deleteGoal: (goalId: string) => void;

  openEditGoal: (goalId: string) => void;
  closeEditGoal: () => void;
  updateEditField: (key: keyof Omit<EditGoalFields, "subtasks">, value: string) => void;
  addEditSubtask: (text: string) => void;
  updateEditSubtaskText: (id: string, text: string) => void;
  removeEditSubtask: (id: string) => void;
  submitGoalEdit: () => void;

  findGoal: (goalId: string) => { plan: Plan | null; goal: Goal | null };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      today: todayISO(),
      loginStep: 0,
      screen: "dashboard",
      selectedPlanId: null,
      selectedGoalId: null,
      emptyDemo: false,
      calendarViewMode: "month",
      notificationsEnabled: true,
      unitPreference: "kg",
      weekStart: "sunday",
      planSearch: "",
      goalSearch: "",
      plans: [],
      plansLoaded: false,
      plansLoading: false,
      plansError: null,

      hasOnboarded: true,
      onboardingOpen: false,
      onboardingStep: 0,

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
      checkinTaskDone: true,

      editGoalId: null,
      editFields: EMPTY_EDIT_FIELDS,
      editOriginalSubtasks: [],

      goLoginStep: (step) => set({ loginStep: step }),

      loadPlans: async () => {
        if (get().plansLoading) return;
        set({ plansLoading: true, plansError: null });
        try {
          const data = await api.getBootstrap();
          set({
            plans: data.plans,
            plansLoaded: true,
            unitPreference: data.unitPreference,
            weekStart: data.weekStart,
            notificationsEnabled: data.notificationsEnabled,
            hasOnboarded: data.hasOnboarded,
          });
        } catch (err) {
          set({ plansError: err instanceof Error ? err.message : "Erro ao carregar seus dados." });
        } finally {
          set({ plansLoading: false });
        }
      },

      openOnboarding: () => set({ onboardingOpen: true, onboardingStep: 0 }),
      closeOnboarding: () => set({ onboardingOpen: false }),
      onboardingNext: () => set((s) => ({ onboardingStep: s.onboardingStep + 1 })),
      onboardingBack: () => set((s) => ({ onboardingStep: Math.max(0, s.onboardingStep - 1) })),
      finishOnboarding: () => {
        set({ onboardingOpen: false, hasOnboarded: true });
        void api.completeOnboarding().catch(console.error);
      },

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
      setCalendarViewMode: (mode) => set({ calendarViewMode: mode }),
      toggleNotifications: () =>
        set((s) => {
          const next = !s.notificationsEnabled;
          void api.updatePreferences({ notificationsEnabled: next }).catch(console.error);
          return { notificationsEnabled: next };
        }),
      setUnitPreference: (v) => {
        set({ unitPreference: v });
        void api.updatePreferences({ unitPreference: v }).catch(console.error);
      },
      setWeekStart: (v) => {
        set({ weekStart: v });
        void api.updatePreferences({ weekStart: v }).catch(console.error);
      },
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
        if (!wizardPlanId) return;
        const id = newId();
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
            .map((t) => ({ id: newId(), text: t, done: false }));
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
        const planId = wizardPlanId;
        const plans2 = plans.map((p) => (p.id === planId ? { ...p, goals: [...p.goals, goal] } : p));
        set({ plans: plans2, wizardStep: 4, newGoalId: id });
        void api.createGoal(planId, goal).catch(console.error);
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
          checkinTaskDone: goal && goal.type === "task" ? goal.forceDone : true,
        });
      },
      closeCheckin: () => set({ checkinGoalId: null }),
      setCheckinValue: (v) => set({ checkinValue: v }),
      setCheckinNote: (v) => set({ checkinNote: v }),
      setCheckinHabitDone: (v) => set({ checkinHabitDone: v }),
      setCheckinTaskDone: (v) => set({ checkinTaskDone: v }),
      toggleSubtask: (goalId, subtaskId) => {
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
        }));
        void api.toggleSubtask(goalId, subtaskId).catch(console.error);
      },
      submitCheckin: () => {
        const { checkinGoalId, checkinValue, checkinNote, checkinHabitDone, checkinTaskDone, plans, today } = get();
        if (!checkinGoalId) return;
        const checkinId = crypto.randomUUID();
        const plans2 = plans.map((p) => ({
          ...p,
          goals: p.goals.map((g) => {
            if (g.id !== checkinGoalId) return g;
            if (g.type === "numeric") {
              return {
                ...g,
                currentValue: Number(checkinValue) || g.currentValue,
                checkins: [{ id: checkinId, date: today, value: Number(checkinValue), note: checkinNote }, ...g.checkins],
              };
            }
            if (g.type === "habit") {
              const nc = checkinHabitDone ? g.streakCurrent + 1 : 0;
              return {
                ...g,
                streakCurrent: nc,
                streakBest: Math.max(g.streakBest, nc),
                checkins: [{ id: checkinId, date: today, done: checkinHabitDone, note: checkinNote }, ...g.checkins],
              };
            }
            return {
              ...g,
              forceDone: checkinTaskDone,
              checkins: [{ id: checkinId, date: today, note: checkinNote }, ...g.checkins],
            };
          }),
        }));
        set({ plans: plans2, checkinGoalId: null });
        void api
          .submitCheckin({
            id: checkinId,
            goalId: checkinGoalId,
            date: today,
            value: Number(checkinValue),
            habitDone: checkinHabitDone,
            taskDone: checkinTaskDone,
            note: checkinNote,
          })
          .catch(console.error);
      },

      updateCheckin: (goalId, checkinId, updates) => {
        set((s) => ({
          plans: s.plans.map((p) => ({
            ...p,
            goals: p.goals.map((g) => {
              if (g.id !== goalId) return g;
              const checkins = g.checkins.map((c) =>
                c.id === checkinId ? { ...c, ...updates } : c
              );
              if (g.type === "numeric") {
                const latest = [...(checkins as NumericCheckin[])].sort((a, b) =>
                  a.date.localeCompare(b.date)
                );
                return {
                  ...g,
                  checkins: checkins as NumericCheckin[],
                  currentValue: latest[latest.length - 1]?.value ?? g.startValue,
                };
              }
              if (g.type === "habit") {
                return { ...g, checkins: checkins as HabitCheckin[], ...habitStreaks(checkins as HabitCheckin[]) };
              }
              return { ...g, checkins: checkins as TaskCheckin[] };
            }),
          })),
        }));
        void api.updateCheckin(checkinId, updates).catch(console.error);
      },

      deleteCheckin: (goalId, checkinId) => {
        set((s) => ({
          plans: s.plans.map((p) => ({
            ...p,
            goals: p.goals.map((g) => {
              if (g.id !== goalId) return g;
              const checkins = g.checkins.filter((c) => c.id !== checkinId);
              if (g.type === "numeric") {
                const latest = [...(checkins as NumericCheckin[])].sort((a, b) =>
                  a.date.localeCompare(b.date)
                );
                return {
                  ...g,
                  checkins: checkins as NumericCheckin[],
                  currentValue: latest[latest.length - 1]?.value ?? g.startValue,
                };
              }
              if (g.type === "habit") {
                return { ...g, checkins: checkins as HabitCheckin[], ...habitStreaks(checkins as HabitCheckin[]) };
              }
              return { ...g, checkins: checkins as TaskCheckin[] };
            }),
          })),
        }));
        void api.deleteCheckin(checkinId).catch(console.error);
      },

      deleteGoal: (goalId) => {
        set((s) => ({
          plans: s.plans.map((p) => ({ ...p, goals: p.goals.filter((g) => g.id !== goalId) })),
          screen: "planDetail",
          selectedGoalId: null,
        }));
        void api.deleteGoal(goalId).catch(console.error);
      },

      openEditGoal: (goalId) => {
        const { goal } = get().findGoal(goalId);
        if (!goal) return;
        if (goal.type === "numeric") {
          set({
            editGoalId: goalId,
            editFields: {
              ...EMPTY_EDIT_FIELDS,
              title: goal.title,
              unit: goal.unit,
              startValue: String(goal.startValue),
              targetValue: String(goal.targetValue),
              targetDate: goal.targetDate,
              frequency: goal.frequency,
            },
            editOriginalSubtasks: [],
          });
        } else if (goal.type === "task") {
          set({
            editGoalId: goalId,
            editFields: {
              ...EMPTY_EDIT_FIELDS,
              title: goal.title,
              targetDate: goal.targetDate,
              subtasks: goal.subtasks.map((s) => ({ id: s.id, text: s.text })),
            },
            editOriginalSubtasks: goal.subtasks.map((s) => ({ id: s.id, text: s.text })),
          });
        } else {
          set({
            editGoalId: goalId,
            editFields: { ...EMPTY_EDIT_FIELDS, title: goal.title, targetFrequency: goal.targetFrequency },
            editOriginalSubtasks: [],
          });
        }
      },
      closeEditGoal: () => set({ editGoalId: null }),
      updateEditField: (key, value) => set((s) => ({ editFields: { ...s.editFields, [key]: value } })),
      addEditSubtask: (text) =>
        set((s) => ({ editFields: { ...s.editFields, subtasks: [...s.editFields.subtasks, { id: newId(), text }] } })),
      updateEditSubtaskText: (id, text) =>
        set((s) => ({
          editFields: {
            ...s.editFields,
            subtasks: s.editFields.subtasks.map((st) => (st.id === id ? { ...st, text } : st)),
          },
        })),
      removeEditSubtask: (id) =>
        set((s) => ({ editFields: { ...s.editFields, subtasks: s.editFields.subtasks.filter((st) => st.id !== id) } })),

      submitGoalEdit: () => {
        const { editGoalId, editFields, editOriginalSubtasks, plans } = get();
        if (!editGoalId) return;
        const { goal } = get().findGoal(editGoalId);
        if (!goal) return;

        const plans2 = plans.map((p) => ({
          ...p,
          goals: p.goals.map((g) => {
            if (g.id !== editGoalId) return g;
            if (g.type === "numeric") {
              return {
                ...g,
                title: editFields.title || g.title,
                unit: editFields.unit,
                startValue: Number(editFields.startValue) || 0,
                targetValue: Number(editFields.targetValue) || 0,
                targetDate: editFields.targetDate || g.targetDate,
                frequency: editFields.frequency,
              };
            }
            if (g.type === "task") {
              return {
                ...g,
                title: editFields.title || g.title,
                targetDate: editFields.targetDate || g.targetDate,
                subtasks: editFields.subtasks.map((s) => ({
                  id: s.id,
                  text: s.text,
                  done: g.subtasks.find((os) => os.id === s.id)?.done ?? false,
                })),
              };
            }
            return { ...g, title: editFields.title || g.title, targetFrequency: editFields.targetFrequency };
          }),
        }));
        set({ plans: plans2, editGoalId: null });

        if (goal.type === "numeric") {
          void api
            .updateGoal(editGoalId, {
              title: editFields.title,
              unit: editFields.unit,
              startValue: Number(editFields.startValue) || 0,
              targetValue: Number(editFields.targetValue) || 0,
              targetDate: editFields.targetDate,
              frequency: editFields.frequency,
            })
            .catch(console.error);
        } else if (goal.type === "task") {
          void api.updateGoal(editGoalId, { title: editFields.title, targetDate: editFields.targetDate }).catch(console.error);

          const originalIds = new Set(editOriginalSubtasks.map((s) => s.id));
          const currentIds = new Set(editFields.subtasks.map((s) => s.id));
          for (const st of editFields.subtasks) {
            if (!originalIds.has(st.id)) {
              void api.addSubtask(editGoalId, st.id, st.text).catch(console.error);
            } else {
              const original = editOriginalSubtasks.find((s) => s.id === st.id);
              if (original && original.text !== st.text) {
                void api.updateSubtaskText(st.id, st.text).catch(console.error);
              }
            }
          }
          for (const original of editOriginalSubtasks) {
            if (!currentIds.has(original.id)) {
              void api.removeSubtask(original.id).catch(console.error);
            }
          }
        } else {
          void api.updateGoal(editGoalId, { title: editFields.title, targetFrequency: editFields.targetFrequency }).catch(console.error);
        }
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
      partialize: (s) => ({ emptyDemo: s.emptyDemo }),
    }
  )
);
