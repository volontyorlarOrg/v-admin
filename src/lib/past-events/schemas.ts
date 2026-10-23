import { z } from "zod";

const nullable = <T extends z.ZodTypeAny>(schema: T) => schema.nullable().default(null);

export const PAST_EVENT_REQUEST_KINDS = ["create", "update", "remove"] as const;
export const PAST_EVENT_REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
] as const;

export type PastEventRequestKind = (typeof PAST_EVENT_REQUEST_KINDS)[number];
export type PastEventRequestStatus = (typeof PAST_EVENT_REQUEST_STATUSES)[number];

const recordedEventSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  eventDate: z.string(),
  hours: z.number(),
  xpAwarded: z.number().int(),
  countsTowardProgress: z.boolean().default(true),
  live: z.boolean().default(true),
});

export const pastEventRequestSchema = z.object({
  id: z.string().min(1),
  rosterId: nullable(z.string()),
  kind: z.enum(PAST_EVENT_REQUEST_KINDS),
  status: z.enum(PAST_EVENT_REQUEST_STATUSES),
  title: nullable(z.string()),
  eventDate: nullable(z.string()),
  hours: nullable(z.number()),
  xpAwarded: nullable(z.number().int()),
  note: nullable(z.string()),
  adjusted: z.boolean().default(false),
  reviewNote: nullable(z.string()),
  createdAt: z.string().min(1),
  reviewedAt: nullable(z.string()),
  organization: z.object({ id: z.string().min(1), name: z.string() }),
  volunteer: z.object({
    id: z.string().min(1),
    displayName: nullable(z.string()),
    username: z.string().default(""),
    avatarUrl: nullable(z.string()),
  }),
  event: nullable(recordedEventSchema),
  participation: z
    .object({
      attendedEvents: z.number().int().default(0),
      attendedHours: z.number().default(0),
      pastEvents: z.number().int().default(0),
    })
    .default({ attendedEvents: 0, attendedHours: 0, pastEvents: 0 }),
});

export type PastEventRequest = z.infer<typeof pastEventRequestSchema>;

export const pastEventRequestPageSchema = z.object({
  items: z.array(pastEventRequestSchema),
  page: z.number().int().default(1),
  pageSize: z.number().int().default(25),
  total: z.number().int().default(0),
  pending: z.number().int().default(0),
});

export type PastEventRequestPage = z.infer<typeof pastEventRequestPageSchema>;

export const PAST_EVENT_VIEWS = ["waiting", "reviewed"] as const;
export type PastEventView = (typeof PAST_EVENT_VIEWS)[number];

export const pastEventSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  eventDate: z.string(),
  note: nullable(z.string()),
  createdAt: z.string().min(1),
  organization: z.object({ id: z.string().min(1), name: z.string() }),
  participants: z.number().int().default(0),
  pending: z.number().int().default(0),
  approved: z.number().int().default(0),
  rejected: z.number().int().default(0),
  cancelled: z.number().int().default(0),
});

export type PastEventSummary = z.infer<typeof pastEventSummarySchema>;

export const pastEventPageSchema = z.object({
  items: z.array(pastEventSummarySchema),
  page: z.number().int().default(1),
  pageSize: z.number().int().default(25),
  total: z.number().int().default(0),
  waiting: z.number().int().default(0),
});

export type PastEventPage = z.infer<typeof pastEventPageSchema>;

export const pastEventSchema = pastEventSummarySchema.extend({
  requests: z.array(pastEventRequestSchema),
});

export type PastEvent = z.infer<typeof pastEventSchema>;
