import { failedResult, okResult, type ActionResult } from "@/lib/api/action-result";
import { IS_ADMIN_PORTAL } from "@/lib/portal";
import {
  FIXTURE_ADMIN_ID,
  FIXTURE_COORDINATOR_ID,
  initialFixtureState,
  type FixtureApplication,
  type FixtureState,
  type FixtureUser,
  type FixtureVacancy,
} from "@/lib/fixtures/data";

type Query = Record<string, unknown> | undefined;
type Params = Record<string, string> | undefined;

let state: FixtureState = initialFixtureState();

export function resetFixtures() {
  state = initialFixtureState();
}

export const actorId = IS_ADMIN_PORTAL ? FIXTURE_ADMIN_ID : FIXTURE_COORDINATOR_ID;

const global = IS_ADMIN_PORTAL;

function ownedVacancies(): FixtureVacancy[] {
  return global
    ? state.vacancies
    : state.vacancies.filter((vacancy) => vacancy.createdById === actorId);
}

function ownedApplications(): FixtureApplication[] {
  const ids = new Set(ownedVacancies().map((vacancy) => vacancy.id));
  return state.applications.filter((application) => ids.has(application.opportunityId));
}

function reachableVolunteers(): FixtureUser[] {
  const volunteers = state.users.filter((user) => user.roles.includes("volunteer"));
  if (global) return volunteers;

  const ids = new Set(
    ownedApplications().map((application) => application.volunteerId),
  );
  return volunteers.filter((user) => ids.has(user.id));
}

function text(query: Query, key: string): string {
  const value = query?.[key];
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function number(query: Query, key: string, fallback: number): number {
  const value = query?.[key];
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function paged<T>(items: T[], query: Query) {
  const page = number(query, "page", 1);
  const pageSize = number(query, "pageSize", 25);
  const offset = (page - 1) * pageSize;
  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pageSize,
    total: items.length,
  };
}

function matches(user: FixtureUser, term: string): boolean {
  if (!term) return true;
  return `${user.displayName} ${user.email ?? ""}`.toLowerCase().includes(term);
}

function withOrganization(vacancy: FixtureVacancy) {
  return {
    ...vacancy,
    organization:
      state.organizations.find(
        (organization) => organization.id === vacancy.organizationId,
      ) ?? null,
  };
}

function withRelations(application: FixtureApplication) {
  const vacancy = state.vacancies.find(
    (candidate) => candidate.id === application.opportunityId,
  );
  const volunteer = state.users.find(
    (candidate) => candidate.id === application.volunteerId,
  );

  return {
    ...application,
    opportunity: vacancy
      ? { id: vacancy.id, slug: vacancy.slug, title: vacancy.title }
      : null,
    volunteer: volunteer
      ? {
          id: volunteer.id,
          displayName: volunteer.displayName,
          profile: volunteer.profile,
        }
      : null,
  };
}

function statistics() {
  const vacancies = ownedVacancies();
  const applications = ownedApplications();
  const attendance = applications.flatMap((application) =>
    application.attendance ? [application.attendance] : [],
  );
  const coordinators = state.users.filter((user) => user.coordinatorAccount);

  return {
    scope: global ? "global" : "own",
    range: {
      from: new Date(Date.now() - 30 * 86_400_000).toISOString(),
      to: new Date().toISOString(),
    },
    totals: {
      vacancies: vacancies.length,
      publishedVacancies: vacancies.filter(
        (vacancy) => vacancy.publishedAt && !vacancy.archivedAt,
      ).length,
      applications: applications.length,
      pendingReview: applications.filter((application) =>
        ["submitted", "under_review"].includes(application.status),
      ).length,
      accepted: applications.filter((application) => application.status === "accepted")
        .length,
      awaitingAttendance: attendance.filter(
        (record) => record.outcome === "awaiting_confirmation",
      ).length,
      attended: attendance.filter((record) => record.outcome === "attended").length,
      confirmedHours: attendance.reduce(
        (total, record) => total + Number(record.confirmedHours ?? 0),
        0,
      ),
      ...(global
        ? {
            volunteers: state.users.filter((user) => user.roles.includes("volunteer"))
              .length,
            coordinators: {
              active: coordinators.filter(
                (user) => user.coordinatorAccount?.status === "active",
              ).length,
              blocked: coordinators.filter(
                (user) => user.coordinatorAccount?.status === "blocked",
              ).length,
              removed: coordinators.filter(
                (user) => user.coordinatorAccount?.status === "removed",
              ).length,
            },
          }
        : {}),
    },
  };
}

function userDetail(id: string) {
  const user = reachableVolunteers().find((candidate) => candidate.id === id);
  if (!user) return undefined;

  const applications = (global ? state.applications : ownedApplications()).filter(
    (application) => application.volunteerId === id,
  );

  return { ...user, applications: applications.map(withRelations) };
}

function coordinatorDetail(id: string) {
  const user = state.users.find(
    (candidate) => candidate.id === id && candidate.coordinatorAccount,
  );
  if (!user) return undefined;

  return {
    ...user,
    createdOpportunities: state.vacancies
      .filter((vacancy) => vacancy.createdById === id)
      .map((vacancy) => ({
        id: vacancy.id,
        slug: vacancy.slug,
        title: vacancy.title,
        status: vacancy.status,
        publishedAt: vacancy.publishedAt,
        archivedAt: vacancy.archivedAt,
        createdAt: vacancy.createdAt,
      })),
    auditLogs: state.audit.filter((event) => event.actorUserId === id),
  };
}

const readers: Record<string, (params: Params, query: Query) => unknown> = {
  currentUser: () => state.users.find((user) => user.id === actorId),
  statistics: () => statistics(),
  activity: () => state.audit.filter((event) => event.actorUserId === actorId),
  audit: (_params, query) => {
    const action = text(query, "action");
    const actor = text(query, "actorUserId");
    const filtered = state.audit.filter(
      (event) =>
        (!action || event.action.toLowerCase().includes(action)) &&
        (!actor || event.actorUserId === actor),
    );
    return paged(filtered, query);
  },
  vacancies: () => ownedVacancies().map(withOrganization),
  vacancy: (params) => {
    const vacancy = ownedVacancies().find((item) => item.id === params?.id);
    return vacancy ? withOrganization(vacancy) : undefined;
  },
  application: (params) => {
    const application = ownedApplications().find((item) => item.id === params?.id);
    return application ? withRelations(application) : undefined;
  },
  applications: (_params, query) => {
    const status = text(query, "status");
    const opportunityId = text(query, "opportunityId");
    return ownedApplications()
      .filter(
        (application) =>
          (!status || application.status === status) &&
          (!opportunityId || application.opportunityId === opportunityId),
      )
      .map(withRelations);
  },
  users: (_params, query) =>
    paged(
      reachableVolunteers().filter((user) => matches(user, text(query, "q"))),
      query,
    ),
  user: (params) => (params?.id ? userDetail(params.id) : undefined),
  coordinators: (_params, query) =>
    paged(
      state.users
        .filter((user) => user.coordinatorAccount)
        .filter((user) => matches(user, text(query, "q")))
        .map((user) => ({
          ...user,
          _count: {
            createdOpportunities: state.vacancies.filter(
              (vacancy) => vacancy.createdById === user.id,
            ).length,
            auditLogs: state.audit.filter((event) => event.actorUserId === user.id)
              .length,
          },
        })),
      query,
    ),
  coordinator: (params) => (params?.id ? coordinatorDetail(params.id) : undefined),
  organizations: () => state.organizations,
};

export function readFixture(
  name: string,
  { params, query }: { params?: Record<string, string>; query?: Query },
): unknown {
  return readers[name]?.(params, query);
}

function record(action: string, entityType: string, entityId: string) {
  state.audit.unshift({
    id: crypto.randomUUID(),
    action,
    entityType,
    entityId,
    metadata: null,
    actorUserId: actorId,
    createdAt: new Date().toISOString(),
  });
}

function vacancyFor(id: string | undefined): FixtureVacancy | undefined {
  if (!id) return undefined;
  return ownedVacancies().find((vacancy) => vacancy.id === id);
}

const writers: Record<string, (params: Params, body: unknown) => ActionResult> = {
  createVacancy: (_params, body) => {
    const input = body as Record<string, string>;
    const now = new Date().toISOString();
    const created: FixtureVacancy = {
      id: crypto.randomUUID(),
      slug: input.slug ?? "",
      title: input.title ?? "",
      summary: input.summary ?? "",
      description: input.description ?? "",
      requirements: [],
      region: input.region ?? "tashkent-city",
      city: input.city ?? null,
      format: input.format ?? "onsite",
      status: "open",
      startsAt: input.startsAt ?? now,
      endsAt: input.endsAt ?? null,
      applicationDeadline: input.applicationDeadline ?? now,
      locationName: input.locationName ?? null,
      imageUrl: null,
      capacity: input.capacity ? Number(input.capacity) : null,
      publishedAt: null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      organizationId: input.organizationId ?? state.organizations[0]!.id,
      createdById: actorId,
      questions: [],
    };
    if (state.vacancies.some((vacancy) => vacancy.slug === created.slug)) {
      return failedResult("slugUnavailable");
    }
    state.vacancies.unshift(created);
    record("opportunity.created", "Opportunity", created.id);
    return okResult;
  },
  updateVacancy: (params, body) => {
    const vacancy = vacancyFor(params?.id);
    if (!vacancy) return failedResult("opportunityNotFound");
    Object.assign(vacancy, body, { updatedAt: new Date().toISOString() });
    record("opportunity.updated", "Opportunity", vacancy.id);
    return okResult;
  },
  publishVacancy: (params) => {
    const vacancy = vacancyFor(params?.id);
    if (!vacancy) return failedResult("opportunityNotFound");
    const organization = state.organizations.find(
      (candidate) => candidate.id === vacancy.organizationId,
    );
    if (!organization?.verified) return failedResult("organizationNotVerified");
    vacancy.publishedAt = new Date().toISOString();
    record("opportunity.published", "Opportunity", vacancy.id);
    return okResult;
  },
  archiveVacancy: (params) => {
    const vacancy = vacancyFor(params?.id);
    if (!vacancy) return failedResult("opportunityNotFound");
    vacancy.archivedAt = new Date().toISOString();
    record("opportunity.archived", "Opportunity", vacancy.id);
    return okResult;
  },
  reviewApplication: (params, body) => {
    const application = ownedApplications().find(
      (candidate) => candidate.id === params?.id,
    );
    if (!application) return failedResult("applicationNotFound");
    if (!["submitted", "under_review", "accepted"].includes(application.status)) {
      return failedResult("applicationCannotBeReviewed");
    }
    const input = body as { status?: string; reviewerNote?: string };
    application.status = input.status ?? application.status;
    application.reviewerNote = input.reviewerNote ?? application.reviewerNote;
    application.reviewedAt = new Date().toISOString();
    application.updatedAt = application.reviewedAt;
    if (application.status === "accepted" && !application.attendance) {
      application.attendance = {
        id: crypto.randomUUID(),
        outcome: "awaiting_confirmation",
        scheduledHours: null,
        confirmedHours: null,
        resolvedAt: null,
        applicationId: application.id,
        volunteerId: application.volunteerId,
        opportunityId: application.opportunityId,
      };
    }
    record("application.reviewed", "Application", application.id);
    return okResult;
  },
  resolveAttendance: (params, body) => {
    const application = ownedApplications().find(
      (candidate) => candidate.id === params?.applicationId,
    );
    if (!application?.attendance) return failedResult("attendanceNotFound");
    const input = body as { outcome?: string; confirmedHours?: number };
    if (input.outcome === "attended" && input.confirmedHours === undefined) {
      return failedResult("confirmedHoursRequired");
    }
    application.attendance.outcome = input.outcome ?? "attended";
    application.attendance.confirmedHours =
      input.outcome === "attended" ? String(input.confirmedHours ?? 0) : null;
    application.attendance.resolvedAt = new Date().toISOString();
    record("attendance.resolved", "attendance", application.attendance.id);
    return okResult;
  },
  replaceUserPassword: (params) => {
    const user = reachableVolunteers().find((candidate) => candidate.id === params?.id);
    if (!user) return failedResult("userNotFound");
    user.passwordCredential = {
      passwordChangedAt: new Date().toISOString(),
      requiresPasswordChange: true,
    };
    record("user.password.replaced", "User", user.id);
    return okResult;
  },
  replaceCoordinatorPassword: (params) => {
    const user = state.users.find(
      (candidate) => candidate.id === params?.id && candidate.coordinatorAccount,
    );
    if (!user) return failedResult("userNotFound");
    user.passwordCredential = {
      passwordChangedAt: new Date().toISOString(),
      requiresPasswordChange: true,
    };
    record("user.password.replaced", "User", user.id);
    return okResult;
  },
  createCoordinator: (_params, body) => {
    const input = body as { displayName?: string; email?: string };
    const email = input.email?.trim().toLowerCase() ?? "";
    if (state.users.some((user) => user.email === email)) {
      return failedResult("emailUnavailable");
    }
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    state.users.push({
      id,
      displayName: input.displayName ?? "",
      email,
      emailVerifiedAt: null,
      isActive: true,
      createdAt: now,
      roles: ["coordinator"],
      profile: null,
      passwordCredential: { passwordChangedAt: now, requiresPasswordChange: true },
      coordinatorAccount: {
        userId: id,
        status: "active",
        blockedAt: null,
        removedAt: null,
        createdAt: now,
      },
    });
    record("coordinator.created", "User", id);
    return okResult;
  },
  blockCoordinator: (params) => setCoordinatorStatus(params?.id, "blocked"),
  unblockCoordinator: (params) => setCoordinatorStatus(params?.id, "active"),
  removeCoordinator: (params, body) => {
    const user = state.users.find(
      (candidate) => candidate.id === params?.id && candidate.coordinatorAccount,
    );
    if (!user || user.coordinatorAccount?.status === "removed") {
      return failedResult("coordinatorNotFound");
    }
    const input = body as { reassignToCoordinatorId?: string };
    const active = state.vacancies.filter(
      (vacancy) => vacancy.createdById === user.id && !vacancy.archivedAt,
    );
    if (active.length > 0 && !input.reassignToCoordinatorId) {
      return failedResult("coordinatorHasActiveOpportunities");
    }
    if (input.reassignToCoordinatorId === user.id) {
      return failedResult("invalidCoordinatorReassignment");
    }
    if (input.reassignToCoordinatorId) {
      const target = state.users.find(
        (candidate) =>
          candidate.id === input.reassignToCoordinatorId &&
          candidate.coordinatorAccount?.status === "active",
      );
      if (!target) return failedResult("coordinatorNotFound");
      for (const vacancy of active) vacancy.createdById = target.id;
    }
    user.coordinatorAccount = {
      ...user.coordinatorAccount!,
      status: "removed",
      removedAt: new Date().toISOString(),
    };
    user.roles = [];
    user.isActive = false;
    record("coordinator.removed", "User", user.id);
    return okResult;
  },
  createOrganization: (_params, body) => {
    const input = body as { name?: string; slug?: string; verified?: boolean };
    if (state.organizations.some((organization) => organization.slug === input.slug)) {
      return failedResult("slugUnavailable");
    }
    state.organizations.push({
      id: crypto.randomUUID(),
      name: input.name ?? "",
      slug: input.slug ?? "",
      logoUrl: null,
      verified: input.verified ?? false,
    });
    return okResult;
  },
  updateOrganization: (params, body) => {
    const organization = state.organizations.find(
      (candidate) => candidate.id === params?.id,
    );
    if (!organization) return failedResult("organizationNotFound");
    Object.assign(organization, body);
    return okResult;
  },
  changePassword: () => okResult,
};

function setCoordinatorStatus(id: string | undefined, status: string): ActionResult {
  const user = state.users.find(
    (candidate) => candidate.id === id && candidate.coordinatorAccount,
  );
  if (!user || user.coordinatorAccount?.status === "removed") {
    return failedResult("coordinatorNotFound");
  }
  user.coordinatorAccount = {
    ...user.coordinatorAccount!,
    status,
    blockedAt: status === "blocked" ? new Date().toISOString() : null,
  };
  user.isActive = status === "active";
  record(`coordinator.${status}`, "User", user.id);
  return okResult;
}

export function writeFixture(
  name: string,
  { params, body }: { params?: Record<string, string>; body?: unknown },
): ActionResult {
  const writer = writers[name];
  if (!writer) return failedResult("awaitingContract");
  return writer(params, body);
}
