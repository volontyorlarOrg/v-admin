import type { Application, Vacancy } from "@/lib/api/schemas";
import { isAttendanceResolved, volunteerNameOf } from "@/lib/applications/filters";
import { attendanceOpensAt, isAttendanceOpen } from "@/lib/vacancies/approval";

export type AttendanceGroup = {
  vacancyId: string;
  title: string;
  opensAt: Date | null;
  open: boolean;
  unresolved: Application[];
  resolved: Application[];
};

function timing(
  application: Application,
  vacancy: Vacancy | undefined,
): { startsAt: string; endsAt?: string } | null {
  const startsAt = vacancy?.startsAt ?? application.opportunity?.startsAt;
  if (!startsAt) return null;
  const endsAt = vacancy?.endsAt ?? application.opportunity?.endsAt;
  return endsAt ? { startsAt, endsAt } : { startsAt };
}

export function groupAttendance(
  applications: readonly Application[],
  now: Date,
  vacancies: readonly Vacancy[] = [],
): AttendanceGroup[] {
  const byId = new Map(vacancies.map((vacancy) => [vacancy.id, vacancy]));
  const groups = new Map<string, AttendanceGroup>();

  for (const application of applications) {
    const vacancyId = application.opportunityId;
    const vacancy = byId.get(vacancyId);
    const when = timing(application, vacancy);
    const group = groups.get(vacancyId) ?? {
      vacancyId,
      title: vacancy?.title ?? application.opportunity?.title ?? vacancyId,
      opensAt: when ? attendanceOpensAt(when) : null,
      open: when ? isAttendanceOpen(when, now) : false,
      unresolved: [],
      resolved: [],
    };

    if (isAttendanceResolved(application)) group.resolved.push(application);
    else group.unresolved.push(application);

    groups.set(vacancyId, group);
  }

  for (const group of groups.values()) {
    group.unresolved.sort((a, b) =>
      volunteerNameOf(a).localeCompare(volunteerNameOf(b)),
    );
    group.resolved.sort((a, b) => volunteerNameOf(a).localeCompare(volunteerNameOf(b)));
  }

  return [...groups.values()].sort((a, b) => {
    const waiting =
      Number(b.open && b.unresolved.length > 0) -
      Number(a.open && a.unresolved.length > 0);
    if (waiting !== 0) return waiting;
    return (a.opensAt?.getTime() ?? Infinity) - (b.opensAt?.getTime() ?? Infinity);
  });
}

export function unresolvedCount(groups: readonly AttendanceGroup[]): number {
  return groups.reduce((total, group) => total + group.unresolved.length, 0);
}
