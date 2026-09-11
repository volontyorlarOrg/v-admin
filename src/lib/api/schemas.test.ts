import { describe, expect, it } from "vitest";

import {
  apiRegion,
  applicationSchema,
  attendanceSchema,
  auditEventSchema,
  coordinatorSchema,
  directoryUserSchema,
  organizationListSchema,
  pageSchema,
  statisticsSchema,
  vacancyListSchema,
  vacancySchema,
} from "@/lib/api/schemas";

const vacancy = {
  id: "vac-1",
  slug: "winter-book-drive",
  title: "Winter book drive",
  summary: "Sort books",
  description: "Long description",
  requirements: ["Be 15 or older"],
  region: "tashkent-city",
  format: "onsite",
  status: "open",
  startsAt: "2026-10-01T09:00:00.000Z",
  applicationDeadline: "2026-09-20T18:00:00.000Z",
  createdAt: "2026-09-01T09:00:00.000Z",
  updatedAt: "2026-09-01T09:00:00.000Z",
  organizationId: "org-1",
};

describe("vacancySchema", () => {
  it("accepts the minimum a vacancy record carries", () => {
    const parsed = vacancySchema.parse(vacancy);

    expect(parsed.questions).toEqual([]);
    expect(parsed.publishedAt).toBeUndefined();
    expect(parsed.city).toBeUndefined();
  });

  it("turns every null the database sends into an absent value", () => {
    const parsed = vacancySchema.parse({
      ...vacancy,
      city: null,
      endsAt: null,
      capacity: null,
      publishedAt: null,
      organization: null,
    });

    expect(parsed.city).toBeUndefined();
    expect(parsed.capacity).toBeUndefined();
    expect(parsed.organization).toBeUndefined();
  });

  it("rejects a region the product does not define rather than rendering it", () => {
    expect(vacancySchema.safeParse({ ...vacancy, region: "atlantis" }).success).toBe(
      false,
    );
  });

  it("rejects a record with no identifier", () => {
    expect(vacancySchema.safeParse({ ...vacancy, id: "" }).success).toBe(false);
  });

  it("orders nothing by itself: position survives for the caller to sort on", () => {
    const parsed = vacancySchema.parse({
      ...vacancy,
      questions: [
        {
          id: "q1",
          prompt: "Why?",
          type: "long_text",
          position: 2,
          options: null,
        },
      ],
    });

    expect(parsed.questions[0]).toMatchObject({ position: 2, required: true });
  });
});

describe("vacancyListSchema", () => {
  it("reads both a bare array and a paged envelope", () => {
    expect(vacancyListSchema.parse([vacancy])).toHaveLength(1);
    expect(vacancyListSchema.parse({ items: [vacancy] })).toHaveLength(1);
  });
});

describe("attendanceSchema", () => {
  it("reads decimal hours whether they arrive as a string or a number", () => {
    const base = {
      id: "att-1",
      outcome: "attended",
      applicationId: "app-1",
      volunteerId: "vol-1",
      opportunityId: "vac-1",
    };

    expect(
      attendanceSchema.parse({ ...base, confirmedHours: "4.50" }).confirmedHours,
    ).toBe(4.5);
    expect(
      attendanceSchema.parse({ ...base, confirmedHours: 4.5 }).confirmedHours,
    ).toBe(4.5);
    expect(
      attendanceSchema.parse({ ...base, confirmedHours: null }).confirmedHours,
    ).toBeUndefined();
  });
});

describe("applicationSchema", () => {
  const application = {
    id: "app-1",
    status: "submitted",
    createdAt: "2026-09-01T09:00:00.000Z",
    updatedAt: "2026-09-01T09:00:00.000Z",
    volunteerId: "vol-1",
    opportunityId: "vac-1",
  };

  it("defaults the answer list rather than leaving it undefined", () => {
    expect(applicationSchema.parse(application).answers).toEqual([]);
  });

  it("normalises an answer value to a string or a list of strings", () => {
    const parsed = applicationSchema.parse({
      ...application,
      answers: [
        { questionPrompt: "Why?", value: "Because" },
        { questionPrompt: "Which?", value: ["a", "b"] },
        { questionPrompt: "How many?", value: 3 },
        { questionPrompt: "Odd", value: { nested: true } },
      ],
    });

    expect(parsed.answers.map((answer) => answer.value)).toEqual([
      "Because",
      ["a", "b"],
      "3",
      "",
    ]);
  });

  it("rejects a status the product does not define", () => {
    expect(
      applicationSchema.safeParse({ ...application, status: "escalated" }).success,
    ).toBe(false);
  });
});

describe("directoryUserSchema", () => {
  it("keeps the password state without ever carrying a password", () => {
    const parsed = directoryUserSchema.parse({
      id: "vol-1",
      createdAt: "2026-09-01T09:00:00.000Z",
      passwordCredential: {
        passwordChangedAt: "2026-09-02T09:00:00.000Z",
        requiresPasswordChange: true,
      },
    });

    expect(parsed.passwordCredential).toEqual({
      passwordChangedAt: "2026-09-02T09:00:00.000Z",
      requiresPasswordChange: true,
    });
    expect(JSON.stringify(parsed)).not.toMatch(/passwordHash|"password"/);
  });

  it("reports no password login when the account has no credential", () => {
    const parsed = directoryUserSchema.parse({
      id: "vol-1",
      createdAt: "2026-09-01T09:00:00.000Z",
      passwordCredential: null,
    });

    expect(parsed.passwordCredential).toBeUndefined();
  });
});

describe("coordinatorSchema", () => {
  it("reads the coordinator account state", () => {
    const parsed = coordinatorSchema.parse({
      id: "co-1",
      displayName: "Nodira",
      email: "nodira@example.org",
      createdAt: "2026-09-01T09:00:00.000Z",
      coordinatorAccount: {
        userId: "co-1",
        status: "blocked",
        blockedAt: "2026-09-05T09:00:00.000Z",
        removedAt: null,
      },
    });

    expect(parsed.coordinatorAccount).toMatchObject({
      status: "blocked",
      removedAt: undefined,
    });
  });
});

describe("statisticsSchema", () => {
  it("keeps a coordinator's own scope without administrator-only totals", () => {
    const parsed = statisticsSchema.parse({
      scope: "own",
      range: { from: "2026-08-01T00:00:00.000Z", to: "2026-09-01T00:00:00.000Z" },
      totals: {
        vacancies: 4,
        publishedVacancies: 2,
        applications: 12,
        pendingReview: 3,
        accepted: 5,
        awaitingAttendance: 1,
        attended: 4,
        confirmedHours: 18,
      },
    });

    expect(parsed.totals.coordinators).toBeUndefined();
    expect(parsed.totals.volunteers).toBeUndefined();
  });
});

describe("pageSchema", () => {
  it("keeps the paging envelope the directory endpoints send", () => {
    const parsed = pageSchema(auditEventSchema).parse({
      items: [
        {
          id: "log-1",
          action: "coordinator.created",
          entityType: "User",
          entityId: "co-1",
          createdAt: "2026-09-01T09:00:00.000Z",
        },
      ],
      page: 2,
      pageSize: 25,
      total: 40,
    });

    expect(parsed).toMatchObject({ page: 2, total: 40 });
  });
});

describe("organizationListSchema", () => {
  it("reads both shapes the organizations endpoint may send", () => {
    const organization = { id: "org-1", name: "Reading Corners", slug: "reading" };

    expect(organizationListSchema.parse([organization])).toHaveLength(1);
    expect(organizationListSchema.parse({ items: [organization] })).toHaveLength(1);
  });
});

describe("apiRegion", () => {
  it("reads the region the contract publishes", () => {
    expect(apiRegion.parse("tashkent-city")).toBe("tashkent-city");
  });

  it("reads the database spelling a management route may still send, so a Tashkent vacancy is not lost to an unreleased fix", () => {
    expect(apiRegion.parse("tashkent_city")).toBe("tashkent-city");
    expect(apiRegion.parse("tashkent_region")).toBe("tashkent-region");
  });

  it("refuses a region that is neither", () => {
    expect(() => apiRegion.parse("atlantis")).toThrow();
  });
});
