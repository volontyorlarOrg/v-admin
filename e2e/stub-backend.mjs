import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.STUB_PORT ?? 3603);
const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.STUB_ACCESS_TTL ?? 900);
const DAY = 86_400_000;
const START = Date.UTC(2026, 8, 1, 6, 0, 0);

const at = (days, hour = 9) =>
  new Date(START + days * DAY + (hour - 6) * 3_600_000).toISOString();

const ADMIN = "00000000-0000-4000-8000-000000000100";
const COORDINATOR = "00000000-0000-4000-8000-000000000101";
const OTHER_COORDINATOR = "00000000-0000-4000-8000-000000000102";
const TEMPORARY_COORDINATOR = "00000000-0000-4000-8000-000000000104";
const TEMPORARY_ADMIN = "00000000-0000-4000-8000-000000000105";

const PASSWORD = "stub-password";

let state;

function reset() {
  state = {
    users: [
      {
        id: ADMIN,
        displayName: "Stub Administrator",
        email: "administrator@example.org",
        password: PASSWORD,
        roles: ["admin"],
        isActive: true,
        createdAt: at(-200),
        emailVerifiedAt: at(-200),
        profile: null,
        passwordCredential: {
          passwordChangedAt: at(-190),
          requiresPasswordChange: false,
        },
        coordinatorAccount: null,
      },
      {
        id: COORDINATOR,
        displayName: "Nodira Alimova",
        email: "coordinator@example.org",
        password: PASSWORD,
        roles: ["coordinator"],
        isActive: true,
        createdAt: at(-120),
        emailVerifiedAt: null,
        profile: null,
        passwordCredential: {
          passwordChangedAt: at(-110),
          requiresPasswordChange: false,
        },
        coordinatorAccount: {
          userId: COORDINATOR,
          status: "active",
          blockedAt: null,
          removedAt: null,
          createdAt: at(-120),
        },
      },
      {
        id: OTHER_COORDINATOR,
        displayName: "Bekzod Rustamov",
        email: "other@example.org",
        password: PASSWORD,
        roles: ["coordinator"],
        isActive: true,
        createdAt: at(-100),
        emailVerifiedAt: null,
        profile: null,
        passwordCredential: {
          passwordChangedAt: at(-90),
          requiresPasswordChange: false,
        },
        coordinatorAccount: {
          userId: OTHER_COORDINATOR,
          status: "active",
          blockedAt: null,
          removedAt: null,
          createdAt: at(-100),
        },
      },
      {
        id: TEMPORARY_COORDINATOR,
        displayName: "Malika Yusupova",
        email: "temporary@example.org",
        password: PASSWORD,
        roles: ["coordinator"],
        isActive: true,
        createdAt: at(-2),
        emailVerifiedAt: null,
        profile: null,
        passwordCredential: { passwordChangedAt: at(-2), requiresPasswordChange: true },
        coordinatorAccount: {
          userId: TEMPORARY_COORDINATOR,
          status: "active",
          blockedAt: null,
          removedAt: null,
          createdAt: at(-2),
        },
      },
      {
        id: TEMPORARY_ADMIN,
        displayName: "Provisioned Administrator",
        email: "provisioned@example.org",
        password: PASSWORD,
        roles: ["admin"],
        isActive: true,
        createdAt: at(-1),
        emailVerifiedAt: null,
        profile: null,
        passwordCredential: { passwordChangedAt: at(-1), requiresPasswordChange: true },
        coordinatorAccount: null,
      },
      volunteer("00000000-0000-4000-8000-000000000201", "Dilnoza Karimova"),
      volunteer("00000000-0000-4000-8000-000000000202", "Sardor Toshmatov"),
      volunteer("00000000-0000-4000-8000-000000000203", "Aziza Nazarova"),
    ],
    organizations: [
      {
        id: "00000000-0000-4000-8000-000000000301",
        name: "Chilonzor Reading Corners",
        slug: "chilonzor-reading-corners",
        logoUrl: null,
        verified: true,
      },
      {
        id: "00000000-0000-4000-8000-000000000302",
        name: "Green Corridor Group",
        slug: "green-corridor-group",
        logoUrl: null,
        verified: false,
      },
    ],
    vacancies: [
      vacancy(
        "00000000-0000-4000-8000-000000000401",
        "winter-book-drive",
        "Winter book drive",
        COORDINATOR,
        {
          publishedAt: at(-6),
        },
      ),
      vacancy(
        "00000000-0000-4000-8000-000000000402",
        "reading-room-weekends",
        "Reading room weekends",
        COORDINATOR,
        {},
      ),
      vacancy(
        "00000000-0000-4000-8000-000000000403",
        "city-sports-day",
        "City sports day",
        OTHER_COORDINATOR,
        {
          publishedAt: at(-3),
        },
      ),
    ],
    applications: [
      application(
        "00000000-0000-4000-8000-000000000601",
        "00000000-0000-4000-8000-000000000401",
        "00000000-0000-4000-8000-000000000201",
        "submitted",
      ),
      application(
        "00000000-0000-4000-8000-000000000602",
        "00000000-0000-4000-8000-000000000401",
        "00000000-0000-4000-8000-000000000202",
        "accepted",
        {
          attendance: {
            id: "00000000-0000-4000-8000-000000000801",
            outcome: "awaiting_confirmation",
            scheduledHours: "4.00",
            confirmedHours: null,
            resolvedAt: null,
            applicationId: "00000000-0000-4000-8000-000000000602",
            volunteerId: "00000000-0000-4000-8000-000000000202",
            opportunityId: "00000000-0000-4000-8000-000000000401",
          },
        },
      ),
      application(
        "00000000-0000-4000-8000-000000000603",
        "00000000-0000-4000-8000-000000000403",
        "00000000-0000-4000-8000-000000000203",
        "submitted",
      ),
    ],
    audit: [
      {
        id: "00000000-0000-4000-8000-000000000901",
        action: "opportunity.published",
        entityType: "Opportunity",
        entityId: "00000000-0000-4000-8000-000000000401",
        metadata: null,
        actorUserId: COORDINATOR,
        createdAt: at(-6),
      },
      {
        id: "00000000-0000-4000-8000-000000000902",
        action: "coordinator.created",
        entityType: "User",
        entityId: OTHER_COORDINATOR,
        metadata: null,
        actorUserId: ADMIN,
        createdAt: at(-100),
      },
    ],
    sessions: new Map(),
  };
}

function volunteer(id, displayName) {
  return {
    id,
    displayName,
    email: `${displayName.split(" ")[0].toLowerCase()}@example.org`,
    password: PASSWORD,
    roles: ["volunteer"],
    isActive: true,
    createdAt: at(-80),
    emailVerifiedAt: at(-70),
    profile: { fullName: displayName, region: "tashkent-city", school: "School 143" },
    passwordCredential: { passwordChangedAt: at(-60), requiresPasswordChange: false },
    coordinatorAccount: null,
  };
}

function vacancy(id, slug, title, createdById, overrides) {
  return {
    id,
    slug,
    title,
    summary: `${title} summary`,
    description: `${title} description`,
    requirements: [],
    region: "tashkent-city",
    city: "Tashkent",
    format: "onsite",
    status: "open",
    startsAt: at(12, 10),
    endsAt: null,
    applicationDeadline: at(5, 18),
    locationName: null,
    imageUrl: null,
    capacity: 20,
    publishedAt: null,
    archivedAt: null,
    createdAt: at(-8),
    updatedAt: at(-8),
    organizationId: "00000000-0000-4000-8000-000000000301",
    createdById,
    questions: [],
    ...overrides,
  };
}

function application(id, opportunityId, volunteerId, status, overrides = {}) {
  return {
    id,
    status,
    reviewerNote: null,
    profileSnapshot: { fullName: "Applicant snapshot", region: "tashkent-city" },
    submittedAt: at(-4),
    reviewedAt: null,
    withdrawnAt: null,
    createdAt: at(-5),
    updatedAt: at(-4),
    volunteerId,
    opportunityId,
    answers: [
      {
        id: `${id}-answer`,
        questionPrompt: "Why does this matter to you?",
        questionType: "long_text",
        applicationQuestionId: null,
        value: "Because the reading corner near my school has no books left.",
      },
    ],
    attendance: null,
    ...overrides,
  };
}

reset();

const userById = (id) => state.users.find((user) => user.id === id);

function issueSession(user) {
  const accessToken = `access-${randomUUID()}`;
  const refreshToken = `refresh-${randomUUID()}`;
  state.sessions.set(accessToken, { userId: user.id, refreshToken });
  state.sessions.set(refreshToken, { userId: user.id, refresh: true });

  return {
    userId: user.id,
    accessToken,
    refreshToken,
    accessTokenExpiresAt: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS,
    displayName: user.displayName,
    roles: user.roles,
    passwordChangeRequired: user.passwordCredential?.requiresPasswordChange ?? false,
  };
}

function authenticate(request) {
  const header = request.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const session = state.sessions.get(token);
  if (!session || session.refresh) return null;
  const user = userById(session.userId);
  return user?.isActive ? user : null;
}

function send(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(body === undefined ? "" : JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

const isAdmin = (user) => user.roles.includes("admin");

function ownedVacancies(user) {
  return isAdmin(user)
    ? state.vacancies
    : state.vacancies.filter((item) => item.createdById === user.id);
}

function ownedApplications(user) {
  const ids = new Set(ownedVacancies(user).map((item) => item.id));
  return state.applications.filter((item) => ids.has(item.opportunityId));
}

function withRelations(item) {
  const opportunity = state.vacancies.find((v) => v.id === item.opportunityId);
  const person = userById(item.volunteerId);
  return {
    ...item,
    opportunity: opportunity
      ? { id: opportunity.id, slug: opportunity.slug, title: opportunity.title }
      : null,
    volunteer: person
      ? { id: person.id, displayName: person.displayName, profile: person.profile }
      : null,
  };
}

function withOrganization(item) {
  return {
    ...item,
    organization: state.organizations.find((o) => o.id === item.organizationId) ?? null,
  };
}

function directory(items, url) {
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const page = Number(url.searchParams.get("page") ?? 1) || 1;
  const pageSize = Number(url.searchParams.get("pageSize") ?? 25) || 25;
  const matched = items.filter(
    (item) => !q || `${item.displayName} ${item.email ?? ""}`.toLowerCase().includes(q),
  );
  const offset = (page - 1) * pageSize;
  return {
    items: matched.slice(offset, offset + pageSize),
    page,
    pageSize,
    total: matched.length,
  };
}

function publicUser(user) {
  const rest = { ...user };
  delete rest.password;
  return rest;
}

function record(action, entityType, entityId, actorUserId) {
  state.audit.unshift({
    id: randomUUID(),
    action,
    entityType,
    entityId,
    metadata: null,
    actorUserId,
    createdAt: new Date().toISOString(),
  });
}

function statisticsFor(user) {
  const vacancies = ownedVacancies(user);
  const applications = ownedApplications(user);
  const attendance = applications.flatMap((item) =>
    item.attendance ? [item.attendance] : [],
  );
  const coordinators = state.users.filter((item) => item.coordinatorAccount);

  return {
    scope: isAdmin(user) ? "global" : "own",
    range: {
      from: new Date(Date.now() - 30 * DAY).toISOString(),
      to: new Date().toISOString(),
    },
    totals: {
      vacancies: vacancies.length,
      publishedVacancies: vacancies.filter((v) => v.publishedAt && !v.archivedAt)
        .length,
      applications: applications.length,
      pendingReview: applications.filter((a) =>
        ["submitted", "under_review"].includes(a.status),
      ).length,
      accepted: applications.filter((a) => a.status === "accepted").length,
      awaitingAttendance: attendance.filter(
        (a) => a.outcome === "awaiting_confirmation",
      ).length,
      attended: attendance.filter((a) => a.outcome === "attended").length,
      confirmedHours: attendance.reduce(
        (sum, a) => sum + Number(a.confirmedHours ?? 0),
        0,
      ),
      ...(isAdmin(user)
        ? {
            volunteers: state.users.filter((u) => u.roles.includes("volunteer")).length,
            coordinators: {
              active: coordinators.filter(
                (c) => c.coordinatorAccount.status === "active",
              ).length,
              blocked: coordinators.filter(
                (c) => c.coordinatorAccount.status === "blocked",
              ).length,
              removed: coordinators.filter(
                (c) => c.coordinatorAccount.status === "removed",
              ).length,
            },
          }
        : {}),
    },
  };
}

function replacePassword(actor, targetId, temporaryPassword, coordinatorScopedTo) {
  const target = userById(targetId);
  if (!target || target.roles.includes("admin")) {
    return { status: 404, body: { code: "userNotFound" } };
  }
  if (coordinatorScopedTo) {
    const reachable = ownedApplications(coordinatorScopedTo).some(
      (item) => item.volunteerId === targetId,
    );
    if (!reachable) return { status: 404, body: { code: "userNotFound" } };
  }
  if (!temporaryPassword || temporaryPassword.length < 8) {
    return { status: 422, body: { code: "weakPassword" } };
  }

  target.password = temporaryPassword;
  target.passwordCredential = {
    passwordChangedAt: new Date().toISOString(),
    requiresPasswordChange: true,
  };
  for (const [token, session] of state.sessions) {
    if (session.userId === targetId) state.sessions.delete(token);
  }
  record("user.password.replaced", "User", targetId, actor.id);

  return {
    status: 200,
    body: {
      id: targetId,
      passwordChangedAt: target.passwordCredential.passwordChangedAt,
      requiresPasswordChange: true,
    },
  };
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${PORT}`);
  const path = url.pathname;
  const method = request.method ?? "GET";
  const body = method === "GET" ? {} : await readJson(request);

  if (path === "/health/live") return send(response, 200, { status: "ok" });

  if (path === "/__stub/reset" && method === "POST") {
    reset();
    return send(response, 200, { status: "reset" });
  }

  if (path === "/__stub/expire" && method === "POST") {
    state.sessions.clear();
    return send(response, 200, { status: "expired" });
  }

  if (path === "/auth/staff/login" || path === "/auth/admin/login") {
    const role = path === "/auth/admin/login" ? "admin" : "coordinator";
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const user = state.users.find((item) => item.email === email);
    const allowed =
      user?.isActive &&
      user.password === body.password &&
      user.roles.includes(role) &&
      (role !== "coordinator" || user.coordinatorAccount?.status === "active");

    if (!allowed) return send(response, 401, { code: "invalidCredentials" });
    return send(response, 200, issueSession(user));
  }

  if (path === "/auth/refresh" && method === "POST") {
    const session = state.sessions.get(String(body.refreshToken ?? ""));
    if (!session?.refresh) return send(response, 401, { code: "invalidRefreshToken" });
    state.sessions.delete(String(body.refreshToken));
    const user = userById(session.userId);
    if (!user?.isActive) return send(response, 401, { code: "invalidRefreshToken" });
    return send(response, 200, issueSession(user));
  }

  const actor = authenticate(request);
  if (!actor) return send(response, 401, { code: "unauthenticated" });

  if (path === "/auth/logout" && method === "POST") {
    for (const [token, session] of state.sessions) {
      if (session.userId === actor.id) state.sessions.delete(token);
    }
    return send(response, 200, { status: "signedOut" });
  }

  if (path === "/auth/password/change" && method === "POST") {
    if (actor.password !== body.currentPassword) {
      return send(response, 401, { code: "invalidCredentials" });
    }
    if (!body.newPassword || String(body.newPassword).length < 8) {
      return send(response, 422, { code: "weakPassword" });
    }
    actor.password = String(body.newPassword);
    actor.passwordCredential = {
      passwordChangedAt: new Date().toISOString(),
      requiresPasswordChange: false,
    };
    return send(response, 200, { status: "changed" });
  }

  if (path === "/me") return send(response, 200, publicUser(actor));

  if (path === "/organizations" && method === "GET") {
    return send(response, 200, state.organizations);
  }

  if (actor.passwordCredential?.requiresPasswordChange) {
    return send(response, 403, { code: "passwordChangeRequired" });
  }

  const staff = path.startsWith("/staff/");
  const admin = path.startsWith("/admin/");

  if (staff && !actor.roles.includes("coordinator") && !isAdmin(actor)) {
    return send(response, 403, { code: "forbidden" });
  }
  if (admin && !isAdmin(actor)) return send(response, 403, { code: "forbidden" });

  if (path === "/staff/statistics" || path === "/admin/statistics") {
    return send(response, 200, statisticsFor(actor));
  }

  if (path === "/staff/activity") {
    return send(
      response,
      200,
      state.audit.filter((event) => event.actorUserId === actor.id),
    );
  }

  if (path === "/admin/audit") {
    const action = url.searchParams.get("action");
    const actorUserId = url.searchParams.get("actorUserId");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const page = Number(url.searchParams.get("page") ?? 1) || 1;
    const pageSize = Number(url.searchParams.get("pageSize") ?? 50) || 50;
    const matched = state.audit.filter(
      (event) =>
        (!action || event.action === action) &&
        (!actorUserId || event.actorUserId === actorUserId) &&
        (!from || event.createdAt >= from) &&
        (!to || event.createdAt <= to),
    );
    const offset = (page - 1) * pageSize;
    return send(response, 200, {
      items: matched.slice(offset, offset + pageSize),
      page,
      pageSize,
      total: matched.length,
    });
  }

  if (path === "/staff/opportunities" || path === "/admin/opportunities") {
    if (method === "GET") {
      return send(response, 200, ownedVacancies(actor).map(withOrganization));
    }
    if (method === "POST") {
      if (state.vacancies.some((item) => item.slug === body.slug)) {
        return send(response, 409, { code: "slugUnavailable" });
      }
      const created = vacancy(randomUUID(), body.slug, body.title, actor.id, {
        summary: body.summary,
        description: body.description,
        region: body.region,
        format: body.format,
        city: body.city ?? null,
        startsAt: body.startsAt,
        applicationDeadline: body.applicationDeadline,
        organizationId: body.organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        requirements: body.requirements ?? [],
        capacity: body.capacity ?? null,
      });
      state.vacancies.unshift(created);
      record("opportunity.created", "Opportunity", created.id, actor.id);
      return send(response, 201, created);
    }
  }

  const vacancyMatch =
    /^\/(staff|admin)\/opportunities\/([^/]+)(?:\/(publish|archive))?$/.exec(path);
  if (vacancyMatch) {
    const [, , id, verb] = vacancyMatch;
    const item = ownedVacancies(actor).find((candidate) => candidate.id === id);
    if (!item) return send(response, 404, { code: "opportunityNotFound" });

    if (!verb && method === "PATCH") {
      Object.assign(item, body, { updatedAt: new Date().toISOString() });
      record("opportunity.updated", "Opportunity", item.id, actor.id);
      return send(response, 200, item);
    }
    if (verb === "publish" && method === "POST") {
      const organization = state.organizations.find(
        (o) => o.id === item.organizationId,
      );
      if (!organization?.verified) {
        return send(response, 409, { code: "organizationNotVerified" });
      }
      item.publishedAt = new Date().toISOString();
      record("opportunity.published", "Opportunity", item.id, actor.id);
      return send(response, 201, item);
    }
    if (verb === "archive" && method === "POST") {
      item.archivedAt = new Date().toISOString();
      record("opportunity.archived", "Opportunity", item.id, actor.id);
      return send(response, 201, item);
    }
  }

  if (path === "/staff/applications" || path === "/admin/applications") {
    const status = url.searchParams.get("status");
    const opportunityId = url.searchParams.get("opportunityId");
    return send(
      response,
      200,
      ownedApplications(actor)
        .filter(
          (item) =>
            (!status || item.status === status) &&
            (!opportunityId || item.opportunityId === opportunityId),
        )
        .map(withRelations),
    );
  }

  const reviewMatch = /^\/(staff|admin)\/applications\/([^/]+)\/review$/.exec(path);
  if (reviewMatch && method === "PATCH") {
    const item = ownedApplications(actor).find(
      (candidate) => candidate.id === reviewMatch[2],
    );
    if (!item) return send(response, 404, { code: "applicationNotFound" });
    if (!["submitted", "under_review", "accepted"].includes(item.status)) {
      return send(response, 409, { code: "applicationCannotBeReviewed" });
    }
    item.status = body.status;
    item.reviewerNote = body.reviewerNote ?? item.reviewerNote;
    item.reviewedAt = new Date().toISOString();
    item.updatedAt = item.reviewedAt;
    if (item.status === "accepted" && !item.attendance) {
      item.attendance = {
        id: randomUUID(),
        outcome: "awaiting_confirmation",
        scheduledHours: null,
        confirmedHours: null,
        resolvedAt: null,
        applicationId: item.id,
        volunteerId: item.volunteerId,
        opportunityId: item.opportunityId,
      };
    }
    record("application.reviewed", "Application", item.id, actor.id);
    return send(response, 200, item);
  }

  const attendanceMatch = /^\/(staff|admin)\/attendance\/([^/]+)$/.exec(path);
  if (attendanceMatch && method === "PUT") {
    const item = ownedApplications(actor).find(
      (candidate) => candidate.id === attendanceMatch[2],
    );
    if (!item?.attendance) return send(response, 404, { code: "attendanceNotFound" });
    if (body.outcome === "attended" && body.confirmedHours === undefined) {
      return send(response, 409, { code: "confirmedHoursRequired" });
    }
    item.attendance.outcome = body.outcome;
    item.attendance.confirmedHours =
      body.outcome === "attended" ? String(body.confirmedHours) : null;
    item.attendance.resolvedAt = new Date().toISOString();
    record("attendance.resolved", "attendance", item.attendance.id, actor.id);
    return send(response, 200, item.attendance);
  }

  if (path === "/staff/users" || path === "/admin/users") {
    const volunteers = state.users.filter((item) => item.roles.includes("volunteer"));
    const reachable = isAdmin(actor)
      ? volunteers
      : volunteers.filter((item) =>
          ownedApplications(actor).some((a) => a.volunteerId === item.id),
        );
    return send(response, 200, directory(reachable.map(publicUser), url));
  }

  const userMatch = /^\/(staff|admin)\/users\/([^/]+)(?:\/(password))?$/.exec(path);
  if (userMatch) {
    const [, , id, verb] = userMatch;
    const scope = isAdmin(actor) ? undefined : actor;

    if (verb === "password" && method === "PUT") {
      const outcome = replacePassword(actor, id, body.temporaryPassword, scope);
      return send(response, outcome.status, outcome.body);
    }

    if (!verb && method === "GET") {
      const target = userById(id);
      const applications = (
        isAdmin(actor) ? state.applications : ownedApplications(actor)
      )
        .filter((item) => item.volunteerId === id)
        .map(withRelations);
      if (!target || !target.roles.includes("volunteer")) {
        return send(response, 404, { code: "userNotFound" });
      }
      if (!isAdmin(actor) && applications.length === 0) {
        return send(response, 404, { code: "userNotFound" });
      }
      return send(response, 200, { ...publicUser(target), applications });
    }
  }

  if (path === "/admin/coordinators") {
    const coordinators = state.users.filter((item) => item.coordinatorAccount);
    if (method === "GET") {
      return send(
        response,
        200,
        directory(
          coordinators.map((item) => ({
            ...publicUser(item),
            _count: {
              createdOpportunities: state.vacancies.filter(
                (v) => v.createdById === item.id,
              ).length,
              auditLogs: state.audit.filter((e) => e.actorUserId === item.id).length,
            },
          })),
          url,
        ),
      );
    }
    if (method === "POST") {
      const email = String(body.email ?? "")
        .trim()
        .toLowerCase();
      if (state.users.some((item) => item.email === email)) {
        return send(response, 409, { code: "emailUnavailable" });
      }
      if (!body.temporaryPassword || String(body.temporaryPassword).length < 8) {
        return send(response, 422, { code: "weakPassword" });
      }
      const id = randomUUID();
      const now = new Date().toISOString();
      state.users.push({
        id,
        displayName: body.displayName,
        email,
        password: body.temporaryPassword,
        roles: ["coordinator"],
        isActive: true,
        createdAt: now,
        emailVerifiedAt: null,
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
      record("coordinator.created", "User", id, actor.id);
      return send(response, 201, { id });
    }
  }

  const coordinatorMatch =
    /^\/admin\/coordinators\/([^/]+)(?:\/(block|unblock|remove|password))?$/.exec(path);
  if (coordinatorMatch) {
    const [, id, verb] = coordinatorMatch;
    const target = state.users.find(
      (item) => item.id === id && item.coordinatorAccount,
    );
    if (!target) return send(response, 404, { code: "coordinatorNotFound" });

    if (!verb && method === "GET") {
      return send(response, 200, {
        ...publicUser(target),
        createdOpportunities: state.vacancies
          .filter((item) => item.createdById === id)
          .map(
            ({
              id: vacancyId,
              slug,
              title,
              status,
              publishedAt,
              archivedAt,
              createdAt,
            }) => ({
              id: vacancyId,
              slug,
              title,
              status,
              publishedAt,
              archivedAt,
              createdAt,
            }),
          ),
        auditLogs: state.audit.filter((event) => event.actorUserId === id),
      });
    }

    if ((verb === "block" || verb === "unblock") && method === "POST") {
      if (target.coordinatorAccount.status === "removed") {
        return send(response, 404, { code: "coordinatorNotFound" });
      }
      const status = verb === "block" ? "blocked" : "active";
      target.coordinatorAccount.status = status;
      target.coordinatorAccount.blockedAt =
        status === "blocked" ? new Date().toISOString() : null;
      target.isActive = status === "active";
      if (status === "blocked") {
        for (const [token, session] of state.sessions) {
          if (session.userId === id) state.sessions.delete(token);
        }
      }
      record(`coordinator.${status}`, "User", id, actor.id);
      return send(response, 201, { id, status, isActive: target.isActive });
    }

    if (verb === "remove" && method === "POST") {
      if (target.coordinatorAccount.status === "removed") {
        return send(response, 404, { code: "coordinatorNotFound" });
      }
      const active = state.vacancies.filter(
        (item) => item.createdById === id && !item.archivedAt,
      );
      const reassignTo = body.reassignToCoordinatorId;
      if (active.length > 0 && !reassignTo) {
        return send(response, 409, { code: "coordinatorHasActiveOpportunities" });
      }
      if (reassignTo === id) {
        return send(response, 409, { code: "invalidCoordinatorReassignment" });
      }
      if (reassignTo) {
        const replacement = state.users.find(
          (item) =>
            item.id === reassignTo && item.coordinatorAccount?.status === "active",
        );
        if (!replacement) return send(response, 404, { code: "coordinatorNotFound" });
        for (const item of active) item.createdById = reassignTo;
      }
      target.coordinatorAccount.status = "removed";
      target.coordinatorAccount.removedAt = new Date().toISOString();
      target.roles = [];
      target.isActive = false;
      for (const [token, session] of state.sessions) {
        if (session.userId === id) state.sessions.delete(token);
      }
      record("coordinator.removed", "User", id, actor.id);
      return send(response, 201, { id, status: "removed", isActive: false });
    }

    if (verb === "password" && method === "PUT") {
      const outcome = replacePassword(actor, id, body.temporaryPassword);
      return send(response, outcome.status, outcome.body);
    }
  }

  if (path === "/organizations" && method === "POST") {
    if (!isAdmin(actor)) return send(response, 403, { code: "forbidden" });
    if (state.organizations.some((item) => item.slug === body.slug)) {
      return send(response, 409, { code: "slugUnavailable" });
    }
    const created = {
      id: randomUUID(),
      name: body.name,
      slug: body.slug,
      logoUrl: body.logoUrl ?? null,
      verified: Boolean(body.verified),
    };
    state.organizations.push(created);
    return send(response, 201, created);
  }

  const organizationMatch = /^\/organizations\/([^/]+)$/.exec(path);
  if (organizationMatch && method === "PATCH") {
    if (!isAdmin(actor)) return send(response, 403, { code: "forbidden" });
    const target = state.organizations.find((item) => item.id === organizationMatch[1]);
    if (!target) return send(response, 404, { code: "organizationNotFound" });
    Object.assign(target, body);
    return send(response, 200, target);
  }

  return send(response, 404, { code: "notFound" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`stub backend listening on http://127.0.0.1:${PORT}`);
});
