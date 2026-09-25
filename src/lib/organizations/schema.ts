import { z } from "zod";

import { SLUG_PATTERN } from "@/lib/vacancies/form";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "required").max(160, "tooLong"),
  slug: z
    .string()
    .trim()
    .max(160, "tooLong")
    .refine((value) => value === "" || SLUG_PATTERN.test(value), "slug"),
  logoUrl: z.union([z.literal(""), z.url("url")]).optional(),
  verified: z.boolean().default(false),
});

export const updateOrganizationSchema = createOrganizationSchema.omit({ slug: true });

export function organizationSlug(name: string, random: string): string {
  const readable = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return readable.length >= 2 ? readable : `organization-${random}`;
}
