import type { AuditEvent } from "@/lib/api/schemas";
import {
  applicationHref,
  coordinatorHref,
  navHref,
  userHref,
  vacancyHref,
} from "@/lib/routing/routes";

export type AuditSubjectKind =
  | "vacancy"
  | "application"
  | "coordinator"
  | "volunteer"
  | "organization"
  | "attendance"
  | "account";

export type AuditSubject = { kind: AuditSubjectKind; href: string | null };

export function subjectOf(
  event: Pick<AuditEvent, "action" | "entityType" | "entityId">,
  coordinatorIds: ReadonlySet<string> = new Set(),
): AuditSubject {
  const type = event.entityType.toLowerCase();
  const id = event.entityId;

  if (type === "opportunity") return { kind: "vacancy", href: vacancyHref(id) };
  if (type === "application") return { kind: "application", href: applicationHref(id) };
  if (type === "organization")
    return { kind: "organization", href: navHref("organizations") };
  if (type === "attendance") return { kind: "attendance", href: null };
  if (type === "user") {
    if (event.action.startsWith("coordinator.") || coordinatorIds.has(id)) {
      return { kind: "coordinator", href: coordinatorHref(id) };
    }
    return { kind: "volunteer", href: userHref(id) };
  }
  return { kind: "account", href: null };
}
