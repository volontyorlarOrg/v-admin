import type { AuditEvent } from "@/lib/api/schemas";
import { shiftDay, tashkentDay } from "@/lib/datetime";

export type AuditDay = { day: string; events: AuditEvent[] };

export type AuditDetail =
  | { kind: "outcome"; outcome: string }
  | { kind: "closedByArchive" }
  | { kind: "automatic" }
  | { kind: "reassigned" };

export function newestFirst(events: readonly AuditEvent[]): AuditEvent[] {
  return [...events].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function groupByDay(events: readonly AuditEvent[]): AuditDay[] {
  const days: AuditDay[] = [];
  for (const event of newestFirst(events)) {
    const day = tashkentDay(event.createdAt);
    const last = days.at(-1);
    if (last?.day === day) last.events.push(event);
    else days.push({ day, events: [event] });
  }
  return days;
}

function metadataOf(event: Pick<AuditEvent, "metadata">): Record<string, unknown> {
  return event.metadata &&
    typeof event.metadata === "object" &&
    !Array.isArray(event.metadata)
    ? (event.metadata as Record<string, unknown>)
    : {};
}

export function detailsOf(
  event: Pick<AuditEvent, "action" | "metadata">,
): AuditDetail[] {
  const metadata = metadataOf(event);
  const details: AuditDetail[] = [];

  if (event.action === "attendance.resolved" && typeof metadata.outcome === "string") {
    details.push({ kind: "outcome", outcome: metadata.outcome });
  }
  if (
    event.action === "application.closed" &&
    metadata.reason === "opportunity.archived"
  ) {
    details.push({ kind: "closedByArchive" });
  }
  if (event.action === "application.accepted" && metadata.automatic === true) {
    details.push({ kind: "automatic" });
  }
  if (
    event.action === "coordinator.removed" &&
    typeof metadata.reassignToCoordinatorId === "string" &&
    metadata.reassignToCoordinatorId
  ) {
    details.push({ kind: "reassigned" });
  }

  return details;
}

export type AuditRange = "today" | "week" | "month";

export const AUDIT_RANGES: readonly AuditRange[] = ["today", "week", "month"];

export function rangeDays(range: AuditRange, now: Date): { from: string; to: string } {
  const today = tashkentDay(now);
  const span = range === "today" ? 0 : range === "week" ? 6 : 29;
  return { from: shiftDay(today, -span), to: today };
}
