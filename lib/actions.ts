"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { DailyTask, Goal, Plan, UnitPreference, WeekStart } from "@/lib/types";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, numericRecurrenceRule, habitRecurrenceRule } from "@/lib/googleCalendar";
import { buildPlan, toSubtasks } from "@/lib/trainingPlan";
import { randomUUID } from "crypto";

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

async function getAccessToken(): Promise<string | null> {
  const session = await auth();
  return session?.accessToken ?? null;
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
  checkins: { id: string; date: Date; value: number | null; done: boolean | null; note: string | null }[];
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
      checkins: checkins.map((c) => ({ id: c.id, date: fromDateOnly(c.date), value: c.value ?? 0, note: c.note ?? "" })),
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
      checkins: checkins.map((c) => ({ id: c.id, date: fromDateOnly(c.date), note: c.note ?? "" })),
    };
  }
  return {
    id: g.id,
    type: "habit",
    title: g.title,
    targetFrequency: g.targetFrequency ?? "",
    streakCurrent: g.streakCurrent ?? 0,
    streakBest: g.streakBest ?? 0,
    checkins: checkins.map((c) => ({ id: c.id, date: fromDateOnly(c.date), done: c.done ?? false, note: c.note ?? "" })),
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

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return;
    let googleEventId: string | null = null;
    if (goal.type === "numeric") {
      googleEventId = await createCalendarEvent(accessToken, {
        title: `Registrar: ${goal.title}`,
        startDate: goal.planStartDate,
        recurrence: numericRecurrenceRule(goal.frequency, goal.targetDate),
      });
    } else if (goal.type === "task") {
      googleEventId = await createCalendarEvent(accessToken, {
        title: `Prazo: ${goal.title}`,
        startDate: goal.targetDate,
      });
    } else {
      googleEventId = await createCalendarEvent(accessToken, {
        title: `Hábito: ${goal.title}`,
        startDate: new Date().toISOString().slice(0, 10),
        recurrence: habitRecurrenceRule(goal.targetFrequency),
      });
    }
    if (googleEventId) {
      await prisma.goal.update({ where: { id: goal.id }, data: { googleEventId } });
    }
  } catch (err) {
    console.error("Calendar sync failed for new goal", err);
  }
}

export async function deleteGoal(goalId: string): Promise<void> {
  const userId = await requireUserId();
  const goal = await assertOwnsGoal(goalId, userId);
  if (goal.googleEventId) {
    const accessToken = await getAccessToken();
    if (accessToken) await deleteCalendarEvent(accessToken, goal.googleEventId);
  }
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
  const goal = await assertOwnsGoal(goalId, userId);
  const updated = await prisma.goal.update({
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

  if (!goal.googleEventId) return;
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return;
    if (updated.type === "numeric") {
      await updateCalendarEvent(accessToken, goal.googleEventId, {
        title: `Registrar: ${updated.title}`,
        startDate: fromDateOnly(updated.planStartDate),
        recurrence: numericRecurrenceRule((updated.frequency as "daily" | "weekly") ?? "weekly", fromDateOnly(updated.targetDate)),
      });
    } else if (updated.type === "task") {
      await updateCalendarEvent(accessToken, goal.googleEventId, {
        title: `Prazo: ${updated.title}`,
        startDate: fromDateOnly(updated.targetDate),
      });
    } else {
      await updateCalendarEvent(accessToken, goal.googleEventId, {
        title: `Hábito: ${updated.title}`,
        startDate: new Date().toISOString().slice(0, 10),
        recurrence: habitRecurrenceRule(updated.targetFrequency ?? "3x por semana"),
      });
    }
  } catch (err) {
    console.error("Calendar resync failed", err);
  }
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
  id?: string;
  goalId: string;
  date: string;
  value?: number;
  habitDone?: boolean;
  taskDone?: boolean;
  note: string;
}

export async function submitCheckin(input: SubmitCheckinInput): Promise<void> {
  const userId = await requireUserId();
  const goal = await assertOwnsGoal(input.goalId, userId);

  await prisma.$transaction(async (tx) => {
    if (goal.type === "numeric") {
      await tx.checkin.create({
        data: { id: input.id, goalId: goal.id, date: toDateOnly(input.date), value: input.value ?? 0, note: input.note },
      });
      await tx.goal.update({ where: { id: goal.id }, data: { currentValue: input.value ?? goal.currentValue ?? 0 } });
    } else if (goal.type === "habit") {
      const done = !!input.habitDone;
      const nextStreak = done ? (goal.streakCurrent ?? 0) + 1 : 0;
      await tx.checkin.create({
        data: { id: input.id, goalId: goal.id, date: toDateOnly(input.date), done, note: input.note },
      });
      await tx.goal.update({
        where: { id: goal.id },
        data: { streakCurrent: nextStreak, streakBest: Math.max(goal.streakBest ?? 0, nextStreak) },
      });
    } else {
      await tx.checkin.create({
        data: { id: input.id, goalId: goal.id, date: toDateOnly(input.date), note: input.note },
      });
      await tx.goal.update({ where: { id: goal.id }, data: { forceDone: !!input.taskDone } });
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

// --- Listinha do dia ---
//
// Itens soltos, presos ao usuário e a uma data. De propósito não têm relação
// com Plan nem Goal: nada aqui entra em progresso, streak ou status de meta.

async function assertOwnsDailyTask(taskId: string, userId: string) {
  const task = await prisma.dailyTask.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new Error("Tarefa não encontrada");
  return task;
}

export async function getDailyTasks(date: string): Promise<DailyTask[]> {
  const userId = await requireUserId();
  const tasks = await prisma.dailyTask.findMany({
    where: { userId, date: toDateOnly(date) },
    orderBy: { createdAt: "asc" },
  });
  return tasks.map((t) => ({
    id: t.id,
    date: fromDateOnly(t.date),
    text: t.text,
    done: t.done,
  }));
}

export async function addDailyTask(id: string, date: string, text: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.dailyTask.create({
    data: { id, userId, date: toDateOnly(date), text },
  });
}

export async function setDailyTaskDone(taskId: string, done: boolean): Promise<void> {
  const userId = await requireUserId();
  await assertOwnsDailyTask(taskId, userId);
  await prisma.dailyTask.update({ where: { id: taskId }, data: { done } });
}

export async function updateDailyTaskText(taskId: string, text: string): Promise<void> {
  const userId = await requireUserId();
  await assertOwnsDailyTask(taskId, userId);
  await prisma.dailyTask.update({ where: { id: taskId }, data: { text } });
}

export async function deleteDailyTask(taskId: string): Promise<void> {
  const userId = await requireUserId();
  await assertOwnsDailyTask(taskId, userId);
  await prisma.dailyTask.delete({ where: { id: taskId } });
}

// --- Edição de check-ins já registrados ---

async function assertOwnsCheckin(checkinId: string, userId: string) {
  const checkin = await prisma.checkin.findFirst({
    where: { id: checkinId, goal: { plan: { userId } } },
  });
  if (!checkin) throw new Error("Registro não encontrado");
  return checkin;
}

/**
 * Recalcula os agregados que a meta guarda desnormalizados a partir do
 * histórico completo de check-ins.
 *
 * Necessário depois de editar ou apagar um registro: `currentValue` (numérica)
 * e o streak (hábito) são gravados no momento do check-in, então mexer no
 * histórico sem recalcular deixaria a barra de progresso mostrando um valor
 * que não corresponde a nenhum registro existente.
 */
async function recomputeGoalAggregates(goalId: string): Promise<void> {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { checkins: { orderBy: [{ date: "asc" }, { createdAt: "asc" }] } },
  });
  if (!goal) return;

  if (goal.type === "numeric") {
    const last = goal.checkins[goal.checkins.length - 1];
    await prisma.goal.update({
      where: { id: goalId },
      data: { currentValue: last?.value ?? goal.startValue ?? 0 },
    });
  } else if (goal.type === "habit") {
    let best = 0;
    let run = 0;
    for (const c of goal.checkins) {
      if (c.done) {
        run += 1;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }
    await prisma.goal.update({
      where: { id: goalId },
      data: { streakCurrent: run, streakBest: best },
    });
  }
}

export interface UpdateCheckinInput {
  value?: number;
  done?: boolean;
  note?: string;
}

export async function updateCheckin(checkinId: string, updates: UpdateCheckinInput): Promise<void> {
  const userId = await requireUserId();
  const checkin = await assertOwnsCheckin(checkinId, userId);

  await prisma.checkin.update({
    where: { id: checkinId },
    data: {
      ...(updates.value !== undefined ? { value: updates.value } : {}),
      ...(updates.done !== undefined ? { done: updates.done } : {}),
      ...(updates.note !== undefined ? { note: updates.note } : {}),
    },
  });
  await recomputeGoalAggregates(checkin.goalId);
}

export async function deleteCheckin(checkinId: string): Promise<void> {
  const userId = await requireUserId();
  const checkin = await assertOwnsCheckin(checkinId, userId);
  await prisma.checkin.delete({ where: { id: checkinId } });
  await recomputeGoalAggregates(checkin.goalId);
}

// --- Replanejamento do bloco de treino ---

export interface RescheduleResult {
  deleted: number;
  kept: number;
  created: number;
  weeks: number;
  firstDay: string;
  raceDay: string;
}

/**
 * Reconstrói o bloco de treino até a São Silvestre a partir de `lib/trainingPlan`.
 *
 * Apaga as metas do plano que nunca foram feitas e recria o bloco inteiro.
 * Metas com check-in registrado ou marcadas como feitas são preservadas, para
 * não perder o histórico real de treino — a menos que `purgeAll` seja true.
 *
 * As metas são criadas em lote (dois createMany, com ids gerados aqui) em vez
 * de uma a uma: são 123 metas com subtarefas, e o laço sequencial estourava o
 * limite de tempo da função serverless.
 */
export async function reschedulePlan(planId: string, purgeAll = false): Promise<RescheduleResult> {
  const userId = await requireUserId();

  const plan = await prisma.plan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new Error("Plano não encontrado");

  const { rows, weeks } = buildPlan();

  const existing = await prisma.goal.findMany({
    where: { planId: plan.id },
    select: { id: true, forceDone: true, _count: { select: { checkins: true } } },
  });
  const toDelete = existing.filter(
    (g) => purgeAll || !(g.forceDone === true || g._count.checkins > 0)
  );

  const goalData = rows.map((row) => ({
    id: randomUUID(),
    planId: plan.id,
    type: "task",
    title: row.tipo,
    targetDate: row.date,
    forceDone: false,
  }));

  const subtaskData = rows.flatMap((row, i) =>
    toSubtasks(row, weeks).map((text) => ({ goalId: goalData[i].id, text, done: false }))
  );

  await prisma.$transaction([
    prisma.goal.deleteMany({ where: { id: { in: toDelete.map((g) => g.id) } } }),
    prisma.goal.createMany({ data: goalData }),
    prisma.subtask.createMany({ data: subtaskData }),
  ]);

  return {
    deleted: toDelete.length,
    kept: existing.length - toDelete.length,
    created: rows.length,
    weeks,
    firstDay: rows[0].date.toISOString().slice(0, 10),
    raceDay: rows[rows.length - 1].date.toISOString().slice(0, 10),
  };
}
