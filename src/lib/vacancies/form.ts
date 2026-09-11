import { z } from "zod";

import { REGIONS, VACANCY_FORMATS } from "@/lib/domain/vocabulary";
import { hasMeetingCredentials, requiresVenue } from "@/lib/vacancies/approval";

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_ESTIMATED_TOTAL_HOURS = 100_000;

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
  "estimatedTotalHours",
  "requirements",
] as const;

const trimmed = z.string().trim();

function withEveryField(value: unknown) {
  const record = (value ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    VACANCY_FIELDS.map((field) => [
      field,
      typeof record[field] === "string" ? record[field] : "",
    ]),
  );
}

const vacancyShape = z
  .object({
    title: trimmed.min(2, "required").max(180, "tooLong"),
    slug: trimmed.min(2, "required").max(160, "tooLong").regex(SLUG_PATTERN, "slug"),
    summary: trimmed.min(2, "required").max(400, "tooLong"),
    description: trimmed.min(2, "required").max(10_000, "tooLong"),
    organizationId: trimmed.min(1, "required"),
    region: z.enum(REGIONS, { message: "required" }),
    format: z.enum(VACANCY_FORMATS, { message: "required" }),
    city: trimmed.max(100, "tooLong").optional(),
    locationName: trimmed.max(200, "tooLong").optional(),
    startsAt: trimmed.min(1, "required"),
    endsAt: trimmed.min(1, "required"),
    applicationDeadline: trimmed.min(1, "required"),
    capacity: trimmed.min(1, "required"),
    estimatedTotalHours: trimmed.min(1, "required"),
    requirements: trimmed.optional(),
  })
  .superRefine((values, context) => {
    const starts = Date.parse(values.startsAt);
    const deadline = Date.parse(values.applicationDeadline);
    const ends = Date.parse(values.endsAt);

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
    if (!Number.isNaN(starts) && !Number.isNaN(deadline) && deadline >= starts) {
      context.addIssue({
        code: "custom",
        path: ["applicationDeadline"],
        message: "deadlineAfterStart",
      });
    }
    if (values.endsAt && Number.isNaN(ends)) {
      context.addIssue({ code: "custom", path: ["endsAt"], message: "date" });
    } else if (values.endsAt && !Number.isNaN(starts) && ends <= starts) {
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "endBeforeStart",
      });
    }

    const capacity = Number(values.capacity);
    if (values.capacity && (!Number.isInteger(capacity) || capacity < 1)) {
      context.addIssue({ code: "custom", path: ["capacity"], message: "capacity" });
    }

    const hours = Number(values.estimatedTotalHours);
    if (
      values.estimatedTotalHours &&
      (!Number.isFinite(hours) || hours <= 0 || hours > MAX_ESTIMATED_TOTAL_HOURS)
    ) {
      context.addIssue({
        code: "custom",
        path: ["estimatedTotalHours"],
        message: "estimatedHours",
      });
    }

    if (requiresVenue(values.format)) {
      if (!values.city) {
        context.addIssue({ code: "custom", path: ["city"], message: "cityRequired" });
      }
      if (!values.locationName) {
        context.addIssue({
          code: "custom",
          path: ["locationName"],
          message: "venueRequired",
        });
      }
      return;
    }

    if (!values.locationName) {
      context.addIssue({
        code: "custom",
        path: ["locationName"],
        message: "onlineLocationRequired",
      });
      return;
    }

    if (hasMeetingCredentials(values.locationName)) {
      context.addIssue({
        code: "custom",
        path: ["locationName"],
        message: "onlineLocationCredentials",
      });
    }
  });

export const vacancyFormSchema = z.preprocess(withEveryField, vacancyShape);

export type VacancyFormValues = z.infer<typeof vacancyShape>;

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
    endsAt: new Date(values.endsAt).toISOString(),
    applicationDeadline: new Date(values.applicationDeadline).toISOString(),
    capacity: Number(values.capacity),
    estimatedTotalHours: Number(values.estimatedTotalHours),
    ...(values.city ? { city: values.city } : {}),
    ...(values.locationName ? { locationName: values.locationName } : {}),
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
