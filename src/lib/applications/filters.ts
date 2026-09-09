import type { Application } from "@/lib/api/schemas";

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
    `${volunteerNameOf(application)} ${application.opportunity?.title ?? ""}`
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
