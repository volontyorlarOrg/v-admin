import type { AuditEvent } from "@/lib/api/schemas";

export type AuditRole = "administrator" | "coordinator" | "organization" | "volunteer";

export type AuditPerson = { name: string; role: AuditRole };

export type AuditActor =
  | { kind: "you" }
  | { kind: "person"; name: string; role: AuditRole }
  | { kind: "someone" }
  | { kind: "unrecorded" };

export type AuditDirectory = {
  me: string | null;
  people: ReadonlyMap<string, AuditPerson>;
  names: ReadonlyMap<string, string>;
};

export type DirectorySources = {
  me?: string | null;
  coordinators?: ReadonlyArray<{ id: string; name: string }>;
  organizationAccounts?: ReadonlyArray<{ userId: string; organizationId: string }>;
  organizations?: ReadonlyArray<{ id: string; name: string }>;
  vacancies?: ReadonlyArray<{ id: string; title: string }>;
  applications?: ReadonlyArray<{
    id: string;
    volunteerId: string;
    volunteerName: string;
    vacancyTitle: string;
  }>;
  pastEvents?: ReadonlyArray<{ id: string; title: string }>;
};

export type NamedKind = "vacancy" | "organization" | "application" | "pastEvent";

export function nameKey(kind: NamedKind, id: string): string {
  return `${kind}:${id}`;
}

export function emptyDirectory(me: string | null = null): AuditDirectory {
  return { me, people: new Map(), names: new Map() };
}

export function buildDirectory(sources: DirectorySources): AuditDirectory {
  const people = new Map<string, AuditPerson>();
  const names = new Map<string, string>();

  for (const organization of sources.organizations ?? []) {
    if (organization.name)
      names.set(nameKey("organization", organization.id), organization.name);
  }

  for (const vacancy of sources.vacancies ?? []) {
    if (vacancy.title) names.set(nameKey("vacancy", vacancy.id), vacancy.title);
  }

  for (const event of sources.pastEvents ?? []) {
    if (event.title) names.set(nameKey("pastEvent", event.id), event.title);
  }

  for (const application of sources.applications ?? []) {
    const label = [application.volunteerName, application.vacancyTitle]
      .filter(Boolean)
      .join(" · ");
    if (label) names.set(nameKey("application", application.id), label);
    if (application.volunteerName && !people.has(application.volunteerId)) {
      people.set(application.volunteerId, {
        name: application.volunteerName,
        role: "volunteer",
      });
    }
  }

  for (const coordinator of sources.coordinators ?? []) {
    if (coordinator.name) {
      people.set(coordinator.id, { name: coordinator.name, role: "coordinator" });
    }
  }

  for (const account of sources.organizationAccounts ?? []) {
    const name = names.get(nameKey("organization", account.organizationId));
    if (name) people.set(account.userId, { name, role: "organization" });
  }

  return { me: sources.me ?? null, people, names };
}

export function actorOf(
  event: Pick<AuditEvent, "actorUserId">,
  directory: AuditDirectory,
): AuditActor {
  const id = event.actorUserId;
  if (!id) return { kind: "unrecorded" };
  if (directory.me && id === directory.me) return { kind: "you" };
  const person = directory.people.get(id);
  return person ? { kind: "person", ...person } : { kind: "someone" };
}

export function roleOf(
  userId: string | undefined,
  directory: AuditDirectory,
): AuditRole | null {
  return userId ? (directory.people.get(userId)?.role ?? null) : null;
}
