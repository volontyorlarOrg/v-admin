export const CONTRACT_STATUSES = ["published", "announced", "requested"] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type Endpoint = {
  readonly method: HttpMethod;
  readonly path: string;
  readonly contract: ContractStatus;
};

export const endpoints = {
  logIn: { method: "POST", path: "/auth/admin/login", contract: "published" },
  refresh: { method: "POST", path: "/auth/refresh", contract: "published" },
  logOut: { method: "POST", path: "/auth/logout", contract: "published" },
  changePassword: {
    method: "POST",
    path: "/auth/password/change",
    contract: "published",
  },
  currentUser: { method: "GET", path: "/me", contract: "published" },

  statistics: { method: "GET", path: "/admin/statistics", contract: "published" },
  audit: { method: "GET", path: "/admin/audit", contract: "published" },

  vacancies: { method: "GET", path: "/admin/opportunities", contract: "published" },
  vacancy: {
    method: "GET",
    path: "/admin/opportunities/{id}",
    contract: "published",
  },
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
  submitVacancyForApproval: {
    method: "POST",
    path: "/admin/opportunities/{id}/submit-for-approval",
    contract: "published",
  },
  approveVacancy: {
    method: "POST",
    path: "/admin/opportunities/{id}/approve",
    contract: "published",
  },
  requestVacancyChanges: {
    method: "POST",
    path: "/admin/opportunities/{id}/request-changes",
    contract: "published",
  },
  rejectVacancy: {
    method: "POST",
    path: "/admin/opportunities/{id}/reject",
    contract: "published",
  },
  archiveVacancy: {
    method: "POST",
    path: "/admin/opportunities/{id}/archive",
    contract: "published",
  },

  applications: { method: "GET", path: "/admin/applications", contract: "published" },
  application: {
    method: "GET",
    path: "/admin/applications/{id}",
    contract: "published",
  },
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
  resolveVacancyAttendance: {
    method: "PUT",
    path: "/staff/opportunities/{id}/attendance",
    contract: "published",
  },
  users: { method: "GET", path: "/admin/users", contract: "published" },
  user: { method: "GET", path: "/admin/users/{id}", contract: "published" },
  replaceUserPassword: {
    method: "PUT",
    path: "/admin/users/{id}/password",
    contract: "published",
  },

  coordinators: { method: "GET", path: "/admin/coordinators", contract: "published" },
  createCoordinator: {
    method: "POST",
    path: "/admin/coordinators",
    contract: "published",
  },
  coordinator: {
    method: "GET",
    path: "/admin/coordinators/{id}",
    contract: "published",
  },
  blockCoordinator: {
    method: "POST",
    path: "/admin/coordinators/{id}/block",
    contract: "published",
  },
  unblockCoordinator: {
    method: "POST",
    path: "/admin/coordinators/{id}/unblock",
    contract: "published",
  },
  removeCoordinator: {
    method: "POST",
    path: "/admin/coordinators/{id}/remove",
    contract: "published",
  },
  replaceCoordinatorPassword: {
    method: "PUT",
    path: "/admin/coordinators/{id}/password",
    contract: "published",
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
