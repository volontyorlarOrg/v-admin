export const EVENT_TIME_ZONE = "Asia/Tashkent";

export function isIsoDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

export function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const SEAL_DATE = new Intl.DateTimeFormat("ru-RU", {
  timeZone: EVENT_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function sealDate(value: Date | string): string {
  return SEAL_DATE.format(typeof value === "string" ? new Date(value) : value);
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
