import type { Plan } from "./types";

export const INITIAL_PLANS: Plan[] = [
  {
    id: "p1",
    name: "Saúde",
    icon: "pulse",
    goals: [
      {
        id: "g1",
        type: "numeric",
        title: "Perder peso",
        unit: "kg",
        startValue: 82,
        currentValue: 78,
        targetValue: 75,
        targetDate: "2026-09-15",
        planStartDate: "2026-07-01",
        frequency: "weekly",
        checkins: [
          { date: "2026-07-19", value: 79, note: "" },
          { date: "2026-07-12", value: 80, note: "" },
          { date: "2026-07-05", value: 81, note: "" },
        ],
      },
      {
        id: "g2",
        type: "habit",
        title: "Treinar 3x por semana",
        targetFrequency: "3x por semana",
        streakCurrent: 5,
        streakBest: 12,
        checkins: [
          { date: "2026-07-25", done: true, note: "" },
          { date: "2026-07-23", done: true, note: "" },
          { date: "2026-07-21", done: true, note: "" },
        ],
      },
    ],
  },
  {
    id: "p2",
    name: "Leitura",
    icon: "book",
    goals: [
      {
        id: "g3",
        type: "numeric",
        title: "Ler Sapiens",
        unit: "páginas",
        startValue: 0,
        currentValue: 180,
        targetValue: 300,
        targetDate: "2026-08-20",
        planStartDate: "2026-07-01",
        frequency: "daily",
        checkins: [
          { date: "2026-07-25", value: 180, note: "" },
          { date: "2026-07-24", value: 172, note: "" },
        ],
      },
      {
        id: "g4",
        type: "task",
        title: "Escrever resenha do livro",
        targetDate: "2026-07-20",
        forceDone: false,
        subtasks: [
          { id: "st1", text: "Reler capítulo final", done: true },
          { id: "st2", text: "Rascunho da resenha", done: true },
          { id: "st3", text: "Revisão final", done: false },
        ],
        checkins: [],
      },
    ],
  },
  {
    id: "p3",
    name: "Carreira",
    icon: "briefcase",
    goals: [
      {
        id: "g5",
        type: "task",
        title: "Preparar apresentação Q3",
        targetDate: "2026-07-10",
        forceDone: true,
        subtasks: [
          { id: "st4", text: "Levantar dados", done: true },
          { id: "st5", text: "Montar slides", done: true },
          { id: "st6", text: "Ensaiar apresentação", done: true },
        ],
        checkins: [],
      },
      {
        id: "g6",
        type: "habit",
        title: "Café de networking semanal",
        targetFrequency: "1x por semana",
        streakCurrent: 0,
        streakBest: 4,
        checkins: [{ date: "2026-07-10", done: false, note: "" }],
      },
    ],
  },
];
