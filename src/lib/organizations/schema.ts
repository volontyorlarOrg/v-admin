import { z } from "zod";

import { SLUG_PATTERN } from "@/lib/vacancies/form";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "required").max(160, "tooLong"),
  slug: z
    .string()
    .trim()
    .min(2, "required")
    .max(160, "tooLong")
    .regex(SLUG_PATTERN, "slug"),
  logoUrl: z.union([z.literal(""), z.url("url")]).optional(),
  verified: z.boolean().default(false),
});

export const updateOrganizationSchema = createOrganizationSchema.omit({ slug: true });
