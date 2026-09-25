import type { Application } from "@/lib/api/schemas";

export const APPLICATION_VIEWS = [
  "waiting",
  "accepted",
  "rejected",
  "withdrawn",
  "closed",
  "all",
] as const;

export type ApplicationView = (typeof APPLICATION_VIEWS)[number];

export function viewOf(
  application: Application,
): Exclude<ApplicationView, "all"> | null {
  switch (application.status) {
    case "submitted":
    case "under_review":
      return "waiting";
    case "accepted":
    case "rejected":
    case "withdrawn":
    case "closed":
      return application.status;
    default:
      return null;
  }
}

export function applicationsInView(
  applications: Application[],
  view: ApplicationView,
): Application[] {
  if (view === "all") return applications;
  return applications.filter((application) => viewOf(application) === view);
}

export function countByView(
  applications: Application[],
): Record<ApplicationView, number> {
  const counts: Record<ApplicationView, number> = {
    waiting: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
    closed: 0,
    all: applications.length,
  };
  for (const application of applications) {
    const view = viewOf(application);
    if (view) counts[view] += 1;
  }
  return counts;
}

export function volunteerNameOf(application: Application): string {
  const snapshot = application.profileSnapshot?.fullName;
  const profile = application.volunteer?.profile as { fullName?: string } | undefined;
  return snapshot ?? profile?.fullName ?? application.volunteer?.displayName ?? "";
}

export function searchApplications(
  applications: Application[],
  term: string | undefined,
): Application[] {
  const q = term?.trim().toLowerCase() ?? "";
  if (!q) return applications;

  return applications.filter((application) =>
    `${volunteerNameOf(application)} ${application.volunteer?.username ?? ""} ${application.opportunity?.title ?? ""}`
      .toLowerCase()
      .includes(q),
  );
}

export function sortApplications(applications: Application[]): Application[] {
  return [...applications].sort((a, b) => {
    const left = Date.parse(a.submittedAt ?? a.createdAt);
    const right = Date.parse(b.submittedAt ?? b.createdAt);
    return left - right;
  });
}

export function acceptedApplications(applications: Application[]): Application[] {
  return applications.filter((application) => application.status === "accepted");
}

export function unresolvedFirst(applications: Application[]): Application[] {
  return [...applications].sort((a, b) => {
    const left = isAttendanceResolved(a) ? 1 : 0;
    const right = isAttendanceResolved(b) ? 1 : 0;
    return left - right;
  });
}

export function isAttendanceResolved(application: Application): boolean {
  const outcome = application.attendance?.outcome;
  return outcome === "attended" || outcome === "excused" || outcome === "cancelled";
}
