import {
  type OpportunityApprovalStatus,
  type VacancyFormat,
  type VacancyState,
} from "@/lib/domain/vocabulary";

export type ApprovalSubject = {
  approvalStatus?: OpportunityApprovalStatus | undefined;
  publishedAt?: string | undefined;
  archivedAt?: string | undefined;
};

export function approvalStatusOf(vacancy: ApprovalSubject): OpportunityApprovalStatus {
  if (vacancy.approvalStatus) return vacancy.approvalStatus;
  return vacancy.publishedAt ? "approved" : "draft";
}

export function vacancyStateOf(vacancy: ApprovalSubject): VacancyState {
  return vacancy.archivedAt ? "archived" : approvalStatusOf(vacancy);
}

export function isAwaitingDecision(vacancy: ApprovalSubject): boolean {
  return vacancyStateOf(vacancy) === "pending_review";
}

export function isPermanentlyRejected(vacancy: ApprovalSubject): boolean {
  return vacancyStateOf(vacancy) === "rejected";
}

export function canEditVacancy(vacancy: ApprovalSubject): boolean {
  const state = vacancyStateOf(vacancy);
  return state === "draft" || state === "changes_requested";
}

export function canSubmitForApproval(vacancy: ApprovalSubject): boolean {
  const state = vacancyStateOf(vacancy);
  return state === "draft" || state === "changes_requested";
}

export function canApproveVacancy(vacancy: ApprovalSubject): boolean {
  return vacancyStateOf(vacancy) === "pending_review";
}

export function canRequestVacancyChanges(vacancy: ApprovalSubject): boolean {
  return vacancyStateOf(vacancy) === "pending_review";
}

export function canRejectVacancy(vacancy: ApprovalSubject): boolean {
  return vacancyStateOf(vacancy) === "pending_review";
}

export const APPROVAL_REQUIREMENTS = [
  "organization",
  "title",
  "summary",
  "description",
  "format",
  "region",
  "startsAt",
  "endsAt",
  "applicationDeadline",
  "capacity",
  "estimatedTotalHours",
  "location",
] as const;

export type ApprovalRequirement = (typeof APPROVAL_REQUIREMENTS)[number];

export type ApprovalCandidate = {
  title: string;
  summary: string;
  description: string;
  format: VacancyFormat;
  region: string;
  city?: string | undefined;
  locationName?: string | undefined;
  startsAt: string;
  endsAt?: string | undefined;
  applicationDeadline: string;
  capacity?: number | undefined;
  estimatedTotalHours?: number | undefined;
  organization?: { verified: boolean } | undefined;
};

function isFilled(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isMoment(value: string | undefined): boolean {
  return isFilled(value) && !Number.isNaN(Date.parse(value as string));
}

export function requiresVenue(format: VacancyFormat): boolean {
  return format === "onsite" || format === "hybrid";
}

export function missingForApproval(
  vacancy: ApprovalCandidate,
  now?: Date,
): ApprovalRequirement[] {
  const missing: ApprovalRequirement[] = [];

  if (!vacancy.organization?.verified) missing.push("organization");
  if (!isFilled(vacancy.title)) missing.push("title");
  if (!isFilled(vacancy.summary)) missing.push("summary");
  if (!isFilled(vacancy.description)) missing.push("description");
  if (!vacancy.format) missing.push("format");
  if (!isFilled(vacancy.region)) missing.push("region");
  if (!isMoment(vacancy.startsAt)) missing.push("startsAt");
  if (!isMoment(vacancy.endsAt)) missing.push("endsAt");

  if (!isMoment(vacancy.applicationDeadline)) {
    missing.push("applicationDeadline");
  } else if (
    isMoment(vacancy.startsAt) &&
    Date.parse(vacancy.applicationDeadline) >= Date.parse(vacancy.startsAt)
  ) {
    missing.push("applicationDeadline");
  } else if (now && Date.parse(vacancy.applicationDeadline) <= now.getTime()) {
    missing.push("applicationDeadline");
  }

  if (
    vacancy.capacity === undefined ||
    !Number.isInteger(vacancy.capacity) ||
    vacancy.capacity < 1
  ) {
    missing.push("capacity");
  }

  if (
    vacancy.estimatedTotalHours === undefined ||
    !Number.isFinite(vacancy.estimatedTotalHours) ||
    vacancy.estimatedTotalHours <= 0
  ) {
    missing.push("estimatedTotalHours");
  }

  if (requiresVenue(vacancy.format)) {
    if (!isFilled(vacancy.city) || !isFilled(vacancy.locationName)) {
      missing.push("location");
    }
  } else if (!isFilled(vacancy.locationName)) {
    missing.push("location");
  }

  return missing;
}

export function isReadyForApproval(
  vacancy: ApprovalCandidate,
  now?: Date,
): boolean {
  return missingForApproval(vacancy, now).length === 0;
}

const CREDENTIAL_PATTERNS = [
  /\bpwd\s*=/i,
  /\bpasscode\b/i,
  /\bpassword\b/i,
  /\bpass\s?code\b/i,
  /\bpin\s*[:=]/i,
  /пароль/i,
  /код\s+доступа/i,
  /\bparol\b/i,
  /\bkirish\s+kodi\b/i,
];

export function hasMeetingCredentials(value: string): boolean {
  return CREDENTIAL_PATTERNS.some((pattern) => pattern.test(value));
}

export function attendanceOpensAt(vacancy: {
  startsAt: string;
  endsAt?: string | undefined;
}): Date | null {
  const source = isMoment(vacancy.endsAt) ? vacancy.endsAt : vacancy.startsAt;
  if (!isMoment(source)) return null;
  return new Date(source as string);
}

export function isAttendanceOpen(
  vacancy: { startsAt: string; endsAt?: string | undefined },
  now: Date,
): boolean {
  const opensAt = attendanceOpensAt(vacancy);
  return opensAt !== null && now.getTime() >= opensAt.getTime();
}
