import { z } from "zod";

import { optional } from "@/lib/api/schemas";
import {
  ATTENDANCE_OUTCOMES,
  PLACEMENTS,
  SHEET_STATUSES,
  VACANCY_KINDS,
} from "@/lib/domain/vocabulary";

const isoDate = z.string().min(1);
const hours = z.number().nullable();

export const xpRulesSchema = z.object({
  xpPerHour: z.number().int(),
  xpWinner: z.number().int(),
  xpContributor: z.number().int(),
  xpAttendee: z.number().int(),
  xpNoShowPenalty: z.number().int(),
});

export type XpRules = z.infer<typeof xpRulesSchema>;

export const sheetValuesSchema = z.object({
  outcome: z.enum(ATTENDANCE_OUTCOMES),
  hours,
  placement: z.enum(PLACEMENTS).nullable(),
  note: z.string().nullable(),
});

export type SheetValues = z.infer<typeof sheetValuesSchema>;

export const sheetRowSchema = z.object({
  applicationId: z.string(),
  attendanceId: z.string(),
  submittedAt: z.string().nullable(),
  volunteer: z.object({
    id: z.string(),
    displayName: z.string().nullable(),
    username: z.string(),
    avatarUrl: z.string().nullable(),
  }),
  verified: sheetValuesSchema.extend({
    xpAwarded: z.number().int(),
    resolvedAt: z.string().nullable(),
  }),
  draft: sheetValuesSchema.nullable(),
  reviewNote: z.string().nullable(),
});

export type SheetRow = z.infer<typeof sheetRowSchema>;

export const sheetEventSchema = z.object({
  id: z.string(),
  action: z.string(),
  note: z.string().nullable(),
  revision: z.number().int(),
  createdAt: isoDate,
  actor: z.object({ id: z.string(), name: z.string() }).nullable(),
});

export type SheetEvent = z.infer<typeof sheetEventSchema>;

export const attendanceSheetSchema = z.object({
  opportunityId: z.string(),
  title: z.string(),
  kind: z.enum(VACANCY_KINDS),
  organization: optional(z.object({ id: z.string(), name: z.string() })),
  estimatedTotalHours: z.number().nullable(),
  rules: xpRulesSchema,
  status: z.enum(SHEET_STATUSES),
  correction: z.boolean(),
  revision: z.number().int(),
  submittedAt: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  reviewNote: z.string().nullable(),
  verifiedAt: z.string().nullable(),
  opensAt: isoDate,
  submittableAt: isoDate,
  started: z.boolean(),
  ended: z.boolean(),
  requiresVerification: z.boolean(),
  editable: z.boolean(),
  rows: z.array(sheetRowSchema),
  history: z.array(sheetEventSchema),
});

export type AttendanceSheet = z.infer<typeof attendanceSheetSchema>;

export const instructionsSchema = z.object({
  message: z.string().nullable(),
  groupLink: z.string().nullable(),
  version: z.number().int(),
  sentAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  recipients: z.number().int(),
  unsent: z.number().int(),
  delivery: z.object({
    sent: z.number().int(),
    notConnected: z.number().int(),
    failed: z.number().int(),
    pending: z.number().int(),
  }),
});

export type Instructions = z.infer<typeof instructionsSchema>;

export const sentDecisionsSchema = z.object({
  accepted: z.number().int(),
  rejected: z.number().int(),
  held: z.number().int(),
  placesFilled: z.number().int(),
  capacity: z.number().int().nullable(),
});

export type SentDecisions = z.infer<typeof sentDecisionsSchema>;

export const TELEGRAM_GROUP_LINK =
  /^https:\/\/(t\.me|telegram\.me)\/(\+|joinchat\/)?[A-Za-z0-9_-]{4,64}\/?$/;

export const INSTRUCTIONS_LIMIT = 1000;

export const verificationQueueSchema = z.object({
  items: z.array(
    z.object({
      opportunityId: z.string(),
      title: z.string(),
      kind: z.enum(VACANCY_KINDS),
      organization: optional(z.object({ id: z.string(), name: z.string() })),
      startsAt: isoDate,
      endsAt: z.string().nullable(),
      volunteers: z.number().int(),
      correction: z.boolean(),
      revision: z.number().int(),
      submittedAt: z.string().nullable(),
    }),
  ),
  total: z.number().int(),
});

export type VerificationQueue = z.infer<typeof verificationQueueSchema>;
