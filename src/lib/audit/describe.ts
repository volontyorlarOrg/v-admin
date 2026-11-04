import type { AuditEvent } from "@/lib/api/schemas";
import { nameKey, type AuditDirectory } from "@/lib/audit/directory";
import {
  applicationHref,
  coordinatorHref,
  navHref,
  reportHref,
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
  | "account"
  | "bulkAward"
  | "pastEvent"
  | "report";

export type AuditSubject = { kind: AuditSubjectKind; href: string | null };

export type NamedAuditSubject = AuditSubject & { name: string | null };

export function subjectOf(
  event: Pick<AuditEvent, "action" | "entityType" | "entityId">,
  coordinatorIds: ReadonlySet<string> = new Set(),
): AuditSubject {
  const type = event.entityType.toLowerCase();
  const id = event.entityId;
  if (type === "report") return { kind: "report", href: reportHref(id) };

  if (
    type === "pasteventroster" ||
    type === "pasteventrequest" ||
    type === "manualpastevent"
  )
    return { kind: "pastEvent", href: navHref("pastEvents") };

  if (type === "opportunity") return { kind: "vacancy", href: vacancyHref(id) };
  if (type === "bulkaward")
    return {
      kind: "bulkAward",
      href: `${navHref("bulkAwards")}/${encodeURIComponent(id)}`,
    };
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

export function describeSubject(
  event: Pick<AuditEvent, "action" | "entityType" | "entityId">,
  directory: AuditDirectory,
): NamedAuditSubject {
  const coordinatorIds = new Set(
    [...directory.people].flatMap(([id, person]) =>
      person.role === "coordinator" ? [id] : [],
    ),
  );
  const subject = subjectOf(event, coordinatorIds);
  const id = event.entityId;
  const name =
    subject.kind === "vacancy"
      ? directory.names.get(nameKey("vacancy", id))
      : subject.kind === "organization"
        ? directory.names.get(nameKey("organization", id))
        : subject.kind === "application"
          ? directory.names.get(nameKey("application", id))
          : subject.kind === "pastEvent"
            ? directory.names.get(nameKey("pastEvent", id))
            : subject.kind === "coordinator" || subject.kind === "volunteer"
              ? directory.people.get(id)?.name
              : undefined;
  return { ...subject, name: name ?? null };
}
