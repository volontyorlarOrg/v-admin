import type { Application, Organization, Vacancy } from "@/lib/api/schemas";
import { isSameTashkentDay } from "@/lib/datetime";
import {
  attendanceOpensAt,
  isAttendanceOpen,
  missingForApproval,
  vacancyStateOf,
  type ApprovalRequirement,
} from "@/lib/vacancies/approval";

function time(value: string | undefined): number {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

export type VacancyEntry = {
  vacancy: Vacancy;
  organization: Organization | undefined;
  missing: ApprovalRequirement[];
  receivedAt: string | undefined;
};

export type BlockingOrganization = {
  organization: Organization;
  vacancies: Vacancy[];
};

export type ApplicationEntry = {
  application: Application;
  vacancy: Vacancy | undefined;
};

export type RollCall = {
  vacancyId: string;
  title: string;
  endedAt: Date | null;
  awaiting: number;
  resolved: number;
};

function organizationOf(
  vacancy: Vacancy,
  organizations: readonly Organization[],
): Organization | undefined {
  return (
    organizations.find((organization) => organization.id === vacancy.organizationId) ??
    vacancy.organization
  );
}

function vacancyEntry(
  vacancy: Vacancy,
  organizations: readonly Organization[],
  now: Date,
  receivedAt: string | undefined,
): VacancyEntry {
  const organization = organizationOf(vacancy, organizations);
  return {
    vacancy,
    organization,
    receivedAt,
    missing: missingForApproval(
      {
        title: vacancy.title,
        description: vacancy.description,
        format: vacancy.format,
        region: vacancy.region,
        startsAt: vacancy.startsAt,
        applicationDeadline: vacancy.applicationDeadline,
        ...(organization ? { organization: { verified: organization.verified } } : {}),
      },
      now,
    ),
  };
}

export function vacanciesToApprove(
  vacancies: readonly Vacancy[],
  organizations: readonly Organization[],
  now: Date,
): VacancyEntry[] {
  return vacancies
    .filter((vacancy) => vacancyStateOf(vacancy) === "pending_review")
    .map((vacancy) =>
      vacancyEntry(
        vacancy,
        organizations,
        now,
        vacancy.approvalSubmittedAt ?? vacancy.updatedAt,
      ),
    )
    .sort((a, b) => time(a.receivedAt) - time(b.receivedAt));
}

const OPEN_STATES = new Set(["draft", "pending_review", "changes_requested"]);

export function blockingOrganizations(
  vacancies: readonly Vacancy[],
  organizations: readonly Organization[],
): BlockingOrganization[] {
  return organizations
    .filter((organization) => !organization.verified)
    .map((organization) => ({
      organization,
      vacancies: vacancies.filter(
        (vacancy) =>
          vacancy.organizationId === organization.id &&
          OPEN_STATES.has(vacancyStateOf(vacancy)),
      ),
    }))
    .filter((entry) => entry.vacancies.length > 0)
    .sort((a, b) => b.vacancies.length - a.vacancies.length);
}

export function applicationsToDecide(
  applications: readonly Application[],
  vacancies: readonly Vacancy[],
): ApplicationEntry[] {
  const byId = new Map(vacancies.map((vacancy) => [vacancy.id, vacancy]));
  return applications
    .filter(
      (application) =>
        application.status === "submitted" || application.status === "under_review",
    )
    .map((application) => ({
      application,
      vacancy: byId.get(application.opportunityId),
    }))
    .filter((entry) => !entry.vacancy?.archivedAt)
    .sort(
      (a, b) =>
        time(a.application.submittedAt ?? a.application.createdAt) -
        time(b.application.submittedAt ?? b.application.createdAt),
    );
}

export function rollCallsDue(
  applications: readonly Application[],
  vacancies: readonly Vacancy[],
  now: Date,
): RollCall[] {
  const byId = new Map(vacancies.map((vacancy) => [vacancy.id, vacancy]));
  const calls = new Map<string, RollCall>();

  for (const application of applications) {
    if (application.status !== "accepted") continue;
    const vacancy = byId.get(application.opportunityId);
    const timing = vacancy ?? {
      startsAt: application.opportunity?.startsAt ?? "",
      endsAt: application.opportunity?.endsAt,
    };
    if (!timing.startsAt || !isAttendanceOpen(timing, now)) continue;
    const sheet = vacancy?.attendanceSheet;
    if (sheet?.status === "submitted") continue;
    if (sheet?.status === "verified" && !sheet.correction) continue;

    const call = calls.get(application.opportunityId) ?? {
      vacancyId: application.opportunityId,
      title:
        vacancy?.title ?? application.opportunity?.title ?? application.opportunityId,
      endedAt: attendanceOpensAt(timing),
      awaiting: 0,
      resolved: 0,
    };
    const outcome = application.attendance?.outcome;
    if (!outcome || outcome === "awaiting_confirmation") call.awaiting += 1;
    else call.resolved += 1;
    calls.set(application.opportunityId, call);
  }

  return [...calls.values()]
    .filter((call) => call.awaiting > 0)
    .sort((a, b) => (a.endedAt?.getTime() ?? 0) - (b.endedAt?.getTime() ?? 0));
}

export type ClearedVacancy = {
  kind: "vacancy";
  vacancy: Vacancy;
  decision: "approved" | "changes_requested" | "rejected";
  at: string;
};

export type ClearedApplication = {
  kind: "application";
  application: Application;
  decision: Application["status"];
  at: string;
};

export type ClearedRollCall = {
  kind: "rollCall";
  vacancyId: string;
  title: string;
  attended: number;
  other: number;
  at: string;
};

export type Cleared = ClearedVacancy | ClearedApplication | ClearedRollCall;

const FINAL_DECISIONS = new Set<Application["status"]>([
  "accepted",
  "rejected",
  "closed",
]);

export function clearedToday({
  vacancies,
  applications,
  me,
  now,
}: {
  vacancies: readonly Vacancy[];
  applications: readonly Application[];
  me: string;
  now: Date;
}): Cleared[] {
  const cleared: Cleared[] = [];

  for (const vacancy of vacancies) {
    const decision = vacancy.approvalStatus;
    if (
      vacancy.approvalReviewedById === me &&
      isSameTashkentDay(vacancy.approvalReviewedAt, now) &&
      (decision === "approved" ||
        decision === "changes_requested" ||
        decision === "rejected")
    ) {
      cleared.push({
        kind: "vacancy",
        vacancy,
        decision,
        at: vacancy.approvalReviewedAt as string,
      });
    }
  }

  const rollCalls = new Map<string, ClearedRollCall>();

  for (const application of applications) {
    if (
      application.reviewedById === me &&
      isSameTashkentDay(application.reviewedAt, now) &&
      FINAL_DECISIONS.has(application.status)
    ) {
      cleared.push({
        kind: "application",
        application,
        decision: application.status,
        at: application.reviewedAt as string,
      });
    }

    const attendance = application.attendance;
    if (
      attendance?.confirmedById === me &&
      attendance.outcome !== "awaiting_confirmation" &&
      isSameTashkentDay(attendance.resolvedAt, now)
    ) {
      const call = rollCalls.get(application.opportunityId) ?? {
        kind: "rollCall" as const,
        vacancyId: application.opportunityId,
        title: application.opportunity?.title ?? application.opportunityId,
        attended: 0,
        other: 0,
        at: attendance.resolvedAt as string,
      };
      if (attendance.outcome === "attended") call.attended += 1;
      else call.other += 1;
      if (time(attendance.resolvedAt) > time(call.at)) {
        call.at = attendance.resolvedAt as string;
      }
      rollCalls.set(application.opportunityId, call);
    }
  }

  cleared.push(...rollCalls.values());
  return cleared.sort((a, b) => time(b.at) - time(a.at));
}

export type StaffDesk = {
  returned: VacancyEntry[];
  drafts: VacancyEntry[];
  inReview: number;
};

export function staffDesk(
  vacancies: readonly Vacancy[],
  organizations: readonly Organization[],
  now: Date,
): StaffDesk {
  const returned = vacancies
    .filter((vacancy) => vacancyStateOf(vacancy) === "changes_requested")
    .map((vacancy) =>
      vacancyEntry(
        vacancy,
        organizations,
        now,
        vacancy.approvalReviewedAt ?? vacancy.updatedAt,
      ),
    )
    .sort((a, b) => time(b.receivedAt) - time(a.receivedAt));
  const drafts = vacancies
    .filter((vacancy) => vacancyStateOf(vacancy) === "draft")
    .map((vacancy) => vacancyEntry(vacancy, organizations, now, vacancy.updatedAt))
    .sort((a, b) => time(b.receivedAt) - time(a.receivedAt));
  const inReview = vacancies.filter(
    (vacancy) => vacancyStateOf(vacancy) === "pending_review",
  ).length;

  return { returned, drafts, inReview };
}

export type Runner = "administrators" | "coordinator" | "organization";

export function runnerOf(
  createdById: string | undefined,
  roleOf: (userId: string | undefined) => string | null,
): Runner {
  const role = roleOf(createdById);
  if (role === "organization") return "organization";
  if (role === "coordinator") return "coordinator";
  return "administrators";
}

export type VacancyApplications = {
  vacancyId: string;
  title: string;
  vacancy: Vacancy | undefined;
  waiting: number;
  underReview: number;
  staged: number;
  oldestAt: string | undefined;
};

export function applicationsByVacancy(
  entries: readonly ApplicationEntry[],
): VacancyApplications[] {
  const groups = new Map<string, VacancyApplications>();

  for (const { application, vacancy } of entries) {
    const sentAt = application.submittedAt ?? application.createdAt;
    const group = groups.get(application.opportunityId) ?? {
      vacancyId: application.opportunityId,
      title:
        vacancy?.title ?? application.opportunity?.title ?? application.opportunityId,
      vacancy,
      waiting: 0,
      underReview: 0,
      staged: 0,
      oldestAt: undefined,
    };
    group.waiting += 1;
    if (application.status === "under_review") group.underReview += 1;
    if (application.stagedDecision) group.staged += 1;
    if (time(sentAt) < time(group.oldestAt)) group.oldestAt = sentAt;
    groups.set(application.opportunityId, group);
  }

  return [...groups.values()].sort((a, b) => time(a.oldestAt) - time(b.oldestAt));
}

export type OrganizerWork = {
  vacancyId: string;
  title: string;
  createdById: string | undefined;
  organizationId: string | undefined;
  applications: VacancyApplications | undefined;
  rollCall: RollCall | undefined;
  since: number;
};

export function organizerWork(
  groups: readonly VacancyApplications[],
  rollCalls: readonly RollCall[],
  vacancies: readonly Vacancy[],
): OrganizerWork[] {
  const byId = new Map(vacancies.map((vacancy) => [vacancy.id, vacancy]));
  const work = new Map<string, OrganizerWork>();

  const entry = (vacancyId: string, title: string): OrganizerWork => {
    const existing = work.get(vacancyId);
    if (existing) return existing;
    const vacancy = byId.get(vacancyId);
    const created: OrganizerWork = {
      vacancyId,
      title,
      createdById: vacancy?.createdById,
      organizationId: vacancy?.organizationId,
      applications: undefined,
      rollCall: undefined,
      since: Number.POSITIVE_INFINITY,
    };
    work.set(vacancyId, created);
    return created;
  };

  for (const group of groups) {
    const item = entry(group.vacancyId, group.title);
    item.applications = group;
    item.since = Math.min(item.since, time(group.oldestAt));
  }

  for (const call of rollCalls) {
    const item = entry(call.vacancyId, call.title);
    item.rollCall = call;
    item.since = Math.min(
      item.since,
      call.endedAt?.getTime() ?? Number.POSITIVE_INFINITY,
    );
  }

  return [...work.values()].sort((a, b) => a.since - b.since);
}

export type ReturnedResults = { vacancy: Vacancy; returnedAt: string | undefined };

export function resultsReturned(vacancies: readonly Vacancy[]): ReturnedResults[] {
  return vacancies
    .filter(
      (vacancy) =>
        !vacancy.archivedAt && vacancy.attendanceSheet?.status === "changes_requested",
    )
    .map((vacancy) => ({ vacancy, returnedAt: vacancy.updatedAt }))
    .sort((a, b) => time(a.returnedAt) - time(b.returnedAt));
}

export type WithAdministrator = {
  vacancies: number;
  results: number;
  pastEvents: number;
};

export function withAdministrator(
  vacancies: readonly Vacancy[],
  pastEvents: ReadonlyArray<{ pending: number }>,
): WithAdministrator {
  return {
    vacancies: vacancies.filter(
      (vacancy) => vacancyStateOf(vacancy) === "pending_review",
    ).length,
    results: vacancies.filter(
      (vacancy) =>
        !vacancy.archivedAt && vacancy.attendanceSheet?.status === "submitted",
    ).length,
    pastEvents: pastEvents.filter((event) => event.pending > 0).length,
  };
}
