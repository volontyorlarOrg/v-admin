import { z } from "zod";

import type { PastEventRequest } from "@/lib/past-events/schemas";

export const REVIEW_NOTE_MAX = 500;

const decimalHours = z
  .string()
  .trim()
  .regex(/^(?:0|[1-9]\d{0,2})(?:\.\d{1,2})?$/, "hoursAmount")
  .transform(Number);

const awardedXp = z
  .string()
  .trim()
  .regex(/^\d{1,6}$/, "xpAmount")
  .transform(Number)
  .pipe(z.number().int().min(0, "xpAmount").max(100_000, "xpAmount"));

export const approvalSchema = z.object({ hours: decimalHours, xpAwarded: awardedXp });

export const rejectionSchema = z.object({
  note: z.string().trim().min(1, "required").max(REVIEW_NOTE_MAX, "tooLong"),
});

export type RequestChange = {
  field: "title" | "eventDate" | "hours" | "xpAwarded";
  from: string | number;
  to: string | number;
};

export function requestSubject(request: PastEventRequest): string {
  return request.title ?? request.event?.title ?? "";
}

export function requestChanges(request: PastEventRequest): RequestChange[] {
  const current = request.event;
  if (request.kind !== "update" || !current) return [];
  const proposed = {
    title: request.title,
    eventDate: request.eventDate,
    hours: request.hours,
    xpAwarded: request.xpAwarded,
  };
  return (["title", "eventDate", "hours", "xpAwarded"] as const).flatMap((field) => {
    const to = proposed[field];
    const from = current[field];
    return to === null || to === from ? [] : [{ field, from, to }];
  });
}
