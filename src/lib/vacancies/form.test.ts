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
  description: "A longer description of the work.",
  organizationId: "org-1",
  region: "tashkent-city",
  format: "onsite",
  city: "Tashkent",
  locationName: "Chilonzor library",
  startsAt: "2026-10-01T09:00",
  endsAt: "2026-10-01T15:00",
  applicationDeadline: "2026-09-20T18:00",
  capacity: "20",
  estimatedTotalHours: "6",
  acceptanceMode: "manual",
};

describe("vacancyFormSchema", () => {
  it("accepts the logistics an approval will be judged on", () => {
    expect(vacancyFormSchema.safeParse(valid).success).toBe(true);
  });

  it("requires an end, because attendance opens when the event ends", () => {
    expect(
      fieldErrorsOf(vacancyFormSchema.safeParse({ ...valid, endsAt: "" }).error!)
        .endsAt,
    ).toEqual(["required"]);
  });

  it("requires a positive whole-event estimate of hours", () => {
    expect(
      fieldErrorsOf(
        vacancyFormSchema.safeParse({ ...valid, estimatedTotalHours: "0" }).error!,
      ).estimatedTotalHours,
    ).toEqual(["estimatedHours"]);
    expect(
      fieldErrorsOf(
        vacancyFormSchema.safeParse({ ...valid, estimatedTotalHours: "" }).error!,
      ).estimatedTotalHours,
    ).toEqual(["required"]);
  });

  it("requires a city and a venue when volunteers turn up somewhere", () => {
    const errors = fieldErrorsOf(
      vacancyFormSchema.safeParse({ ...valid, city: "", locationName: "" }).error!,
    );
    expect(errors.city).toEqual(["cityRequired"]);
    expect(errors.locationName).toEqual(["venueRequired"]);
  });

  it("requires a public online location when the work is remote", () => {
    expect(
      fieldErrorsOf(
        vacancyFormSchema.safeParse({
          ...valid,
          format: "remote",
          city: "",
          locationName: "",
        }).error!,
      ).locationName,
    ).toEqual(["onlineLocationRequired"]);
  });

  it("refuses meeting credentials in a field every volunteer can read", () => {
    expect(
      fieldErrorsOf(
        vacancyFormSchema.safeParse({
          ...valid,
          format: "remote",
          city: "",
          locationName: "Zoom, passcode 4821",
        }).error!,
      ).locationName,
    ).toEqual(["onlineLocationCredentials"]);
  });

  it("requires a slug the backend will accept", () => {
    const result = vacancyFormSchema.safeParse({ ...valid, slug: "Winter Books!" });
    expect(fieldErrorsOf(result.error!).slug).toEqual(["slug"]);
  });

  it.each(["2026-10-01T09:00", "2026-10-02T18:00"])(
    "refuses a deadline at or after the vacancy starts (%s)",
    (applicationDeadline) => {
      const result = vacancyFormSchema.safeParse({
        ...valid,
        applicationDeadline,
      });
      expect(fieldErrorsOf(result.error!).applicationDeadline).toEqual([
        "deadlineAfterStart",
      ]);
    },
  );

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

  it("needs no short description, which the portal no longer collects", () => {
    expect(vacancyFormSchema.safeParse({ ...valid, summary: "" }).success).toBe(true);
  });

  it("only accepts the two ways a vacancy can accept applications", () => {
    expect(
      vacancyFormSchema.safeParse({ ...valid, acceptanceMode: "automatic" }).success,
    ).toBe(true);
    expect(
      fieldErrorsOf(
        vacancyFormSchema.safeParse({ ...valid, acceptanceMode: "instantly" }).error!,
      ).acceptanceMode,
    ).toEqual(["required"]);
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

  it("sends how applications are accepted and no summary", () => {
    const payload = toVacancyPayload(
      vacancyFormSchema.parse({ ...valid, acceptanceMode: "automatic" }),
    );
    expect(payload.acceptanceMode).toBe("automatic");
    expect(payload).not.toHaveProperty("summary");
  });

  it("sends the hours and places as numbers, not the form's strings", () => {
    const payload = toVacancyPayload(parsed);
    expect(payload.capacity).toBe(20);
    expect(payload.estimatedTotalHours).toBe(6);
  });

  it("omits an optional field left empty rather than sending a null", () => {
    const payload = toVacancyPayload(
      vacancyFormSchema.parse({ ...valid, format: "remote", city: "" }),
    );
    expect(payload).not.toHaveProperty("city");
    expect(payload).not.toHaveProperty("requirements");
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

describe("a form that arrives with fields missing", () => {
  it("names every empty field in the portal's own words, not the parser's", () => {
    const parsed = vacancyFormSchema.safeParse({});

    expect(parsed.success).toBe(false);
    const codes = new Set(
      parsed.success ? [] : parsed.error.issues.map((issue) => issue.message),
    );

    expect(codes).toContain("required");
    expect([...codes].every((code) => !code.includes("expected string"))).toBe(true);
  });
});
