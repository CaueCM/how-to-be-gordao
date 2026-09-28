// Geração do bloco de treino Corrida + Musculação até a São Silvestre.
//
// A prova é a âncora fixa: 31/12, sempre uma quinta-feira em 2026. O início e
// a quantidade de semanas são DERIVADOS dela, não escritos à mão — a versão
// anterior tinha a data de início fixa no código e envelheceu em um mês.
//
// Assume atleta partindo do zero: base longa, corrida/caminhada alternada nas
// primeiras semanas, força entrando com volume reduzido.

export const RACE_NAME = "São Silvestre";
export const RACE_KM = 15;
export const RACE_DATE_UTC = Date.UTC(2026, 11, 31); // quinta, 31/12/2026

export const WEEKDAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const DAY_MS = 86400000;

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

/** Segunda-feira do dia informado, ou a segunda seguinte se já passou dela. */
export function mondayOnOrAfter(utc: number): number {
  const weekday = new Date(utc).getUTCDay(); // 0 = domingo
  const untilMonday = weekday === 1 ? 0 : (8 - weekday) % 7;
  return utc + untilMonday * DAY_MS;
}

/**
 * Quantas semanas cabem entre o início e o dia da prova.
 *
 * O bloco começa numa segunda e a prova é numa quinta, então a diferença em
 * dias sempre deixa resto 3 — a prova cai na quinta da última semana, que é
 * exatamente o formato que o plano usa (última semana com 4 dias).
 */
export function weeksUntilRace(startUTC: number, raceUTC = RACE_DATE_UTC): number {
  const days = Math.round((raceUTC - startUTC) / DAY_MS);
  return Math.max(1, Math.floor(days / 7) + 1);
}

export type Phase = "Base" | "Build" | "Peak" | "Taper" | "Semana da Prova";

/**
 * Fase da semana, como proporção do bloco em vez de semanas absolutas.
 *
 * Assim o mesmo desenho serve para um bloco de 14 ou de 18 semanas: a última
 * semana é a da prova, a anterior é taper, e o restante se divide em base
 * (35%), build (45%) e peak (20%).
 */
export function phaseFor(week: number, weeks: number): Phase {
  if (week >= weeks) return "Semana da Prova";
  if (week === weeks - 1) return "Taper";
  const build = Math.max(1, weeks - 2);
  const baseEnd = Math.max(2, Math.round(build * 0.35));
  const buildEnd = Math.max(baseEnd + 1, Math.round(build * 0.8));
  if (week <= baseEnd) return "Base";
  if (week <= buildEnd) return "Build";
  return "Peak";
}

/** Km a mais que o longão pode ganhar de uma semana para a outra. */
const MAX_WEEKLY_STEP = 1;

/**
 * Progressão do treino longo, em km por semana.
 *
 * Sobe até um pico de `raceKm - 2` (num 15 km não é preciso cobrir a distância
 * da prova no treino), recuando nas semanas de absorção — cada 4ª, nunca a
 * última. Fecha com taper e a prova.
 *
 * O pico é limitado pelo tempo disponível, e não só pela distância da prova:
 * com poucas semanas, mirar nos 13 km exigiria saltos de vários km por semana.
 * Num bloco curto o resultado é um pico mais baixo — que é honesto: significa
 * chegar sub-preparado, e isso tem que aparecer no plano em vez de virar uma
 * rampa impossível de cumprir sem se machucar.
 */
export function longRunPlan(weeks: number, raceKm = RACE_KM): number[] {
  if (weeks <= 1) return [raceKm];
  if (weeks === 2) return [Math.max(5, Math.round(raceKm * 0.55)), raceKm];

  const build = weeks - 2;
  const first = 4;
  const isAbsorption = (w: number) => w % 4 === 0 && w < build;

  let absorptions = 0;
  for (let w = 1; w <= build; w++) if (isAbsorption(w)) absorptions += 1;
  const progressing = build - absorptions;

  const reachable = first + Math.max(0, progressing - 1) * MAX_WEEKLY_STEP;
  const peak = Math.max(first, Math.min(raceKm - 2, reachable));
  const step = progressing > 1 ? (peak - first) / (progressing - 1) : 0;
  const cut = Math.max(1.5, step * 2);

  const km: number[] = [];
  let cur = first;
  for (let w = 1; w <= build; w++) {
    if (isAbsorption(w)) {
      km.push(Math.max(3, Math.round(cur - cut)));
    } else {
      km.push(Math.round(cur));
      cur += step;
    }
  }
  // O taper alivia em relação ao pico; nunca pode ficar acima dele.
  km.push(Math.min(Math.max(5, Math.round(raceKm * 0.55)), peak));
  km.push(raceKm); // prova
  return km;
}

/** Séries de força. Começa baixo por vir do zero e recua no taper. */
export function setsFor(week: number, weeks: number): number {
  if (week <= 3) return 2; // readaptação de tendão e articulação
  const phase = phaseFor(week, weeks);
  return phase === "Taper" || phase === "Semana da Prova" ? 2 : 3;
}

export function ombroSetsFor(week: number, weeks: number): number {
  return week <= 3 ? 2 : setsFor(week, weeks);
}

function strengthDuration(base: number, sets: number): number {
  return Math.round((base * sets) / 3);
}

export function comboKmFor(week: number, weeks: number): number {
  const phase = phaseFor(week, weeks);
  if (phase === "Base") return 2;
  if (phase === "Build") return 3;
  return 4;
}

/** Corrida de qualidade da terça. Intervalado só entra depois da base. */
export function tueRunFor(week: number, weeks: number): { tipo: string; detalhes: string; pace: string; duracao: number } {
  const phase = phaseFor(week, weeks);
  if (week <= 2) return {
    tipo: "Corrida - Base Leve",
    detalhes: "Alterne 3 min de corrida leve com 2 min de caminhada, 5 rodadas (~25 min). Sem pressa: o objetivo é readaptar, não cansar.",
    pace: "8:30 - 9:00 /km",
    duracao: 25,
  };
  if (phase === "Base") return {
    tipo: "Corrida - Base Leve",
    detalhes: "20-25 min contínuos bem leves (consegue conversar frases inteiras). Se faltar fôlego, caminhe 1 min e retome.",
    pace: "8:00 - 8:30 /km",
    duracao: 25,
  };
  if (phase === "Build") return {
    tipo: "Corrida - Intervalado",
    detalhes: "5x400m em ritmo forte com 90s de trote entre os tiros (~30 min com aquecimento).",
    pace: "6:30 - 6:50 /km",
    duracao: 30,
  };
  if (phase === "Peak") return {
    tipo: "Corrida - Tempo Run",
    detalhes: "20-25 min em ritmo forte e constante, perto do ritmo que pretende fazer na prova.",
    pace: "7:00 - 7:20 /km",
    duracao: 30,
  };
  if (phase === "Taper") return {
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
  phase: Phase;
  tipo: string;
  atividade: string;
  detalhes: string;
  pace: string;
  duracao: number | null;
  obs: string;
}

export interface PlanShape {
  startUTC: number;
  weeks: number;
  rows: DayRow[];
}

/**
 * Monta o bloco a partir de uma data de referência (por padrão, agora).
 *
 * Começa na segunda da semana corrente se hoje já for segunda, senão na
 * seguinte — o plano é ancorado nos dias da semana (segunda Pull, domingo
 * longão), então começar no meio da semana deixaria a primeira quebrada.
 */
export function buildPlan(fromUTC: number = Date.now()): PlanShape {
  const startUTC = mondayOnOrAfter(fromUTC);
  const weeks = weeksUntilRace(startUTC);
  const longRun = longRunPlan(weeks);
  const rows: DayRow[] = [];

  const dateFor = (week: number, weekdayIdx: number) =>
    new Date(startUTC + ((week - 1) * 7 + weekdayIdx) * DAY_MS);

  for (let week = 1; week <= weeks; week++) {
    const phase = phaseFor(week, weeks);
    const isRaceWeek = week === weeks;
    const daysInWeek = isRaceWeek ? 4 : 7; // a semana da prova para na quinta
    const sets = setsFor(week, weeks);
    const novato = week <= 3 ? "Volta do zero: pegue carga folgada e pare 2 repetições antes da falha." : "";

    for (let d = 0; d < daysInWeek; d++) {
      const base = { date: dateFor(week, d), dayName: WEEKDAY_NAMES[d], week, phase };

      if (d === 0) {
        rows.push({
          ...base, tipo: "Musculação - Pull", atividade: "Costas / Bíceps",
          detalhes: PULL.map((ex) => `${sets}x ${ex}`).join("; "),
          pace: "", duracao: strengthDuration(27, sets), obs: novato,
        });
      } else if (d === 1) {
        const r = tueRunFor(week, weeks);
        rows.push({ ...base, tipo: r.tipo, atividade: "Corrida de Qualidade", detalhes: r.detalhes, pace: r.pace, duracao: r.duracao, obs: "" });
      } else if (d === 2) {
        rows.push({
          ...base, tipo: "Musculação - Push", atividade: "Peito / Tríceps",
          detalhes: PUSH.map((ex) => `${sets}x ${ex}`).join("; "),
          pace: "", duracao: strengthDuration(25, sets), obs: novato,
        });
      } else if (d === 3) {
        if (isRaceWeek) {
          rows.push({
            ...base, phase: "Semana da Prova",
            tipo: "Corrida - PROVA", atividade: RACE_NAME,
            detalhes: `${RACE_KM} km - dia da prova! Aqueça 10 min leve, segure o ritmo no primeiro terço e acelere no final se estiver bem.`,
            pace: "7:10 - 7:30 /km", duracao: 100,
            obs: "Objetivo do bloco. Durma bem na véspera e separe o kit (tênis, roupa, número de peito) no dia anterior.",
          });
        } else {
          const km = comboKmFor(week, weeks);
          const ombroSets = ombroSetsFor(week, weeks);
          rows.push({
            ...base, tipo: "Combo: Corrida leve + Ombro", atividade: `Corrida leve (~${km} km) + Ombro`,
            detalhes: `Corrida leve ${km} km, pace 8:00 - 8:30 /km; Ombro: ${OMBRO.map((ex) => `${ombroSets}x ${ex}`).join("; ")}`,
            pace: "8:00 - 8:30 /km", duracao: strengthDuration(39, ombroSets) + km * 8,
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
        const km = longRun[week - 1];
        const prev = week > 1 ? longRun[week - 2] : 0;
        const stepBack = week > 1 && km < prev;
        const detalhes = week <= 2
          ? `${km} km alternando corrida leve e caminhada quando precisar, pace 8:30 - 9:00 /km`
          : `${km} km, pace 7:45 - 8:15 /km (consegue conversar)`;
        const obs = stepBack
          ? "Semana de absorção: o volume recua de propósito para o corpo consolidar o ganho. Não tente compensar."
          : km * 8 > 60
            ? "Esse treino passa de 1h — é a única exceção da semana, e é o que prepara o corpo para os 15 km."
            : "";
        rows.push({
          ...base, tipo: "Corrida Longa", atividade: "Treino Longo", detalhes,
          pace: week <= 2 ? "8:30 - 9:00 /km" : "7:45 - 8:15 /km",
          duracao: km * 8, obs,
        });
      }
    }
  }

  return { startUTC, weeks, rows };
}

export function toSubtasks(row: DayRow, totalWeeks: number): string[] {
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

/** Resumo para a tela, sem precisar gerar o plano inteiro no cliente. */
export function planSummary(fromUTC: number = Date.now()): { weeks: number; firstDay: string; raceDay: string } {
  const startUTC = mondayOnOrAfter(fromUTC);
  return {
    weeks: weeksUntilRace(startUTC),
    firstDay: new Date(startUTC).toISOString().slice(0, 10),
    raceDay: new Date(RACE_DATE_UTC).toISOString().slice(0, 10),
  };
}
