export const AUDIT_ACTIONS = [
  "application.submitted",
  "application.under_review",
  "application.accepted",
  "application.rejected",
  "application.closed",
  "application.withdrawn",
  "attendance.resolved",
  "coordinator.created",
  "coordinator.blocked",
  "coordinator.active",
  "coordinator.removed",
  "opportunity.created",
  "opportunity.updated",
  "opportunity.submitted_for_approval",
  "opportunity.approved",
  "opportunity.published",
  "opportunity.changes_requested",
  "opportunity.rejected",
  "opportunity.archived",
  "organization.created",
  "organization.updated",
  "user.password.replaced",
  "user.username.changed",
  "user.avatar.updated",
  "user.avatar.removed",
  "user.progress.adjusted",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export function isKnownAuditAction(action: string): action is AuditAction {
  return (AUDIT_ACTIONS as readonly string[]).includes(action);
}

export function auditActionOptions(seen: readonly string[]): string[] {
  return [...new Set([...AUDIT_ACTIONS, ...seen])];
}

export function auditActionKey(action: string): string {
  return action.replace(/\./g, "_");
}
