"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Goal, Plan, UnitPreference, WeekStart } from "@/lib/types";

async function requireUser() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("Não autenticado");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Usuário não encontrado");
  return user;
}

async function requireUserId(): Promise<string> {
  const user = await requireUser();
  return user.id;
}

function toDateOnly(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

function fromDateOnly(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

interface GoalWithRelations {
  id: string;
  type: string;
  title: string;
  unit: string | null;
  startValue: number | null;
  currentValue: number | null;
  targetValue: number | null;
  targetDate: Date | null;
  planStartDate: Date | null;
  frequency: string | null;
  forceDone: boolean | null;
  targetFrequency: string | null;
  streakCurrent: number | null;
  streakBest: number | null;
  subtasks: { id: string; text: string; done: boolean }[];
  checkins: { date: Date; value: number | null; done: boolean | null; note: string | null }[];
}

function serializeGoal(g: GoalWithRelations): Goal {
  const checkins = [...g.checkins].sort((a, b) => b.date.getTime() - a.date.getTime());

  if (g.type === "numeric") {
    return {
      id: g.id,
      type: "numeric",
      title: g.title,
      unit: g.unit ?? "",
      startValue: g.startValue ?? 0,
      currentValue: g.currentValue ?? 0,
      targetValue: g.targetValue ?? 0,
      targetDate: fromDateOnly(g.targetDate),
      planStartDate: fromDateOnly(g.planStartDate),
      frequency: (g.frequency as "daily" | "weekly") ?? "weekly",
      checkins: checkins.map((c) => ({ date: fromDateOnly(c.date), value: c.value ?? 0, note: c.note ?? "" })),
    };
  }
  if (g.type === "task") {
    return {
      id: g.id,
      type: "task",
      title: g.title,
      targetDate: fromDateOnly(g.targetDate),
      forceDone: g.forceDone ?? false,
      subtasks: g.subtasks.map((s) => ({ id: s.id, text: s.text, done: s.done })),
      checkins: checkins.map((c) => ({ date: fromDateOnly(c.date), note: c.note ?? "" })),
    };
  }
  return {
    id: g.id,
    type: "habit",
    title: g.title,
    targetFrequency: g.targetFrequency ?? "",
    streakCurrent: g.streakCurrent ?? 0,
    streakBest: g.streakBest ?? 0,
    checkins: checkins.map((c) => ({ date: fromDateOnly(c.date), done: c.done ?? false, note: c.note ?? "" })),
  };
}

export interface BootstrapData {
  plans: Plan[];
  unitPreference: UnitPreference;
  weekStart: WeekStart;
  notificationsEnabled: boolean;
  hasOnboarded: boolean;
}

export async function getBootstrap(): Promise<BootstrapData> {
  const user = await requireUser();
  const plans = await prisma.plan.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      goals: {
        orderBy: { createdAt: "asc" },
        include: { subtasks: true, checkins: true },
      },
    },
  });
  return {
    plans: plans.map((p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon as Plan["icon"],
      goals: p.goals.map((g) => serializeGoal(g)),
    })),
    unitPreference: user.unitPreference as UnitPreference,
    weekStart: user.weekStart as WeekStart,
    notificationsEnabled: user.notificationsEnabled,
    hasOnboarded: user.hasOnboarded,
  };
}

export async function completeOnboarding(): Promise<void> {
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: { hasOnboarded: true } });
}

async function assertOwnsPlan(planId: string, userId: string) {
  const plan = await prisma.plan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new Error("Missão não encontrada");
}

async function assertOwnsGoal(goalId: string, userId: string) {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, plan: { userId } } });
  if (!goal) throw new Error("Meta não encontrada");
  return goal;
}

async function assertOwnsSubtask(subtaskId: string, userId: string) {
  const subtask = await prisma.subtask.findFirst({ where: { id: subtaskId, goal: { plan: { userId } } } });
  if (!subtask) throw new Error("Sub-tarefa não encontrada");
  return subtask;
}

export async function createGoal(planId: string, goal: Goal): Promise<void> {
  const userId = await requireUserId();
  await assertOwnsPlan(planId, userId);

  if (goal.type === "numeric") {
    await prisma.goal.create({
      data: {
        id: goal.id,
        planId,
        type: "numeric",
        title: goal.title,
        unit: goal.unit,
        startValue: goal.startValue,
        currentValue: goal.currentValue,
        targetValue: goal.targetValue,
        targetDate: toDateOnly(goal.targetDate),
        planStartDate: toDateOnly(goal.planStartDate),
        frequency: goal.frequency,
      },
    });
  } else if (goal.type === "task") {
    await prisma.goal.create({
      data: {
        id: goal.id,
        planId,
        type: "task",
        title: goal.title,
        targetDate: toDateOnly(goal.targetDate),
        forceDone: goal.forceDone,
        subtasks: { create: goal.subtasks.map((s) => ({ id: s.id, text: s.text, done: s.done })) },
      },
    });
  } else {
    await prisma.goal.create({
      data: {
        id: goal.id,
        planId,
        type: "habit",
        title: goal.title,
        targetFrequency: goal.targetFrequency,
        streakCurrent: goal.streakCurrent,
        streakBest: goal.streakBest,
      },
    });
  }
}

export async function deleteGoal(goalId: string): Promise<void> {
  const userId = await requireUserId();
  await assertOwnsGoal(goalId, userId);
  await prisma.goal.delete({ where: { id: goalId } });
}

export interface UpdateGoalInput {
  title?: string;
  unit?: string;
  startValue?: number;
  targetValue?: number;
  targetDate?: string;
  frequency?: "daily" | "weekly";
  targetFrequency?: string;
}

export async function updateGoal(goalId: string, updates: UpdateGoalInput): Promise<void> {
  const userId = await requireUserId();
  await assertOwnsGoal(goalId, userId);
  await prisma.goal.update({
    where: { id: goalId },
    data: {
      title: updates.title,
      unit: updates.unit,
      startValue: updates.startValue,
      targetValue: updates.targetValue,
      targetDate: updates.targetDate !== undefined ? toDateOnly(updates.targetDate) : undefined,
      frequency: updates.frequency,
      targetFrequency: updates.targetFrequency,
    },
  });
}

export async function addSubtask(goalId: string, id: string, text: string): Promise<void> {
  const userId = await requireUserId();
  await assertOwnsGoal(goalId, userId);
  await prisma.subtask.create({ data: { id, goalId, text, done: false } });
}

export async function updateSubtaskText(subtaskId: string, text: string): Promise<void> {
  const userId = await requireUserId();
  await assertOwnsSubtask(subtaskId, userId);
  await prisma.subtask.update({ where: { id: subtaskId }, data: { text } });
}

export async function removeSubtask(subtaskId: string): Promise<void> {
  const userId = await requireUserId();
  await assertOwnsSubtask(subtaskId, userId);
  await prisma.subtask.delete({ where: { id: subtaskId } });
}

export async function toggleSubtask(goalId: string, subtaskId: string): Promise<void> {
  const userId = await requireUserId();
  await assertOwnsGoal(goalId, userId);
  const subtask = await prisma.subtask.findFirst({ where: { id: subtaskId, goalId } });
  if (!subtask) throw new Error("Sub-tarefa não encontrada");
  await prisma.subtask.update({ where: { id: subtaskId }, data: { done: !subtask.done } });
}

interface SubmitCheckinInput {
  goalId: string;
  date: string;
  value?: number;
  habitDone?: boolean;
  note: string;
}

export async function submitCheckin(input: SubmitCheckinInput): Promise<void> {
  const userId = await requireUserId();
  const goal = await assertOwnsGoal(input.goalId, userId);

  await prisma.$transaction(async (tx) => {
    if (goal.type === "numeric") {
      await tx.checkin.create({
        data: { goalId: goal.id, date: toDateOnly(input.date), value: input.value ?? 0, note: input.note },
      });
      await tx.goal.update({ where: { id: goal.id }, data: { currentValue: input.value ?? goal.currentValue ?? 0 } });
    } else if (goal.type === "habit") {
      const done = !!input.habitDone;
      const nextStreak = done ? (goal.streakCurrent ?? 0) + 1 : 0;
      await tx.checkin.create({
        data: { goalId: goal.id, date: toDateOnly(input.date), done, note: input.note },
      });
      await tx.goal.update({
        where: { id: goal.id },
        data: { streakCurrent: nextStreak, streakBest: Math.max(goal.streakBest ?? 0, nextStreak) },
      });
    } else {
      await tx.checkin.create({
        data: { goalId: goal.id, date: toDateOnly(input.date), note: input.note },
      });
    }
  });
}

export async function updatePreferences(prefs: {
  unitPreference?: UnitPreference;
  weekStart?: WeekStart;
  notificationsEnabled?: boolean;
}): Promise<void> {
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: prefs });
}
