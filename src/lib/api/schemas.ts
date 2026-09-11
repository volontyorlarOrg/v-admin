import { z } from "zod";

import {
  APPLICATION_STATUSES,
  ATTENDANCE_OUTCOMES,
  COORDINATOR_STATUSES,
  OPPORTUNITY_APPROVAL_STATUSES,
  QUESTION_TYPES,
  REGIONS,
  VACANCY_FORMATS,
  VACANCY_STATUSES,
} from "@/lib/domain/vocabulary";

export function optional<T extends z.ZodTypeAny>(schema: T) {
  return schema
    .nullish()
    .transform((value) => value ?? undefined)
    .optional();
}

const isoDate = z.string().min(1);
const id = z.string().min(1);

const decimal = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((value) => {
    if (value === null || value === undefined || value === "") return undefined;
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  })
  .optional();

export const organizationSchema = z.object({
  id,
  name: z.string(),
  slug: z.string().default(""),
  logoUrl: optional(z.string()),
  verified: z.boolean().default(false),
});

export type Organization = z.infer<typeof organizationSchema>;

export const organizationListSchema = z
  .union([
    z.array(organizationSchema),
    z.object({ items: z.array(organizationSchema) }),
  ])
  .transform((value) => (Array.isArray(value) ? value : value.items));

const questionOptionSchema = z
  .object({ value: z.string(), label: z.string().optional() })
  .transform((option) => ({
    value: option.value,
    label: option.label ?? option.value,
  }));

export const vacancyQuestionSchema = z.object({
  id,
  prompt: z.string(),
  helpText: optional(z.string()),
  type: z.enum(QUESTION_TYPES),
  required: z.boolean().default(true),
  maxLength: optional(z.number().int()),
  options: optional(z.array(questionOptionSchema)),
  position: z.number().int().default(0),
});

export const approvalReviewerSchema = z.object({
  id,
  displayName: optional(z.string()),
});

export const vacancySchema = z.object({
  id,
  slug: z.string(),
  title: z.string(),
  summary: z.string().default(""),
  description: z.string().default(""),
  requirements: z.array(z.string()).default([]),
  region: z.enum(REGIONS),
  city: optional(z.string()),
  format: z.enum(VACANCY_FORMATS),
  status: z.enum(VACANCY_STATUSES),
  startsAt: isoDate,
  endsAt: optional(isoDate),
  applicationDeadline: isoDate,
  locationName: optional(z.string()),
  imageUrl: optional(z.string()),
  capacity: optional(z.number().int()),
  estimatedTotalHours: decimal,
  approvalStatus: optional(z.enum(OPPORTUNITY_APPROVAL_STATUSES)),
  approvalSubmittedAt: optional(isoDate),
  approvalReviewedAt: optional(isoDate),
  approvalNote: optional(z.string()),
  approvalReviewedById: optional(id),
  approvalReviewedBy: optional(approvalReviewerSchema),
  publishedAt: optional(isoDate),
  archivedAt: optional(isoDate),
  createdAt: isoDate,
  updatedAt: isoDate,
  organizationId: id,
  createdById: optional(id),
  organization: optional(organizationSchema),
  questions: z.array(vacancyQuestionSchema).default([]),
});

export type Vacancy = z.infer<typeof vacancySchema>;

export const vacancyListSchema = z
  .union([z.array(vacancySchema), z.object({ items: z.array(vacancySchema) })])
  .transform((value) => (Array.isArray(value) ? value : value.items));

export const attendanceSchema = z.object({
  id,
  outcome: z.enum(ATTENDANCE_OUTCOMES),
  scheduledHours: decimal,
  confirmedHours: decimal,
  resolvedAt: optional(isoDate),
  applicationId: optional(id),
  volunteerId: optional(id),
  opportunityId: optional(id),
});

export type Attendance = z.infer<typeof attendanceSchema>;

export const applicationOpportunitySchema = z.object({
  id,
  slug: z.string(),
  title: z.string(),
  format: optional(z.enum(VACANCY_FORMATS)),
  region: optional(z.enum(REGIONS)),
  city: optional(z.string()),
  locationName: optional(z.string()),
  startsAt: optional(isoDate),
  endsAt: optional(isoDate),
  applicationDeadline: optional(isoDate),
  capacity: optional(z.number().int()),
  estimatedTotalHours: decimal,
});

export type ApplicationOpportunity = z.infer<typeof applicationOpportunitySchema>;

export const applicationAnswerSchema = z.object({
  id: optional(id),
  questionPrompt: z.string().default(""),
  questionType: optional(z.enum(QUESTION_TYPES)),
  applicationQuestionId: optional(id),
  value: z.unknown().transform((value): string | string[] => {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      return value as string[];
    }
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return "";
  }),
});

export const profileSnapshotSchema = z.object({
  fullName: optional(z.string()),
  bio: optional(z.string()),
  region: optional(z.string()),
  school: optional(z.string()),
  languages: optional(z.array(z.string())),
  phone: optional(z.string()),
  telegram: optional(z.string()),
});

export type ProfileSnapshot = z.infer<typeof profileSnapshotSchema>;

export const applicationSchema = z.object({
  id,
  status: z.enum(APPLICATION_STATUSES),
  reviewerNote: optional(z.string()),
  profileSnapshot: optional(profileSnapshotSchema),
  submittedAt: optional(isoDate),
  reviewedAt: optional(isoDate),
  withdrawnAt: optional(isoDate),
  createdAt: isoDate,
  updatedAt: isoDate,
  volunteerId: id,
  opportunityId: id,
  volunteer: optional(
    z.object({
      id,
      displayName: optional(z.string()),
      profile: optional(profileSnapshotSchema.loose()),
    }),
  ),
  opportunity: optional(applicationOpportunitySchema),
  answers: z.array(applicationAnswerSchema).default([]),
  attendance: optional(attendanceSchema),
});

export type Application = z.infer<typeof applicationSchema>;

export const applicationListSchema = z
  .union([z.array(applicationSchema), z.object({ items: z.array(applicationSchema) })])
  .transform((value) => (Array.isArray(value) ? value : value.items));

export const passwordStateSchema = z.object({
  passwordChangedAt: optional(isoDate),
  requiresPasswordChange: z.boolean().default(false),
});

export type PasswordState = z.infer<typeof passwordStateSchema>;

export const directoryUserSchema = z.object({
  id,
  displayName: optional(z.string()),
  email: optional(z.string()),
  isActive: z.boolean().default(true),
  createdAt: isoDate,
  passwordCredential: optional(passwordStateSchema),
  _count: optional(
    z.object({
      applications: z.number().int().default(0),
      attendanceRecords: z.number().int().default(0),
    }),
  ),
});

export type DirectoryUser = z.infer<typeof directoryUserSchema>;

export const userDetailSchema = z.object({
  id,
  displayName: optional(z.string()),
  email: optional(z.string()),
  emailVerifiedAt: optional(isoDate),
  isActive: z.boolean().default(true),
  createdAt: isoDate,
  profile: optional(profileSnapshotSchema.loose()),
  passwordCredential: optional(passwordStateSchema),
  applications: z.array(applicationSchema).default([]),
});

export type UserDetail = z.infer<typeof userDetailSchema>;

export function pageSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int().default(1),
    pageSize: z.number().int().default(25),
    total: z.number().int().default(0),
  });
}

export const auditEventSchema = z.object({
  id,
  action: z.string(),
  entityType: z.string().default(""),
  entityId: z.string().default(""),
  metadata: optional(z.unknown()),
  actorUserId: optional(id),
  createdAt: isoDate,
});

export type AuditEvent = z.infer<typeof auditEventSchema>;

export const auditListSchema = z
  .union([z.array(auditEventSchema), z.object({ items: z.array(auditEventSchema) })])
  .transform((value) => (Array.isArray(value) ? value : value.items));

export const statisticsSchema = z.object({
  scope: z.enum(["own", "global"]).default("own"),
  range: z.object({ from: isoDate, to: isoDate }),
  totals: z.object({
    vacancies: z.number().int().default(0),
    publishedVacancies: z.number().int().default(0),
    applications: z.number().int().default(0),
    pendingReview: z.number().int().default(0),
    accepted: z.number().int().default(0),
    awaitingAttendance: z.number().int().default(0),
    attended: z.number().int().default(0),
    confirmedHours: z.number().default(0),
    volunteers: optional(z.number().int()),
    coordinators: optional(
      z.object({
        active: z.number().int().default(0),
        blocked: z.number().int().default(0),
        removed: z.number().int().default(0),
      }),
    ),
  }),
});

export type Statistics = z.infer<typeof statisticsSchema>;

export const coordinatorAccountSchema = z.object({
  userId: id,
  status: z.enum(COORDINATOR_STATUSES),
  blockedAt: optional(isoDate),
  removedAt: optional(isoDate),
  createdAt: optional(isoDate),
});

export const coordinatorSchema = z.object({
  id,
  displayName: optional(z.string()),
  email: optional(z.string()),
  isActive: z.boolean().default(true),
  createdAt: isoDate,
  coordinatorAccount: optional(coordinatorAccountSchema),
  passwordCredential: optional(passwordStateSchema),
  _count: optional(
    z.object({
      createdOpportunities: z.number().int().default(0),
      auditLogs: z.number().int().default(0),
    }),
  ),
});

export type Coordinator = z.infer<typeof coordinatorSchema>;

export const coordinatorDetailSchema = coordinatorSchema.extend({
  createdOpportunities: z
    .array(
      z.object({
        id,
        slug: z.string(),
        title: z.string(),
        status: z.enum(VACANCY_STATUSES),
        approvalStatus: optional(z.enum(OPPORTUNITY_APPROVAL_STATUSES)),
        publishedAt: optional(isoDate),
        archivedAt: optional(isoDate),
        createdAt: isoDate,
      }),
    )
    .default([]),
  auditLogs: z.array(auditEventSchema).default([]),
});

export type CoordinatorDetail = z.infer<typeof coordinatorDetailSchema>;

export const passwordReplacementSchema = z.object({
  id,
  passwordChangedAt: isoDate,
  requiresPasswordChange: z.boolean().default(true),
});

export const currentUserSchema = z.object({
  id,
  displayName: optional(z.string()),
  email: optional(z.string()),
  roles: z.array(z.string()).default([]),
  passwordCredential: optional(passwordStateSchema),
});

export const coordinatorStatusChangeSchema = z.object({
  id,
  status: z.enum(COORDINATOR_STATUSES),
  isActive: z.boolean().default(false),
});
