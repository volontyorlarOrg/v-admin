import "server-only";

import { read } from "@/lib/api/gateway.server";
import { organizationListSchema, vacancyListSchema } from "@/lib/api/schemas";
import type { Loaded } from "@/lib/api/load";
import type { Organization, Vacancy } from "@/lib/api/schemas";

export function loadVacancies(): Promise<Loaded<Vacancy[]>> {
  return read("vacancies", { schema: vacancyListSchema });
}

export function loadOrganizations(): Promise<Loaded<Organization[]>> {
  return read("organizations", { schema: organizationListSchema });
}
