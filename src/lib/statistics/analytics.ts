import { z } from "zod";
import { readOption, type SearchParams } from "@/lib/routing/search-params";

export const ANALYTICS_RANGES = ["30", "90"] as const;

export function analyticsDays(params: SearchParams): 30 | 90 {
  return readOption(params, "days", ANALYTICS_RANGES) === "90" ? 90 : 30;
}

const count = z.number().int().nonnegative();
const counts = {
  applications: count,
  attended: count,
  noShow: count,
  excused: count,
  cancelled: count,
  awaiting: count,
  confirmedHours: z.number().nonnegative(),
};

export const analyticsSchema = z
  .object({
    range: z.object({
      from: z.iso.datetime(),
      to: z.iso.datetime(),
      days: z.union([z.literal(30), z.literal(90)]),
      timeZone: z.literal("Asia/Tashkent"),
    }),
    previous: z.object({
      from: z.iso.datetime(),
      to: z.iso.datetime(),
      signups: count,
      applications: count,
    }),
    summary: z.object({
      signups: count,
      signupAverage: z.number().nonnegative(),
      signupChange: z.number().nullable(),
      activatedSignups: count,
      ...counts,
    }),
    daily: z
      .array(
        z.object({
          date: z.iso.datetime(),
          signups: count,
          volunteers: count,
          ...counts,
        }),
      )
      .min(30)
      .max(90),
  })
  .refine((value) => value.daily.length === value.range.days);

export type Analytics = z.infer<typeof analyticsSchema>;
export type DailyMetric =
  "signups" | "volunteers" | "applications" | "attended" | "confirmedHours";

export function metricSeries(daily: Analytics["daily"], metric: DailyMetric) {
  return daily.map((day) => ({ date: day.date, value: day[metric] }));
}

export function impactOutcomes(summary: Analytics["summary"]) {
  const keys = ["attended", "noShow", "excused", "cancelled", "awaiting"] as const;
  const peak = Math.max(...keys.map((key) => summary[key]));
  return keys.map((key) => ({
    key,
    value: summary[key],
    share: peak > 0 ? summary[key] / peak : 0,
  }));
}

export function attendanceRate(summary: Analytics["summary"]) {
  const total = summary.attended + summary.noShow;
  return total > 0 ? summary.attended / total : null;
}
