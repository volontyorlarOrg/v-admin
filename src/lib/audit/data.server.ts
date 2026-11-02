import "server-only";

import { read } from "@/lib/api/gateway.server";
import { auditPageSchema, type AuditPage } from "@/lib/api/schemas";
import type { Loaded } from "@/lib/api/load";

export type { AuditPage };

export type AuditQuery = {
  actorUserId?: string;
  action?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
};

export function loadAudit(query: AuditQuery): Promise<Loaded<AuditPage>> {
  return read("audit", { schema: auditPageSchema, query });
}
