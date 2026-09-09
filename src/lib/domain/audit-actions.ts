export const AUDIT_ACTIONS = [
  "application.reviewed",
  "attendance.resolved",
  "coordinator.active",
  "coordinator.blocked",
  "coordinator.created",
  "coordinator.removed",
  "opportunity.archived",
  "opportunity.created",
  "opportunity.published",
  "opportunity.updated",
  "user.password.replaced",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export function knownAction(value: string): value is AuditAction {
  return (AUDIT_ACTIONS as readonly string[]).includes(value);
}

export function auditActionOptions(seen: readonly string[]): string[] {
  return [...new Set([...AUDIT_ACTIONS, ...seen])].sort();
}
