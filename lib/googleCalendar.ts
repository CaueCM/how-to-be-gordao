import { habitRecurrenceRule } from "@/lib/habitSchedule";

const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

interface CalendarEventInput {
  title: string;
  startDate: string; // yyyy-mm-dd
  recurrence?: string;
}

function addOneDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function eventBody(input: CalendarEventInput) {
  return {
    summary: input.title,
    start: { date: input.startDate },
    end: { date: addOneDay(input.startDate) },
    recurrence: input.recurrence ? [input.recurrence] : undefined,
  };
}

export async function createCalendarEvent(accessToken: string, input: CalendarEventInput): Promise<string | null> {
  try {
    const res = await fetch(EVENTS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(eventBody(input)),
    });
    if (!res.ok) {
      console.error("Google Calendar create failed", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return (data.id as string) ?? null;
  } catch (err) {
    console.error("Google Calendar create error", err);
    return null;
  }
}

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  input: CalendarEventInput
): Promise<boolean> {
  try {
    const res = await fetch(`${EVENTS_URL}/${eventId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(eventBody(input)),
    });
    if (!res.ok) {
      console.error("Google Calendar update failed", res.status, await res.text());
    }
    return res.ok;
  } catch (err) {
    console.error("Google Calendar update error", err);
    return false;
  }
}

export async function deleteCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  try {
    const res = await fetch(`${EVENTS_URL}/${eventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok && res.status !== 404 && res.status !== 410) {
      console.error("Google Calendar delete failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("Google Calendar delete error", err);
  }
}

export function numericRecurrenceRule(frequency: "daily" | "weekly", untilDate: string): string {
  const until = untilDate.replace(/-/g, "");
  return `RRULE:FREQ=${frequency === "daily" ? "DAILY" : "WEEKLY"};UNTIL=${until}`;
}

export { habitRecurrenceRule };
