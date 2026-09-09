import { z } from "zod";

import { REGIONS, VACANCY_FORMATS } from "@/lib/domain/vocabulary";

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const trimmed = z.string().trim();

export const vacancyFormSchema = z
  .object({
    title: trimmed.min(2, "required").max(160, "tooLong"),
    slug: trimmed.min(2, "required").max(160, "tooLong").regex(SLUG_PATTERN, "slug"),
    summary: trimmed.min(2, "required").max(400, "tooLong"),
    description: trimmed.min(2, "required").max(8000, "tooLong"),
    organizationId: trimmed.min(1, "required"),
    region: z.enum(REGIONS, { message: "required" }),
    format: z.enum(VACANCY_FORMATS, { message: "required" }),
    city: trimmed.max(120, "tooLong").optional(),
    locationName: trimmed.max(160, "tooLong").optional(),
    startsAt: trimmed.min(1, "required"),
    endsAt: trimmed.optional(),
    applicationDeadline: trimmed.min(1, "required"),
    capacity: trimmed.optional(),
    requirements: trimmed.optional(),
  })
  .superRefine((values, context) => {
    const starts = Date.parse(values.startsAt);
    const deadline = Date.parse(values.applicationDeadline);

    if (Number.isNaN(starts)) {
      context.addIssue({ code: "custom", path: ["startsAt"], message: "date" });
    }
    if (Number.isNaN(deadline)) {
      context.addIssue({
        code: "custom",
        path: ["applicationDeadline"],
        message: "date",
      });
    }
    if (!Number.isNaN(starts) && !Number.isNaN(deadline) && deadline > starts) {
      context.addIssue({
        code: "custom",
        path: ["applicationDeadline"],
        message: "deadlineAfterStart",
      });
    }
    if (values.endsAt) {
      const ends = Date.parse(values.endsAt);
      if (Number.isNaN(ends)) {
        context.addIssue({ code: "custom", path: ["endsAt"], message: "date" });
      } else if (!Number.isNaN(starts) && ends < starts) {
        context.addIssue({
          code: "custom",
          path: ["endsAt"],
          message: "endBeforeStart",
        });
      }
    }
    if (values.capacity) {
      const capacity = Number(values.capacity);
      if (!Number.isInteger(capacity) || capacity < 1) {
        context.addIssue({ code: "custom", path: ["capacity"], message: "capacity" });
      }
    }
  });

export type VacancyFormValues = z.infer<typeof vacancyFormSchema>;

export const VACANCY_FIELDS = [
  "title",
  "slug",
  "summary",
  "description",
  "organizationId",
  "region",
  "format",
  "city",
  "locationName",
  "startsAt",
  "endsAt",
  "applicationDeadline",
  "capacity",
  "requirements",
] as const;

export function vacancyFromFormData(formData: FormData): Record<string, string> {
  const output: Record<string, string> = {};

  for (const field of VACANCY_FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string" && value.trim() !== "") output[field] = value;
  }

  return output;
}

export function toVacancyPayload(values: VacancyFormValues) {
  return {
    title: values.title,
    slug: values.slug,
    summary: values.summary,
    description: values.description,
    organizationId: values.organizationId,
    region: values.region,
    format: values.format,
    startsAt: new Date(values.startsAt).toISOString(),
    applicationDeadline: new Date(values.applicationDeadline).toISOString(),
    ...(values.city ? { city: values.city } : {}),
    ...(values.locationName ? { locationName: values.locationName } : {}),
    ...(values.endsAt ? { endsAt: new Date(values.endsAt).toISOString() } : {}),
    ...(values.capacity ? { capacity: Number(values.capacity) } : {}),
    ...(values.requirements
      ? {
          requirements: values.requirements
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        }
      : {}),
  };
}

export function toDateTimeLocal(value: string | undefined): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}
