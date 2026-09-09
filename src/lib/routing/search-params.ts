export type SearchParams = Record<string, string | string[] | undefined>;

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export function readParam(params: SearchParams, key: string): string {
  const value = params[key];
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw.trim() : "";
}

export function readOption<T extends string>(
  params: SearchParams,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = readParam(params, key);
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function readPage(params: SearchParams): number {
  const parsed = Number.parseInt(readParam(params, "page"), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function readPageSize(
  params: SearchParams,
  fallback = DEFAULT_PAGE_SIZE,
): number {
  const parsed = Number.parseInt(readParam(params, "pageSize"), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_PAGE_SIZE);
}

export function queryString(
  values: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === "" || value === null) continue;
    search.set(key, String(value));
  }

  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

export function hrefWith(
  path: string,
  values: Record<string, string | number | undefined>,
): string {
  return `${path}${queryString(values)}`;
}

export type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const offset = (page - 1) * pageSize;
  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pageSize,
    total: items.length,
  };
}
