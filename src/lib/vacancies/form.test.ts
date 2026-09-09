import { describe, expect, it } from "vitest";

import { fieldErrorsOf } from "@/lib/auth/credentials";
import {
  toDateTimeLocal,
  toVacancyPayload,
  vacancyFormSchema,
  vacancyFromFormData,
} from "@/lib/vacancies/form";

const valid = {
  title: "Winter book drive",
  slug: "winter-book-drive",
  summary: "Collect and sort books.",
  description: "A longer description of the work.",
  organizationId: "org-1",
  region: "tashkent-city",
  format: "onsite",
  startsAt: "2026-10-01T09:00",
  applicationDeadline: "2026-09-20T18:00",
};

describe("vacancyFormSchema", () => {
  it("accepts the minimum a vacancy needs", () => {
    expect(vacancyFormSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a slug the backend will accept", () => {
    const result = vacancyFormSchema.safeParse({ ...valid, slug: "Winter Books!" });
    expect(fieldErrorsOf(result.error!).slug).toEqual(["slug"]);
  });

  it("refuses a deadline after the vacancy starts", () => {
    const result = vacancyFormSchema.safeParse({
      ...valid,
      applicationDeadline: "2026-10-02T18:00",
    });
    expect(fieldErrorsOf(result.error!).applicationDeadline).toEqual([
      "deadlineAfterStart",
    ]);
  });

  it("refuses an end before the start", () => {
    const result = vacancyFormSchema.safeParse({
      ...valid,
      endsAt: "2026-09-30T09:00",
    });
    expect(fieldErrorsOf(result.error!).endsAt).toEqual(["endBeforeStart"]);
  });

  it("refuses a capacity that is not a whole number of people", () => {
    expect(
      fieldErrorsOf(vacancyFormSchema.safeParse({ ...valid, capacity: "0" }).error!)
        .capacity,
    ).toEqual(["capacity"]);
    expect(
      fieldErrorsOf(vacancyFormSchema.safeParse({ ...valid, capacity: "2.5" }).error!)
        .capacity,
    ).toEqual(["capacity"]);
  });

  it("names an unparseable date rather than sending it on", () => {
    expect(
      fieldErrorsOf(vacancyFormSchema.safeParse({ ...valid, startsAt: "soon" }).error!)
        .startsAt,
    ).toEqual(["date"]);
  });
});

describe("toVacancyPayload", () => {
  const parsed = vacancyFormSchema.parse({
    ...valid,
    capacity: "20",
    requirements: "Be 15 or older\n\n  Free on the day  ",
  });

  it("sends ISO timestamps, not the browser's local format", () => {
    const payload = toVacancyPayload(parsed);
    expect(payload.startsAt).toMatch(/T.*Z$/);
    expect(payload.applicationDeadline).toMatch(/T.*Z$/);
  });

  it("splits requirements into lines and drops the blank ones", () => {
    expect(toVacancyPayload(parsed).requirements).toEqual([
      "Be 15 or older",
      "Free on the day",
    ]);
  });

  it("omits every optional field left empty rather than sending nulls", () => {
    const payload = toVacancyPayload(vacancyFormSchema.parse(valid));
    expect(payload).not.toHaveProperty("city");
    expect(payload).not.toHaveProperty("endsAt");
    expect(payload).not.toHaveProperty("capacity");
  });
});

describe("vacancyFromFormData", () => {
  it("reads only known fields and skips the empty ones", () => {
    const formData = new FormData();
    formData.append("title", "Winter book drive");
    formData.append("city", "   ");
    formData.append("createdById", "someone-else");

    expect(vacancyFromFormData(formData)).toEqual({ title: "Winter book drive" });
  });
});

describe("toDateTimeLocal", () => {
  it("is empty for a missing or unparseable value", () => {
    expect(toDateTimeLocal(undefined)).toBe("");
    expect(toDateTimeLocal("not a date")).toBe("");
  });

  it("produces a value a datetime-local input accepts", () => {
    expect(toDateTimeLocal("2026-10-01T09:05:00.000Z")).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    );
  });
});
