import "server-only";

import { read } from "@/lib/api/gateway.server";
import { organizationListSchema, type Organization } from "@/lib/api/schemas";
import type { Loaded } from "@/lib/api/load";

export function loadOrganizations(): Promise<Loaded<Organization[]>> {
  return read("organizations", { schema: organizationListSchema });
}
