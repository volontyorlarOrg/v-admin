import "server-only";

import { read } from "@/lib/api/gateway.server";
import { applicationListSchema, type Application } from "@/lib/api/schemas";
import type { Loaded } from "@/lib/api/load";
import type { ApplicationStatus } from "@/lib/domain/vocabulary";

export type ApplicationQuery = {
  status?: ApplicationStatus;
  vacancyId?: string;
};

export function loadApplications(
  filters: ApplicationQuery = {},
): Promise<Loaded<Application[]>> {
  return read("applications", {
    schema: applicationListSchema,
    query: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.vacancyId ? { opportunityId: filters.vacancyId } : {}),
    },
  });
}
