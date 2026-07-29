const WEEKDAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]; // index matches JS Date#getUTCDay()

export const HABIT_WEEKDAYS: Record<string, number[]> = {
  "todos os dias": [0, 1, 2, 3, 4, 5, 6],
  "1x por semana": [1],
  "2x por semana": [1, 4],
  "3x por semana": [1, 3, 5],
  "5x por semana": [1, 2, 3, 4, 5],
};

const DEFAULT_FREQUENCY = "3x por semana";

export function habitRecurrenceRule(frequency: string): string {
  if (frequency === "todos os dias") return "RRULE:FREQ=DAILY";
  const days = HABIT_WEEKDAYS[frequency] ?? HABIT_WEEKDAYS[DEFAULT_FREQUENCY];
  const byday = days.map((d) => WEEKDAY_CODES[d]).join(",");
  return `RRULE:FREQ=WEEKLY;BYDAY=${byday}`;
}

export function isHabitCheckpointDay(frequency: string, dateIso: string): boolean {
  const days = HABIT_WEEKDAYS[frequency] ?? HABIT_WEEKDAYS[DEFAULT_FREQUENCY];
  const weekday = new Date(`${dateIso}T00:00:00.000Z`).getUTCDay();
  return days.includes(weekday);
}
