import "server-only";

import { read } from "@/lib/api/gateway.server";
import { vacancyListSchema, vacancySchema } from "@/lib/api/schemas";
import type { Loaded } from "@/lib/api/load";
import type { Vacancy } from "@/lib/api/schemas";

export { loadOrganizations } from "@/lib/organizations/data.server";

export function loadVacancies(): Promise<Loaded<Vacancy[]>> {
  return read("vacancies", { schema: vacancyListSchema });
}

export function loadVacancy(id: string): Promise<Loaded<Vacancy>> {
  return read("vacancy", { schema: vacancySchema, params: { id } });
}
