import { config } from "dotenv";
config({ path: __dirname + "/../.env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildPlan, toSubtasks, longRunPlan } from "../lib/trainingPlan";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const USER_EMAIL = "cauemuriano@gmail.com";
const PLAN_NAME = "Corrida + Musculação (Meia Maratona)";

async function main() {
  const commit = process.argv.includes("--commit");
  const purgeAll = process.argv.includes("--purge-all");
  // Permite fixar a data por argumento; por padrão, hoje no fuso local.
  const dateArg = process.argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  const todayISO = dateArg ?? new Date().toLocaleDateString("en-CA");
  const { rows, weeks } = buildPlan(todayISO);
  const longRun = longRunPlan(weeks);

  console.log(`Novo plano: ${rows.length} dias, ${weeks} semanas`);
  console.log(`Primeiro dia: ${rows[0].date.toISOString().slice(0, 10)} (${rows[0].dayName}) - ${rows[0].tipo}`);
  console.log(`Último dia:   ${rows[rows.length - 1].date.toISOString().slice(0, 10)} (${rows[rows.length - 1].dayName}) - ${rows[rows.length - 1].tipo}`);
  console.log(`Preserva histórico concluído: ${purgeAll ? "NÃO (--purge-all)" : "sim"}`);

  if (!commit) {
    console.log("\n--- DRY RUN (nenhuma alteração no banco) ---");
    console.log("\nSemana 1:");
    rows.slice(0, 7).forEach((r) => console.log(" ", r.date.toISOString().slice(0, 10), r.dayName.padEnd(8), "|", r.phase.padEnd(6), "|", r.tipo));
    console.log("\nSemana da prova:");
    rows.slice(-4).forEach((r) => console.log(" ", r.date.toISOString().slice(0, 10), r.dayName.padEnd(8), "|", r.phase.padEnd(15), "|", r.tipo));
    console.log("\nProgressão do treino longo (domingos):");
    rows.filter((r) => r.tipo === "Corrida Longa").forEach((r) => {
      const km = longRun[r.week - 1];
      const prev = r.week > 1 ? longRun[r.week - 2] : 0;
      const mark = prev && km < prev ? "  <- absorção" : "";
      console.log(`  S${String(r.week).padStart(2)} ${r.date.toISOString().slice(0, 10)}  ${String(km).padStart(2)} km  [${r.phase}]${mark}`);
    });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
  if (!user) throw new Error(`Usuário ${USER_EMAIL} não encontrado`);

  const plan = await prisma.plan.findFirst({
    where: { userId: user.id, name: PLAN_NAME },
    orderBy: { createdAt: "asc" },
  });
  if (!plan) throw new Error(`Plano "${PLAN_NAME}" não encontrado`);
  console.log(`\nPlano alvo: ${plan.id}`);

  const existing = await prisma.goal.findMany({
    where: { planId: plan.id },
    include: { checkins: true },
  });
  const doneIds = new Set(
    existing.filter((g) => g.forceDone === true || g.checkins.length > 0).map((g) => g.id)
  );
  const toDelete = existing.filter((g) => purgeAll || !doneIds.has(g.id));

  console.log(`Metas existentes: ${existing.length}`);
  console.log(`A apagar: ${toDelete.length}  |  Preservadas (com histórico): ${existing.length - toDelete.length}`);

  await prisma.goal.deleteMany({ where: { id: { in: toDelete.map((g) => g.id) } } });

  for (const row of rows) {
    await prisma.goal.create({
      data: {
        planId: plan.id,
        type: "task",
        title: row.tipo,
        targetDate: row.date,
        forceDone: false,
        subtasks: { create: toSubtasks(row, weeks).map((text) => ({ text, done: false })) },
      },
    });
  }
  console.log(`${rows.length} metas novas criadas.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
