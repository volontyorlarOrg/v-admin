import "server-only";

import { read } from "@/lib/api/gateway.server";
import { auditEventSchema, pageSchema } from "@/lib/api/schemas";
import type { Loaded } from "@/lib/api/load";
import { z } from "zod";

export const auditPageSchema = z
  .union([z.array(auditEventSchema), pageSchema(auditEventSchema)])
  .transform((value) =>
    Array.isArray(value)
      ? { items: value, page: 1, pageSize: value.length, total: value.length }
      : value,
  );

export type AuditPage = z.infer<typeof auditPageSchema>;

export type AuditQuery = {
  actorUserId?: string;
  action?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
};

export function loadAudit(query: AuditQuery): Promise<Loaded<AuditPage>> {
  return read("audit", {
    schema: auditPageSchema,
    query: {
      ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.from ? { from: query.from } : {}),
      ...(query.to ? { to: query.to } : {}),
      page: query.page,
      pageSize: query.pageSize,
    },
  });
}
