export const REGIONS = [
  "andijan",
  "bukhara",
  "fergana",
  "jizzakh",
  "kashkadarya",
  "khorezm",
  "namangan",
  "navoiy",
  "samarkand",
  "sirdaryo",
  "surkhandarya",
  "tashkent-region",
  "tashkent-city",
  "karakalpakstan",
] as const;
export type Region = (typeof REGIONS)[number];

export const VACANCY_FORMATS = ["onsite", "remote", "hybrid"] as const;
export type VacancyFormat = (typeof VACANCY_FORMATS)[number];

export const VACANCY_STATUSES = ["open", "closed", "full"] as const;
export type VacancyStatus = (typeof VACANCY_STATUSES)[number];

export const VACANCY_STAGES = ["draft", "published", "archived"] as const;
export type VacancyStage = (typeof VACANCY_STAGES)[number];

export const OPPORTUNITY_APPROVAL_STATUSES = [
  "draft",
  "pending_review",
  "changes_requested",
  "approved",
  "rejected",
] as const;
export type OpportunityApprovalStatus = (typeof OPPORTUNITY_APPROVAL_STATUSES)[number];

export const VACANCY_DECISIONS = ["approve", "request_changes", "reject"] as const;
export type VacancyDecision = (typeof VACANCY_DECISIONS)[number];

export const VACANCY_STATES = [...OPPORTUNITY_APPROVAL_STATUSES, "archived"] as const;
export type VacancyState = (typeof VACANCY_STATES)[number];

export const QUESTION_TYPES = [
  "short_text",
  "long_text",
  "single_select",
  "multi_select",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const APPLICATION_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "accepted",
  "rejected",
  "withdrawn",
  "closed",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const REVIEW_DECISIONS = [
  "under_review",
  "accepted",
  "rejected",
  "closed",
] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

export const ATTENDANCE_OUTCOMES = [
  "attended",
  "excused",
  "cancelled",
  "awaiting_confirmation",
] as const;
export type AttendanceOutcome = (typeof ATTENDANCE_OUTCOMES)[number];

export const RESOLVABLE_ATTENDANCE_OUTCOMES = [
  "attended",
  "excused",
  "cancelled",
] as const;
export type ResolvableAttendanceOutcome =
  (typeof RESOLVABLE_ATTENDANCE_OUTCOMES)[number];

export const COORDINATOR_STATUSES = ["active", "blocked", "removed"] as const;
export type CoordinatorStatus = (typeof COORDINATOR_STATUSES)[number];

export const OPEN_APPLICATION_STATUSES = ["submitted", "under_review"] as const;

export function isReviewable(status: ApplicationStatus): boolean {
  return status === "submitted" || status === "under_review" || status === "accepted";
}

export function isAwaitingReview(status: ApplicationStatus): boolean {
  return (OPEN_APPLICATION_STATUSES as readonly string[]).includes(status);
}

export function stageOf(vacancy: {
  publishedAt?: string | undefined;
  archivedAt?: string | undefined;
}): VacancyStage {
  if (vacancy.archivedAt) return "archived";
  if (vacancy.publishedAt) return "published";
  return "draft";
}

export function canArchive(vacancy: {
  publishedAt?: string | undefined;
  archivedAt?: string | undefined;
}): boolean {
  return stageOf(vacancy) !== "archived";
}
