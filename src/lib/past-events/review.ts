import { z } from "zod";

import type { PastEventRequest, PastEventSummary } from "@/lib/past-events/schemas";

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

export type PastEventState =
  "waiting" | "approved" | "partlyApproved" | "rejected" | "withdrawn";

export function pastEventState(
  event: Pick<PastEventSummary, "participants" | "pending" | "approved" | "rejected">,
): PastEventState {
  if (event.pending > 0) return "waiting";
  if (event.approved > 0)
    return event.approved === event.participants ? "approved" : "partlyApproved";
  return event.rejected > 0 ? "rejected" : "withdrawn";
}

export function waitingTotals(requests: readonly PastEventRequest[]) {
  const waiting = requests.filter((request) => request.status === "pending");
  return {
    people: waiting.length,
    hours:
      Math.round(
        waiting.reduce((sum, request) => sum + (request.hours ?? 0), 0) * 100,
      ) / 100,
    xp: waiting.reduce((sum, request) => sum + (request.xpAwarded ?? 0), 0),
  };
}

export function waitingFirst(
  requests: readonly PastEventRequest[],
): PastEventRequest[] {
  const name = (request: PastEventRequest) =>
    request.volunteer.displayName ?? request.volunteer.username;
  return [...requests].sort(
    (left, right) =>
      Number(right.status === "pending") - Number(left.status === "pending") ||
      name(left).localeCompare(name(right)),
  );
}
