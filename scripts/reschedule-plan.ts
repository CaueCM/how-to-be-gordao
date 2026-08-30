import { config } from "dotenv";
config({ path: __dirname + "/../.env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const USER_EMAIL = "cauemuriano@gmail.com";
const PLAN_NAME = "Corrida + Musculação (Meia Maratona)";

// Novo início: segunda-feira 31/08/2026. Prova (São Silvestre): quinta 31/12/2026.
// 122 dias = 17 semanas + 3 dias -> quinta da semana 18. Encaixe exato no dia da prova.
const NEW_START = Date.UTC(2026, 7, 31);
const TOTAL_WEEKS = 18;

// O plano original tinha 22 semanas. Comprimir para 18 = cortar as 4 primeiras
// semanas de Base (já percorridas antes da pausa) e manter Build/Peak/Taper
// intactos. Logo: nova semana N == semana (N + 4) do plano original.
const WEEK_OFFSET = 4;

const PULL = [
  "Puxada Com Pega Inversa",
  "Puxada Alta - Pegada Triângulo",
  "Remada Sentada com Pegada em V (Cabo)",
  "Rosca Martelo (Halter)",
  "Rosca Martelo com Corda na Polia",
];
const PUSH = [
  "Supino (Barra)",
  "Supino Inclinado (Barra)",
  "Pec Deck",
  "Tríceps na Polia",
  "Extensão de Tríceps Acima da Cabeça (Cabo)",
  "Tríceps Testa (Halter)",
];
const LEGS = [
  "Extensão de Perna Unilateral (Máquina)",
  "Leg Press Unilateral (Máquina)",
  "Cadeira Flexora (Máquina)",
  "Elevação Unilateral de Panturrilha em Pé",
];
const OMBRO = [
  "Elevação Frontal (Halter)",
  "Desenvolvimento (Halter)",
  "Aberturas Invertidas de Ombro (Peck Deck)",
  "Remada Alta (Halter)",
  "Encolhimento (Halter)",
];

// --- Parâmetros abaixo indexados pela semana ORIGINAL (1-22) ---

function phaseFor(week: number): string {
  if (week <= 6) return "Base";
  if (week <= 14) return "Build";
  if (week <= 18) return "Peak";
  if (week <= 20) return "Taper";
  return "Semana da Prova";
}

function setsFor(week: number): number {
  if (week <= 6) return 4;
  if (week <= 20) return 3;
  return 2;
}

function ombroSetsFor(week: number): number {
  return week <= 6 ? 3 : 2;
}

function pullDurationFor(week: number): number {
  return week <= 6 ? 36 : week <= 20 ? 27 : 18;
}
function pushDurationFor(week: number): number {
  return week <= 6 ? 33 : week <= 20 ? 25 : 16;
}
function legsDurationFor(week: number): number {
  return week <= 6 ? 47 : week <= 20 ? 35 : 24;
}
function comboDurationFor(week: number): number {
  return week <= 6 ? 46 : 39;
}
function comboKmFor(week: number): number {
  return week <= 14 ? 4 : 3;
}

const LONG_RUN_KM: Record<number, number> = {
  1: 6, 2: 7, 3: 8, 4: 8, 5: 9, 6: 10, 7: 11, 8: 12, 9: 13, 10: 10, 11: 14,
  12: 15, 13: 16, 14: 12, 15: 15, 16: 16, 17: 17, 18: 13, 19: 10, 20: 7, 21: 5,
};

function tueRunFor(week: number): { tipo: string; detalhes: string; pace: string; duracao: number } {
  if (week <= 6) return {
    tipo: "Corrida - Ritmo Moderado",
    detalhes: "20-25 min contínuos em ritmo moderado (consegue falar frases curtas). Pace: 7:15 - 7:30 /km",
    pace: "7:15 - 7:30 /km",
    duracao: 30,
  };
  if (week <= 14) return {
    tipo: "Corrida - Intervalado",
    detalhes: "6-8x400m forte com 90s trote entre os tiros (~30 min total c/ aquecimento). Pace: 6:15 - 6:30 /km",
    pace: "6:15 - 6:30 /km",
    duracao: 30,
  };
  if (week <= 18) return {
    tipo: "Corrida - Tempo Run",
    detalhes: "25-30 min em ritmo forte e constante, perto do ritmo de prova. Pace: 6:50 - 7:05 /km",
    pace: "6:50 - 7:05 /km",
    duracao: 30,
  };
  if (week <= 20) return {
    tipo: "Corrida - Ativação",
    detalhes: "15-20 min leve com 4x100m em ritmo forte. Pace: 6:30 - 6:45 /km",
    pace: "6:30 - 6:45 /km",
    duracao: 30,
  };
  return {
    tipo: "Corrida - Soltura",
    detalhes: "15-20 min bem leve, só para soltar as pernas. Pace: 8:00 - 8:30 /km",
    pace: "8:00 - 8:30 /km",
    duracao: 20,
  };
}

function dateFor(newWeek: number, weekdayIdx: number): Date {
  const ms = NEW_START + ((newWeek - 1) * 7 + weekdayIdx) * 86400000;
  return new Date(ms);
}

const WEEKDAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

interface DayRow {
  date: Date;
  dayName: string;
  week: number;      // semana nova (1-18), usada na exibição
  origWeek: number;  // semana original (5-22), usada nos parâmetros
  phase: string;
  tipo: string;
  atividade: string;
  detalhes: string;
  pace: string;
  duracao: number | null;
  obs: string;
}

function buildRows(): DayRow[] {
  const rows: DayRow[] = [];
  for (let week = 1; week <= TOTAL_WEEKS; week++) {
    const origWeek = week + WEEK_OFFSET;
    const phase = phaseFor(origWeek);
    const isRaceWeek = week === TOTAL_WEEKS;
    const daysInWeek = isRaceWeek ? 4 : 7; // semana da prova para na quinta

    for (let d = 0; d < daysInWeek; d++) {
      const date = dateFor(week, d);
      const dayName = WEEKDAY_NAMES[d];
      const base = { date, dayName, week, origWeek, phase };

      if (d === 0) {
        const sets = setsFor(origWeek);
        rows.push({ ...base, tipo: "Musculação - Pull", atividade: "Costas / Bíceps", detalhes: PULL.map((ex) => `${sets}x ${ex}`).join("; "), pace: "", duracao: pullDurationFor(origWeek), obs: "" });
      } else if (d === 1) {
        const r = tueRunFor(origWeek);
        rows.push({ ...base, tipo: r.tipo, atividade: "Corrida de Qualidade", detalhes: r.detalhes, pace: r.pace, duracao: r.duracao, obs: "" });
      } else if (d === 2) {
        const sets = setsFor(origWeek);
        rows.push({ ...base, tipo: "Musculação - Push", atividade: "Peito / Tríceps", detalhes: PUSH.map((ex) => `${sets}x ${ex}`).join("; "), pace: "", duracao: pushDurationFor(origWeek), obs: "" });
      } else if (d === 3) {
        if (isRaceWeek) {
          rows.push({
            ...base, phase: "Desafio",
            tipo: "Corrida - PROVA", atividade: "São Silvestre",
            detalhes: "15 km - dia da prova! Aqueça 10 min leve, divida o ritmo com calma no início e acelere no segundo terço se estiver bem.",
            pace: "7:10 - 7:30 /km", duracao: 90,
            obs: "Objetivo principal do semestre. Durma bem na véspera e monte o kit (tênis, roupa, número de peito) no dia anterior.",
          });
        } else {
          const ombroSets = ombroSetsFor(origWeek);
          const km = comboKmFor(origWeek);
          rows.push({
            ...base, tipo: "Combo: Corrida leve + Ombro", atividade: `Corrida leve (~${km} km) + Ombro`,
            detalhes: `Corrida leve ${km} km, pace 8:00 - 8:30 /km; Ombro: ${OMBRO.map((ex) => `${ombroSets}x ${ex}`).join("; ")}`,
            pace: "8:00 - 8:30 /km", duracao: comboDurationFor(origWeek),
            obs: "Se passar de 1h, priorize a corrida e faça o ombro em outro momento do dia/semana.",
          });
        }
      } else if (d === 4) {
        rows.push({ ...base, tipo: "Descanso", atividade: "Folga", detalhes: "Descanso total ou caminhada leve opcional (15-20 min)", pace: "", duracao: null, obs: "Dia de recuperação antes das pernas de sábado." });
      } else if (d === 5) {
        const sets = setsFor(origWeek);
        rows.push({ ...base, tipo: "Musculação - Legs", atividade: "Pernas", detalhes: LEGS.map((ex) => `${sets}x ${ex}`).join("; "), pace: "", duracao: legsDurationFor(origWeek), obs: "Cai um dia antes do treino longo de domingo — segure a intensidade (evite ir à falha) para não prejudicar a corrida." });
      } else if (d === 6) {
        const km = LONG_RUN_KM[origWeek];
        const duracao = km * 8;
        const obs = duracao > 60 ? "Esse treino deve passar de 1h — é a única exceção da semana, essencial para preparar o corpo para os 15 km." : "";
        rows.push({ ...base, tipo: "Corrida Longa", atividade: "Treino Longo", detalhes: `${km} km, pace 7:45 - 8:15 /km (consegue conversar)`, pace: "7:45 - 8:15 /km", duracao, obs });
      }
    }
  }
  return rows;
}

function toSubtasks(row: DayRow): string[] {
  const items: string[] = [];
  items.push(`Semana ${row.week}/${TOTAL_WEEKS} · Fase ${row.phase}`);
  if (row.tipo === "Musculação - Pull") {
    items.push(...row.detalhes.split(";").map((s) => s.trim()));
    items.push("+ 2 exercícios adicionais da sua rotina de Pull (não capturados na planilha)");
  } else if (row.detalhes.includes(";")) {
    items.push(...row.detalhes.split(";").map((s) => s.trim()));
  } else {
    items.push(row.detalhes);
  }
  if (row.pace) items.push(`Pace: ${row.pace}`);
  if (row.duracao) items.push(`Duração: ${row.duracao} min`);
  if (row.obs) items.push(`Obs: ${row.obs}`);
  return items.filter(Boolean);
}

async function main() {
  const commit = process.argv.includes("--commit");
  const purgeAll = process.argv.includes("--purge-all");
  const rows = buildRows();
  const startISO = new Date(NEW_START).toISOString().slice(0, 10);

  console.log(`Novo plano: ${rows.length} dias, ${TOTAL_WEEKS} semanas`);
  console.log(`Primeiro dia: ${rows[0].date.toISOString().slice(0, 10)} (${rows[0].dayName}) - ${rows[0].tipo}`);
  console.log(`Último dia:   ${rows[rows.length - 1].date.toISOString().slice(0, 10)} (${rows[rows.length - 1].dayName}) - ${rows[rows.length - 1].tipo}`);
  console.log(`Preserva histórico concluído: ${purgeAll ? "NÃO (--purge-all)" : "sim"}`);

  if (!commit) {
    console.log("\n--- DRY RUN (nenhuma alteração no banco) ---");
    console.log("\nSemana 1 (= semana 5 do plano original):");
    rows.slice(0, 7).forEach((r) => console.log(" ", r.date.toISOString().slice(0, 10), r.dayName.padEnd(8), "|", r.phase.padEnd(6), "|", r.tipo));
    console.log("\nSemana 18 (semana da prova):");
    rows.slice(-4).forEach((r) => console.log(" ", r.date.toISOString().slice(0, 10), r.dayName.padEnd(8), "|", r.phase.padEnd(7), "|", r.tipo));
    console.log("\nProgressão do treino longo (domingos):");
    rows.filter((r) => r.tipo === "Corrida Longa").forEach((r) =>
      console.log(`  S${String(r.week).padStart(2)} (orig ${r.origWeek}) ${r.date.toISOString().slice(0, 10)} - ${LONG_RUN_KM[r.origWeek]} km`));
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
  console.log(`Metas existentes: ${existing.length}`);

  const doneIds = new Set(
    existing
      .filter((g) => g.forceDone === true || g.checkins.length > 0)
      .map((g) => g.id)
  );

  const toDelete = existing.filter((g) => purgeAll || !doneIds.has(g.id));
  const kept = existing.length - toDelete.length;

  console.log(`A apagar: ${toDelete.length}  |  Preservadas (com histórico): ${kept}`);

  await prisma.goal.deleteMany({ where: { id: { in: toDelete.map((g) => g.id) } } });
  console.log(`${toDelete.length} metas apagadas (subtarefas e check-ins em cascata).`);

  for (const row of rows) {
    await prisma.goal.create({
      data: {
        planId: plan.id,
        type: "task",
        title: row.tipo,
        targetDate: row.date,
        forceDone: false,
        subtasks: { create: toSubtasks(row).map((text) => ({ text, done: false })) },
      },
    });
  }
  console.log(`${rows.length} metas novas criadas a partir de ${startISO}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
