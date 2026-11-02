import "server-only";

import { dataOr } from "@/lib/api/load";
import type { Application } from "@/lib/api/schemas";
import { loadApplications } from "@/lib/applications/data.server";
import { volunteerNameOf } from "@/lib/applications/filters";
import { buildDirectory, type AuditDirectory } from "@/lib/audit/directory";
import { getSession } from "@/lib/auth/session.server";
import { loadCoordinators } from "@/lib/coordinators/data.server";
import { loadOrganizationAccounts } from "@/lib/organizations/accounts.server";
import { loadOrganizations } from "@/lib/organizations/data.server";
import { MAX_PAGE_SIZE } from "@/lib/routing/search-params";
import { loadVacancies } from "@/lib/vacancies/data.server";

export function applicationNames(applications: readonly Application[]) {
  return applications.map((application) => ({
    id: application.id,
    volunteerId: application.volunteerId,
    volunteerName: volunteerNameOf(application),
    vacancyTitle: application.opportunity?.title ?? "",
  }));
}

export async function loadAuditDirectory({
  applications: withApplications = true,
}: { applications?: boolean } = {}): Promise<AuditDirectory> {
  const [session, coordinators, organizations, accounts, vacancies, applications] =
    await Promise.all([
      getSession(),
      loadCoordinators({ page: 1, pageSize: MAX_PAGE_SIZE }),
      loadOrganizations(),
      loadOrganizationAccounts(),
      loadVacancies(),
      withApplications ? loadApplications() : Promise.resolve(null),
    ]);

  return buildDirectory({
    me: session?.userId ?? null,
    coordinators: dataOr(coordinators, null)?.items.map((coordinator) => ({
      id: coordinator.id,
      name: coordinator.displayName ?? coordinator.email ?? "",
    })),
    organizations: dataOr(organizations, []),
    organizationAccounts: dataOr(accounts, []),
    vacancies: dataOr(vacancies, []),
    applications: applications ? applicationNames(dataOr(applications, [])) : [],
  });
}
