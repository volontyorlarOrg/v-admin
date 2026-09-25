import "server-only";

import { read } from "@/lib/api/gateway.server";
import {
  organizationAccountListSchema,
  type OrganizationAccount,
} from "@/lib/api/schemas";
import type { Loaded } from "@/lib/api/load";

export function loadOrganizationAccounts(): Promise<Loaded<OrganizationAccount[]>> {
  return read("organizationAccounts", { schema: organizationAccountListSchema });
}
