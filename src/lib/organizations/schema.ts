import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "required").max(160, "tooLong"),
  slug: z
    .string()
    .trim()
    .min(1, "required")
    .max(160, "tooLong")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug"),
  password: z.string().min(8, "passwordShort").max(128, "passwordLong"),
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2, "required").max(160, "tooLong"),
  logoUrl: z.union([z.literal(""), z.url("url")]).optional(),
  verified: z.boolean().default(false),
});
