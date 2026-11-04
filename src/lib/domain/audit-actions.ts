export const AUDIT_ACTIONS = [
  "report.submitted",
  "report.resolved",
  "report.reopened",
  "opportunity.created",
  "opportunity.updated",
  "opportunity.submitted_for_approval",
  "opportunity.approved",
  "opportunity.published",
  "opportunity.changes_requested",
  "opportunity.rejected",
  "opportunity.archived",
  "application.submitted",
  "application.under_review",
  "application.accepted",
  "application.rejected",
  "application.closed",
  "application.withdrawn",
  "attendance.resolved",
  "past_event_roster.submitted",
  "past_event_request.submitted",
  "past_event_request.approved",
  "past_event_request.rejected",
  "past_event_request.cancelled",
  "user.past_event.created",
  "user.past_event.updated",
  "user.past_event.removed",
  "bulk_award.created",
  "bulk_award.revoked",
  "user.progress.adjusted",
  "coordinator.created",
  "coordinator.blocked",
  "coordinator.active",
  "coordinator.removed",
  "organization.created",
  "organization.updated",
  "user.password.replaced",
  "user.username.changed",
  "user.avatar.updated",
  "user.avatar.removed",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_FAMILIES = [
  "report",
  "opportunity",
  "application",
  "attendance",
  "pastEvent",
  "award",
  "coordinator",
  "organization",
  "user",
  "other",
] as const;

export type AuditFamily = (typeof AUDIT_FAMILIES)[number];

const FAMILY_PREFIXES: ReadonlyArray<readonly [string, AuditFamily]> = [
  ["report.", "report"],
  ["opportunity.", "opportunity"],
  ["application.", "application"],
  ["attendance", "attendance"],
  ["past_event", "pastEvent"],
  ["user.past_event.", "pastEvent"],
  ["bulk_award.", "award"],
  ["user.progress.", "award"],
  ["coordinator.", "coordinator"],
  ["organization", "organization"],
  ["user.", "user"],
];

export const AUDIT_FAMILY_ICONS: Record<AuditFamily, string> = {
  report: "message-square-warning",
  opportunity: "clipboard-list",
  application: "inbox",
  attendance: "calendar-check",
  pastEvent: "history",
  award: "award",
  coordinator: "user-cog",
  organization: "building-2",
  user: "key-round",
  other: "scroll-text",
};

export function auditFamilyOf(action: string): AuditFamily {
  return FAMILY_PREFIXES.find(([prefix]) => action.startsWith(prefix))?.[1] ?? "other";
}

export function isKnownAuditAction(action: string): action is AuditAction {
  return (AUDIT_ACTIONS as readonly string[]).includes(action);
}

export function auditActionOptions(seen: readonly string[]): string[] {
  return [...new Set([...AUDIT_ACTIONS, ...seen])];
}

export function auditActionGroups(
  seen: readonly string[],
): Array<{ family: AuditFamily; actions: string[] }> {
  const options = auditActionOptions(seen);
  return AUDIT_FAMILIES.map((family) => ({
    family,
    actions: options.filter((action) => auditFamilyOf(action) === family),
  })).filter((group) => group.actions.length > 0);
}

export function auditActionKey(action: string): string {
  return action.replace(/\./g, "_");
}
