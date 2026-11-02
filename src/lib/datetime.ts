export const EVENT_TIME_ZONE = "Asia/Tashkent";

export function isIsoDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

export function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const DAY_KEY = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function tashkentDay(value: Date | string): string {
  return DAY_KEY.format(typeof value === "string" ? new Date(value) : value);
}

export function isSameTashkentDay(value: string | undefined, now: Date): boolean {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && tashkentDay(parsed) === tashkentDay(now);
}

export function shiftDay(day: string, days: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const shifted = new Date(
    Date.UTC(year ?? 1970, (month ?? 1) - 1, (date ?? 1) + days),
  );
  return shifted.toISOString().slice(0, 10);
}

const TASHKENT_OFFSET = "+05:00";

export function tashkentDayStart(day: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
  const start = new Date(`${day}T00:00:00.000${TASHKENT_OFFSET}`);
  return Number.isNaN(start.getTime()) ? undefined : start.toISOString();
}

export function tashkentDayEnd(day: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
  const end = new Date(`${day}T23:59:59.999${TASHKENT_OFFSET}`);
  return Number.isNaN(end.getTime()) ? undefined : end.toISOString();
}

export type Waited = { unit: "hour" | "day" | "week"; value: number; days: number };

export function waited(
  since: string | Date | null | undefined,
  now: Date,
): Waited | null {
  const start = since instanceof Date ? since : toDate(since ?? null);
  if (!start || Number.isNaN(start.getTime())) return null;
  const hours = Math.max(0, (now.getTime() - start.getTime()) / 3_600_000);
  const days = hours / 24;
  if (hours < 24) return { unit: "hour", value: Math.max(1, Math.floor(hours)), days };
  if (days < 14) return { unit: "day", value: Math.floor(days), days };
  return { unit: "week", value: Math.floor(days / 7), days };
}
