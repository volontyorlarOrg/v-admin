import { z } from "zod";

const decimalHours = z
  .string()
  .trim()
  .regex(/^(?:0|[1-9]\d{0,2})(?:\.\d{1,2})?$/, "hoursAmount")
  .transform(Number);

const awardedXp = z
  .string()
  .trim()
  .regex(/^\d{1,6}$/, "xpAmount")
  .transform(Number)
  .pipe(z.number().int().min(0, "xpAmount").max(100_000, "xpAmount"));

export const pastEventSchema = z.object({
  title: z.string().trim().min(1, "required").max(160, "tooLong"),
  organizationId: z.uuid("organizationNotFound"),
  eventDate: z.iso.date("pastEventDateInvalid"),
  hours: decimalHours,
  xpAwarded: awardedXp,
  countsTowardProgress: z.boolean(),
});

export type PastEventInput = z.infer<typeof pastEventSchema>;
