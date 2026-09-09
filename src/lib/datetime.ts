export const EVENT_TIME_ZONE = "Asia/Tashkent";

export function isIsoDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

export function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
