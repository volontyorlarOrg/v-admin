import { EVENT_TIME_ZONE } from "@/lib/datetime";
import {
  APPLICATION_STATUSES,
  REGIONS,
  VACANCY_FORMATS,
  VACANCY_STATES,
  type ApplicationStatus,
  type Region,
  type VacancyFormat,
  type VacancyState,
} from "@/lib/domain/vocabulary";
import { vacancyStateOf, type ApprovalSubject } from "@/lib/vacancies/approval";

const DAY = 86_400_000;
const TARGET_BUCKETS = 30;

const dayKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export type Slice<K extends string> = { key: K; value: number; share: number };

export type TrendBucket = { start: string; value: number; share: number };

export type Trend = {
  buckets: TrendBucket[];
  from: string;
  to: string;
  total: number;
  peak: number;
};

type Counted<Item, Key extends string> = {
  items: readonly Item[];
  order: readonly Key[];
  keyOf: (item: Item) => Key | undefined;
};

function tally<Item, Key extends string>({ items, order, keyOf }: Counted<Item, Key>) {
  const counts = new Map<Key, number>(order.map((key) => [key, 0]));

  for (const item of items) {
    const key = keyOf(item);
    if (key === undefined) continue;
    const current = counts.get(key);
    if (current === undefined) continue;
    counts.set(key, current + 1);
  }

  return order.map((key) => ({ key, value: counts.get(key) ?? 0 }));
}

export function ofWhole<Key extends string>(
  counted: Array<{ key: Key; value: number }>,
): Slice<Key>[] {
  const total = counted.reduce((sum, entry) => sum + entry.value, 0);
  if (total === 0) return [];

  return counted.map((entry) => ({ ...entry, share: entry.value / total }));
}

function ranked<Key extends string>(
  counted: Array<{ key: Key; value: number }>,
  sorted: boolean,
): Slice<Key>[] {
  const present = counted.filter((entry) => entry.value > 0);
  if (present.length === 0) return [];

  const peak = present.reduce((highest, entry) => Math.max(highest, entry.value), 0);
  const ordered = sorted ? [...present].sort((a, b) => b.value - a.value) : present;

  return ordered.map((entry) => ({ ...entry, share: entry.value / peak }));
}

export function vacancyStates(
  vacancies: readonly ApprovalSubject[],
): Slice<VacancyState>[] {
  return ranked(
    tally({
      items: vacancies,
      order: VACANCY_STATES,
      keyOf: (item) => vacancyStateOf(item),
    }),
    false,
  );
}

export function vacancyFormats(
  vacancies: readonly { format: VacancyFormat }[],
): Slice<VacancyFormat>[] {
  return ranked(
    tally({
      items: vacancies,
      order: VACANCY_FORMATS,
      keyOf: (item) => item.format,
    }),
    false,
  );
}

export function vacancyRegions(
  vacancies: readonly { region: Region }[],
): Slice<Region>[] {
  return ranked(
    tally({ items: vacancies, order: REGIONS, keyOf: (item) => item.region }),
    true,
  );
}

export function applicationStatuses(
  applications: readonly { status: ApplicationStatus }[],
): Slice<ApplicationStatus>[] {
  return ranked(
    tally({
      items: applications,
      order: APPLICATION_STATUSES,
      keyOf: (item) => item.status,
    }),
    false,
  );
}

function startOfDay(stamp: number): number {
  const parts = dayKey.formatToParts(new Date(stamp));
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return Date.UTC(value("year"), value("month") - 1, value("day"));
}

export function trendOf(dates: readonly (string | undefined)[]): Trend | null {
  const stamps: number[] = [];

  for (const date of dates) {
    if (!date) continue;
    const stamp = Date.parse(date);
    if (Number.isFinite(stamp)) stamps.push(startOfDay(stamp));
  }

  if (stamps.length === 0) return null;

  const first = Math.min(...stamps);
  const last = Math.max(...stamps);
  const days = Math.round((last - first) / DAY) + 1;
  const span = Math.max(1, Math.ceil(days / TARGET_BUCKETS));
  const values = new Array<number>(Math.ceil(days / span)).fill(0);

  for (const stamp of stamps) {
    const index = Math.floor((stamp - first) / (span * DAY));
    values[index] = (values[index] ?? 0) + 1;
  }

  const peak = values.reduce((highest, value) => Math.max(highest, value), 0);

  return {
    from: new Date(first).toISOString(),
    to: new Date(last).toISOString(),
    total: stamps.length,
    peak,
    buckets: values.map((value, index) => ({
      start: new Date(first + index * span * DAY).toISOString(),
      value,
      share: peak > 0 ? value / peak : 0,
    })),
  };
}

export function submissionTrend(
  applications: readonly { submittedAt?: string | undefined }[],
): Trend | null {
  return trendOf(applications.map((application) => application.submittedAt));
}

export function joinTrend(users: readonly { createdAt: string }[]): Trend | null {
  return trendOf(users.map((user) => user.createdAt));
}
