import { config } from "dotenv";
config({ path: __dirname + "/../.env.local" });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const USER_EMAIL = "cauemuriano@gmail.com";
const PLAN_NAME = "Corrida + Musculação (Meia Maratona)";
const PLAN_ICON = "pulse";

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

function dateFor(week: number, weekdayIdx: number): Date {
  // week 1 Monday = 2026-08-03 (UTC date-only)
  const base = Date.UTC(2026, 7, 3);
  const ms = base + ((week - 1) * 7 + weekdayIdx) * 86400000;
  return new Date(ms);
}

const WEEKDAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

interface DayRow {
  date: Date;
  dayName: string;
  week: number;
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
  for (let week = 1; week <= 22; week++) {
    const phase = phaseFor(week);
    const isRaceWeek = week === 22;
    const daysInWeek = isRaceWeek ? 4 : 7; // week 22 stops Thursday (race day)

    for (let d = 0; d < daysInWeek; d++) {
      const date = dateFor(week, d);
      const dayName = WEEKDAY_NAMES[d];

      if (d === 0) {
        // Monday - Pull
        const sets = setsFor(week);
        const detalhes = PULL.map((ex) => `${sets}x ${ex}`).join("; ");
        rows.push({ date, dayName, week, phase, tipo: "Musculação - Pull", atividade: "Costas / Bíceps", detalhes, pace: "", duracao: pullDurationFor(week), obs: "" });
      } else if (d === 1) {
        // Tuesday - Corrida de Qualidade
        const r = tueRunFor(week);
        rows.push({ date, dayName, week, phase, tipo: r.tipo, atividade: "Corrida de Qualidade", detalhes: r.detalhes, pace: r.pace, duracao: r.duracao, obs: "" });
      } else if (d === 2) {
        // Wednesday - Push
        const sets = setsFor(week);
        const detalhes = PUSH.map((ex) => `${sets}x ${ex}`).join("; ");
        rows.push({ date, dayName, week, phase, tipo: "Musculação - Push", atividade: "Peito / Tríceps", detalhes, pace: "", duracao: pushDurationFor(week), obs: "" });
      } else if (d === 3) {
        if (isRaceWeek) {
          // Thursday of week 22 = race day
          rows.push({
            date, dayName, week, phase: "Desafio",
            tipo: "Corrida - PROVA", atividade: "São Silvestre",
            detalhes: "15 km - dia da prova! Aqueça 10 min leve, divida o ritmo com calma no início e acelere no segundo terço se estiver bem.",
            pace: "7:10 - 7:30 /km", duracao: 90,
            obs: "Objetivo principal do semestre. Durma bem na véspera e monte o kit (tênis, roupa, número de peito) no dia anterior.",
          });
        } else {
          const ombroSets = ombroSetsFor(week);
          const km = comboKmFor(week);
          const detalhes = `Corrida leve ${km} km, pace 8:00 - 8:30 /km; Ombro: ${OMBRO.map((ex) => `${ombroSets}x ${ex}`).join("; ")}`;
          rows.push({
            date, dayName, week, phase, tipo: "Combo: Corrida leve + Ombro", atividade: `Corrida leve (~${km} km) + Ombro`,
            detalhes, pace: "8:00 - 8:30 /km", duracao: comboDurationFor(week),
            obs: "Se passar de 1h, priorize a corrida e faça o ombro em outro momento do dia/semana.",
          });
        }
      } else if (d === 4) {
        // Friday - Descanso
        rows.push({ date, dayName, week, phase, tipo: "Descanso", atividade: "Folga", detalhes: "Descanso total ou caminhada leve opcional (15-20 min)", pace: "", duracao: null, obs: "Dia de recuperação antes das pernas de sábado." });
      } else if (d === 5) {
        // Saturday - Legs
        const sets = setsFor(week);
        const detalhes = LEGS.map((ex) => `${sets}x ${ex}`).join("; ");
        rows.push({ date, dayName, week, phase, tipo: "Musculação - Legs", atividade: "Pernas", detalhes, pace: "", duracao: legsDurationFor(week), obs: "Cai um dia antes do treino longo de domingo — segure a intensidade (evite ir à falha) para não prejudicar a corrida." });
      } else if (d === 6) {
        // Sunday - Corrida Longa
        const km = LONG_RUN_KM[week];
        const duracao = km * 8;
        const obs = duracao > 60 ? "Esse treino deve passar de 1h — é a única exceção da semana, essencial para preparar o corpo para os 15 km/21 km." : "";
        rows.push({ date, dayName, week, phase, tipo: "Corrida Longa", atividade: "Treino Longo", detalhes: `${km} km, pace 7:45 - 8:15 /km (consegue conversar)`, pace: "7:45 - 8:15 /km", duracao, obs });
      }
    }
  }
  return rows;
}

function toSubtasks(row: DayRow): string[] {
  const items: string[] = [];
  items.push(`Semana ${row.week} · Fase ${row.phase}`);
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
  const rows = buildRows();

  console.log(`Total de dias gerados: ${rows.length}`);
  console.log("Primeiro dia:", rows[0].date.toISOString().slice(0, 10), rows[0].tipo);
  console.log("Último dia:", rows[rows.length - 1].date.toISOString().slice(0, 10), rows[rows.length - 1].tipo);

  if (!commit) {
    console.log("\n--- DRY RUN (nenhuma alteração no banco) ---");
    console.log("Amostra semana 1:");
    rows.slice(0, 7).forEach((r) => console.log(r.date.toISOString().slice(0, 10), r.dayName, "|", r.tipo, "|", r.atividade));
    console.log("\nAmostra semana 22 (final):");
    rows.slice(-4).forEach((r) => console.log(r.date.toISOString().slice(0, 10), r.dayName, "|", r.tipo, "|", r.atividade));

    if (process.argv.includes("--verify")) {
      const week10Sun = rows.find((r) => r.week === 10 && r.dayName === "Domingo")!;
      const week15Tue = rows.find((r) => r.week === 15 && r.dayName === "Terça")!;
      console.log("\nSemana 10 Domingo:", week10Sun.date.toISOString().slice(0, 10), week10Sun.detalhes, "| duracao:", week10Sun.duracao, "| obs:", week10Sun.obs);
      console.log("Semana 15 Terça:", week15Tue.date.toISOString().slice(0, 10), week15Tue.tipo, "|", week15Tue.detalhes);

      const monRow = rows.find((r) => r.week === 1 && r.dayName === "Segunda")!;
      console.log("\nSubtasks (Seg semana 1, Pull):");
      toSubtasks(monRow).forEach((s) => console.log(" -", s));

      const thuRow = rows.find((r) => r.week === 1 && r.dayName === "Quinta")!;
      console.log("\nSubtasks (Qui semana 1, Combo):");
      toSubtasks(thuRow).forEach((s) => console.log(" -", s));

      const raceRow = rows[rows.length - 1];
      console.log("\nSubtasks (dia da prova):");
      toSubtasks(raceRow).forEach((s) => console.log(" -", s));
    }
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
  if (!user) throw new Error(`Usuário ${USER_EMAIL} não encontrado`);

  const plan = await prisma.plan.create({
    data: { userId: user.id, name: PLAN_NAME, icon: PLAN_ICON },
  });
  console.log(`Plano criado: ${plan.id} - ${plan.name}`);

  for (const row of rows) {
    const subtasks = toSubtasks(row);
    await prisma.goal.create({
      data: {
        planId: plan.id,
        type: "task",
        title: row.tipo,
        targetDate: row.date,
        forceDone: false,
        subtasks: { create: subtasks.map((text) => ({ text, done: false })) },
      },
    });
  }
  console.log(`${rows.length} desafios criados no plano "${PLAN_NAME}".`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
