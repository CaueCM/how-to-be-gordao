// Geração do bloco de treino Corrida + Musculação até a São Silvestre.
//
// A prova é fixa: 31/12/2026, uma quinta-feira. Partindo da segunda 31/08/2026
// são 122 dias = 17 semanas + 3 dias, ou seja, a quinta da semana 18 cai
// exatamente no dia da prova.
//
// Esta versão assume atleta PARTINDO DO ZERO (destreinado): a base é longa
// (5 semanas), começa com corrida/caminhada alternada, e o volume de força
// entra reduzido e sobe depois — o inverso do bloco anterior, que já
// pressupunha condicionamento acumulado.

export const RACE_NAME = "São Silvestre";
export const RACE_KM = 15;
export const DEFAULT_START_UTC = Date.UTC(2026, 7, 31); // segunda, 31/08/2026
export const DEFAULT_WEEKS = 18;

export const WEEKDAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

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

// Fases: base longa por vir do zero, build e peak encurtados.
export function phaseFor(week: number): string {
  if (week <= 5) return "Base";
  if (week <= 11) return "Build";
  if (week <= 15) return "Peak";
  if (week <= 17) return "Taper";
  return "Semana da Prova";
}

// Do zero: começa em 2 séries para readaptar tendão/articulação, sobe para 3
// a partir da semana 4 e desce de novo no taper.
export function setsFor(week: number): number {
  if (week <= 3) return 2;
  if (week <= 15) return 3;
  return 2;
}

export function ombroSetsFor(week: number): number {
  return week <= 3 ? 2 : 3;
}

function strengthDuration(base: number, sets: number): number {
  return Math.round((base * sets) / 3);
}

export function comboKmFor(week: number): number {
  if (week <= 5) return 2;
  if (week <= 11) return 3;
  return 4;
}

// Progressão do treino longo partindo do zero até os 15 km da prova.
// Semanas 4, 8 e 11 recuam de propósito (semanas de absorção).
export const LONG_RUN_KM: Record<number, number> = {
  1: 4, 2: 5, 3: 6, 4: 5, 5: 7, 6: 8, 7: 9, 8: 7, 9: 10,
  10: 11, 11: 9, 12: 12, 13: 13, 14: 14, 15: 15, 16: 11, 17: 7,
};

export function tueRunFor(week: number): { tipo: string; detalhes: string; pace: string; duracao: number } {
  if (week <= 2) return {
    tipo: "Corrida - Base Leve",
    detalhes: "Alterne 3 min de corrida leve com 2 min de caminhada, 5 rodadas (~25 min). Sem pressa: o objetivo é readaptar, não cansar.",
    pace: "8:30 - 9:00 /km",
    duracao: 25,
  };
  if (week <= 5) return {
    tipo: "Corrida - Base Leve",
    detalhes: "20-25 min contínuos bem leves (consegue conversar frases inteiras). Se faltar fôlego, volte a caminhar 1 min e retome.",
    pace: "8:00 - 8:30 /km",
    duracao: 25,
  };
  if (week <= 11) return {
    tipo: "Corrida - Intervalado",
    detalhes: "5x400m em ritmo forte com 90s de trote entre os tiros (~30 min com aquecimento).",
    pace: "6:30 - 6:50 /km",
    duracao: 30,
  };
  if (week <= 15) return {
    tipo: "Corrida - Tempo Run",
    detalhes: "20-25 min em ritmo forte e constante, perto do ritmo que pretende fazer na prova.",
    pace: "7:00 - 7:20 /km",
    duracao: 30,
  };
  if (week <= 17) return {
    tipo: "Corrida - Ativação",
    detalhes: "15-20 min leve com 4x100m em ritmo forte, recuperação completa entre eles.",
    pace: "6:45 - 7:00 /km",
    duracao: 25,
  };
  return {
    tipo: "Corrida - Soltura",
    detalhes: "15 min bem leve, só para soltar as pernas antes da prova.",
    pace: "8:00 - 8:30 /km",
    duracao: 15,
  };
}

export interface DayRow {
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

export interface BuildOptions {
  startUTC?: number;
  weeks?: number;
}

export function buildPlanRows(opts: BuildOptions = {}): DayRow[] {
  const startUTC = opts.startUTC ?? DEFAULT_START_UTC;
  const weeks = opts.weeks ?? DEFAULT_WEEKS;
  const rows: DayRow[] = [];

  const dateFor = (week: number, weekdayIdx: number) =>
    new Date(startUTC + ((week - 1) * 7 + weekdayIdx) * 86400000);

  for (let week = 1; week <= weeks; week++) {
    const phase = phaseFor(week);
    const isRaceWeek = week === weeks;
    const daysInWeek = isRaceWeek ? 4 : 7; // semana da prova para na quinta

    for (let d = 0; d < daysInWeek; d++) {
      const base = { date: dateFor(week, d), dayName: WEEKDAY_NAMES[d], week, phase };
      const sets = setsFor(week);

      if (d === 0) {
        rows.push({
          ...base, tipo: "Musculação - Pull", atividade: "Costas / Bíceps",
          detalhes: PULL.map((ex) => `${sets}x ${ex}`).join("; "),
          pace: "", duracao: strengthDuration(27, sets),
          obs: week <= 3 ? "Volta do zero: pegue carga folgada e pare 2 repetições antes da falha." : "",
        });
      } else if (d === 1) {
        const r = tueRunFor(week);
        rows.push({ ...base, tipo: r.tipo, atividade: "Corrida de Qualidade", detalhes: r.detalhes, pace: r.pace, duracao: r.duracao, obs: "" });
      } else if (d === 2) {
        rows.push({
          ...base, tipo: "Musculação - Push", atividade: "Peito / Tríceps",
          detalhes: PUSH.map((ex) => `${sets}x ${ex}`).join("; "),
          pace: "", duracao: strengthDuration(25, sets),
          obs: week <= 3 ? "Volta do zero: pegue carga folgada e pare 2 repetições antes da falha." : "",
        });
      } else if (d === 3) {
        if (isRaceWeek) {
          rows.push({
            ...base, phase: "Desafio",
            tipo: "Corrida - PROVA", atividade: RACE_NAME,
            detalhes: `${RACE_KM} km - dia da prova! Aqueça 10 min leve, segure o ritmo no primeiro terço e acelere no final se estiver bem.`,
            pace: "7:10 - 7:30 /km", duracao: 100,
            obs: "Objetivo do bloco. Durma bem na véspera e separe o kit (tênis, roupa, número de peito) no dia anterior.",
          });
        } else {
          const km = comboKmFor(week);
          rows.push({
            ...base, tipo: "Combo: Corrida leve + Ombro", atividade: `Corrida leve (~${km} km) + Ombro`,
            detalhes: `Corrida leve ${km} km, pace 8:00 - 8:30 /km; Ombro: ${OMBRO.map((ex) => `${ombroSetsFor(week)}x ${ex}`).join("; ")}`,
            pace: "8:00 - 8:30 /km", duracao: strengthDuration(39, ombroSetsFor(week)) + km * 8,
            obs: "Se passar de 1h, priorize a corrida e faça o ombro em outro momento do dia.",
          });
        }
      } else if (d === 4) {
        rows.push({ ...base, tipo: "Descanso", atividade: "Folga", detalhes: "Descanso total ou caminhada leve opcional (15-20 min)", pace: "", duracao: null, obs: "Dia de recuperação antes das pernas de sábado." });
      } else if (d === 5) {
        rows.push({
          ...base, tipo: "Musculação - Legs", atividade: "Pernas",
          detalhes: LEGS.map((ex) => `${sets}x ${ex}`).join("; "),
          pace: "", duracao: strengthDuration(35, sets),
          obs: "Cai um dia antes do treino longo — segure a intensidade (evite ir à falha) para não prejudicar a corrida.",
        });
      } else if (d === 6) {
        const km = LONG_RUN_KM[week];
        const duracao = km * 8;
        const isStepBack = week > 1 && km < (LONG_RUN_KM[week - 1] ?? 0);
        const detalhes = week <= 2
          ? `${km} km alternando corrida leve e caminhada quando precisar, pace 8:30 - 9:00 /km`
          : `${km} km, pace 7:45 - 8:15 /km (consegue conversar)`;
        const obs = isStepBack
          ? "Semana de absorção: o volume recua de propósito para o corpo consolidar o ganho. Não tente compensar."
          : duracao > 60
            ? "Esse treino passa de 1h — é a única exceção da semana, e é o que prepara o corpo para os 15 km."
            : "";
        rows.push({ ...base, tipo: "Corrida Longa", atividade: "Treino Longo", detalhes, pace: week <= 2 ? "8:30 - 9:00 /km" : "7:45 - 8:15 /km", duracao, obs });
      }
    }
  }
  return rows;
}

export function toSubtasks(row: DayRow, totalWeeks = DEFAULT_WEEKS): string[] {
  const items: string[] = [`Semana ${row.week}/${totalWeeks} · Fase ${row.phase}`];
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
