import type { Application } from "@/lib/api/schemas";

export const APPLICATION_REQUIREMENTS = 10;

export type Participation = {
  sent: number;
  accepted: number;
  attended: number;
  hours: number;
  awaiting: number;
};

export function participationOf(applications: readonly Application[]): Participation {
  const totals: Participation = {
    sent: 0,
    accepted: 0,
    attended: 0,
    hours: 0,
    awaiting: 0,
  };

  for (const application of applications) {
    if (application.status === "draft") continue;
    totals.sent += 1;
    if (application.status === "accepted") totals.accepted += 1;
    const attendance = application.attendance;
    if (attendance?.outcome === "attended") {
      totals.attended += 1;
      totals.hours += attendance.confirmedHours ?? 0;
    } else if (attendance?.outcome === "awaiting_confirmation") {
      totals.awaiting += 1;
    }
  }

  totals.hours = Math.round(totals.hours * 100) / 100;
  return totals;
}

export function completionShare(missing: readonly string[]): number {
  const done = Math.max(0, APPLICATION_REQUIREMENTS - missing.length);
  return done / APPLICATION_REQUIREMENTS;
}
