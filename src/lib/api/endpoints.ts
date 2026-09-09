export const CONTRACT_STATUSES = ["published", "announced", "requested"] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type Endpoint = {
  readonly method: HttpMethod;
  readonly path: string;
  readonly contract: ContractStatus;
};

export const endpoints = {
  logIn: { method: "POST", path: "/auth/admin/login", contract: "announced" },
  refresh: { method: "POST", path: "/auth/refresh", contract: "published" },
  logOut: { method: "POST", path: "/auth/logout", contract: "published" },
  changePassword: {
    method: "POST",
    path: "/auth/password/change",
    contract: "announced",
  },
  currentUser: { method: "GET", path: "/me", contract: "published" },

  statistics: { method: "GET", path: "/admin/statistics", contract: "announced" },
  audit: { method: "GET", path: "/admin/audit", contract: "published" },

  vacancies: { method: "GET", path: "/admin/opportunities", contract: "published" },
  createVacancy: {
    method: "POST",
    path: "/admin/opportunities",
    contract: "published",
  },
  updateVacancy: {
    method: "PATCH",
    path: "/admin/opportunities/{id}",
    contract: "published",
  },
  publishVacancy: {
    method: "POST",
    path: "/admin/opportunities/{id}/publish",
    contract: "published",
  },
  archiveVacancy: {
    method: "POST",
    path: "/admin/opportunities/{id}/archive",
    contract: "published",
  },

  applications: { method: "GET", path: "/admin/applications", contract: "published" },
  reviewApplication: {
    method: "PATCH",
    path: "/admin/applications/{id}/review",
    contract: "published",
  },

  resolveAttendance: {
    method: "PUT",
    path: "/admin/attendance/{applicationId}",
    contract: "published",
  },

  users: { method: "GET", path: "/admin/users", contract: "announced" },
  user: { method: "GET", path: "/admin/users/{id}", contract: "announced" },
  replaceUserPassword: {
    method: "PUT",
    path: "/admin/users/{id}/password",
    contract: "announced",
  },

  coordinators: { method: "GET", path: "/admin/coordinators", contract: "announced" },
  createCoordinator: {
    method: "POST",
    path: "/admin/coordinators",
    contract: "announced",
  },
  coordinator: {
    method: "GET",
    path: "/admin/coordinators/{id}",
    contract: "announced",
  },
  blockCoordinator: {
    method: "POST",
    path: "/admin/coordinators/{id}/block",
    contract: "announced",
  },
  unblockCoordinator: {
    method: "POST",
    path: "/admin/coordinators/{id}/unblock",
    contract: "announced",
  },
  removeCoordinator: {
    method: "POST",
    path: "/admin/coordinators/{id}/remove",
    contract: "announced",
  },
  replaceCoordinatorPassword: {
    method: "PUT",
    path: "/admin/coordinators/{id}/password",
    contract: "announced",
  },

  organizations: { method: "GET", path: "/organizations", contract: "published" },
  createOrganization: {
    method: "POST",
    path: "/organizations",
    contract: "published",
  },
  updateOrganization: {
    method: "PATCH",
    path: "/organizations/{id}",
    contract: "published",
  },
} as const satisfies Record<string, Endpoint>;

export type EndpointName = keyof typeof endpoints;

export function pathFor(
  name: EndpointName,
  params: Record<string, string> = {},
): string {
  return endpoints[name].path.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = params[key];
    if (!value) throw new Error(`Missing "${key}" for endpoint ${name}`);
    return encodeURIComponent(value);
  });
}

export function isPublished(name: EndpointName): boolean {
  return endpoints[name].contract === "published";
}
