import type { Application, Organization, Vacancy } from "@/lib/api/schemas";
import { EVENT_TIME_ZONE } from "@/lib/datetime";
import {
  attendanceOpensAt,
  isAttendanceOpen,
  missingForApproval,
  vacancyStateOf,
  type ApprovalRequirement,
} from "@/lib/vacancies/approval";

export const FRESH_WITHIN_MS = 20_000;

const DAY_KEY = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function tashkentDay(value: Date | string): string {
  return DAY_KEY.format(typeof value === "string" ? new Date(value) : value);
}

export function isSameTashkentDay(value: string | undefined, now: Date): boolean {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && tashkentDay(parsed) === tashkentDay(now);
}

export function isFresh(value: string | undefined, now: Date): boolean {
  if (!value) return false;
  const age = now.getTime() - Date.parse(value);
  return age >= -FRESH_WITHIN_MS && age <= FRESH_WITHIN_MS;
}

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
