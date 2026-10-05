import { z } from "zod";
import { pageSchema } from "@/lib/api/schemas";

export const MAX_AWARD_XP = 100_000;
export const MAX_AWARD_HOURS = 999;
export const MAX_AWARD_SELECTION = 10_000;
export const AWARD_REASON_MAX_LENGTH = 500;

const actorSchema = z.object({ id: z.uuid(), displayName: z.string().nullable() });

export const bulkAwardSchema = z.object({
  id: z.uuid(),
  scope: z.enum(["selected", "all"]),
  xp: z.number().int().nonnegative(),
  hours: z.number().nonnegative(),
  reason: z.string(),
  recipients: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  createdAt: z.string(),
  createdBy: actorSchema.nullable(),
  revokedAt: z.string().nullable(),
  revokedBy: actorSchema.nullable(),
});
export type BulkAward = z.infer<typeof bulkAwardSchema>;
export const bulkAwardPageSchema = pageSchema(bulkAwardSchema);

export const awardVolunteerSchema = z.object({
  id: z.uuid(),
  displayName: z.string().nullable(),
  username: z.string(),
  email: z.string().nullable(),
  xp: z.number().int(),
});
export type AwardVolunteer = z.infer<typeof awardVolunteerSchema>;
export const awardVolunteersSchema = pageSchema(awardVolunteerSchema).extend({
  eligibleTotal: z.number().int().nonnegative(),
});
export type AwardVolunteers = z.infer<typeof awardVolunteersSchema>;

export const eligibleIdsSchema = z.object({
  ids: z.array(z.uuid()),
  total: z.number().int().nonnegative(),
  truncated: z.boolean(),
});

export const awardRecipientSchema = z.object({
  id: z.uuid(),
  displayName: z.string().nullable(),
  username: z.string(),
});
export const awardRecipientsSchema = pageSchema(awardRecipientSchema);

const amount = (max: number, step: number) =>
  z
    .string()
    .trim()
    .transform((value) => (value === "" ? 0 : Number(value)))
    .pipe(
      z
        .number({ error: "amountInvalid" })
        .min(0, "amountInvalid")
        .max(max, "amountTooLarge")
        .refine(
          (value) => Math.abs(value / step - Math.round(value / step)) < 1e-9,
          "amountInvalid",
        ),
    );

export const awardAmountsSchema = z
  .object({
    xp: amount(MAX_AWARD_XP, 1),
    hours: amount(MAX_AWARD_HOURS, 0.01),
    reason: z
      .string()
      .trim()
      .min(1, "reasonRequired")
      .max(AWARD_REASON_MAX_LENGTH, "reasonTooLong"),
  })
  .superRefine((input, context) => {
    if (!input.xp && !input.hours)
      context.addIssue({ code: "custom", path: ["xp"], message: "adjustmentEmpty" });
  });

export const bulkAwardInputSchema = z
  .object({
    submissionId: z.uuid(),
    scope: z.enum(["selected", "all"]),
    userIds: z.array(z.uuid()).max(MAX_AWARD_SELECTION),
  })
  .and(awardAmountsSchema)
  .superRefine((input, context) => {
    const unique = new Set(input.userIds).size === input.userIds.length;
    if (
      input.scope === "selected"
        ? !input.userIds.length || !unique
        : input.userIds.length
    )
      context.addIssue({
        code: "custom",
        path: ["userIds"],
        message: "bulkAwardSelectionInvalid",
      });
  });

export type AwardAmountErrors = Partial<Record<"xp" | "hours" | "reason", string>>;

export function amountErrors(values: {
  xp: string;
  hours: string;
  reason: string;
}): AwardAmountErrors {
  const parsed = awardAmountsSchema.safeParse(values);
  if (parsed.success) return {};
  const errors: AwardAmountErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if ((field === "xp" || field === "hours" || field === "reason") && !errors[field])
      errors[field] = issue.message;
  }
  return errors;
}
