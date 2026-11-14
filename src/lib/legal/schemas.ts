import { z } from "zod";

export const LEGAL_REQUEST_KINDS = [
  "access",
  "correction",
  "review",
  "erasure",
  "withdrawal",
] as const;

export const legalRequestSchema = z.object({
  id: z.uuid(),
  kind: z.enum(LEGAL_REQUEST_KINDS),
  message: z.string().max(2_000),
  status: z.enum(["open", "resolved", "cancelled"]),
  resolution: z.string().nullable(),
  createdAt: z.iso.datetime(),
  resolvedAt: z.iso.datetime().nullable(),
  requester: z.object({
    id: z.uuid(),
    displayName: z.string().nullable(),
    username: z.string(),
    email: z.string().nullable(),
  }),
});

export const legalQueueSchema = z.object({ items: z.array(legalRequestSchema) });

export const legalResolutionSchema = z.object({
  id: z.uuid(),
  resolution: z.string().trim().min(1).max(2_000),
});

export const legalReceiptSchema = z.object({ id: z.string(), status: z.string() });

export type LegalRequest = z.infer<typeof legalRequestSchema>;
