import { describe, expect, it } from "vitest";

import {
  applicationSchema,
  organizationSchema,
  vacancySchema,
  type Application,
  type Vacancy,
} from "@/lib/api/schemas";
import {
  applicationsToDecide,
  blockingOrganizations,
  clearedToday,
  isFresh,
  isSameTashkentDay,
  rollCallsDue,
  staffDesk,
  tashkentDay,
  vacanciesToApprove,
} from "@/lib/queue/today";

const NOW = new Date("2026-09-24T09:00:00.000Z");
const ME = "admin-1";

const verified = organizationSchema.parse({
  id: "org-1",
  name: "Reading Corners",
  verified: true,
});
const unverified = organizationSchema.parse({
  id: "org-2",
  name: "Green Corridor",
  verified: false,
});

function vacancy(overrides: Record<string, unknown> = {}): Vacancy {
  return vacancySchema.parse({
    id: "vacancy-1",
    slug: "library-day",
    title: "Library day",
    description: "Help at the library.",
    region: "tashkent-city",
    format: "onsite",
    status: "open",
    startsAt: "2026-10-10T05:00:00.000Z",
    applicationDeadline: "2026-10-05T05:00:00.000Z",
    createdAt: "2026-09-01T05:00:00.000Z",
    updatedAt: "2026-09-02T05:00:00.000Z",
    organizationId: "org-1",
    approvalStatus: "draft",
    ...overrides,
  });
}

function application(overrides: Record<string, unknown> = {}): Application {
  return applicationSchema.parse({
    id: "application-1",
    status: "submitted",
    submittedAt: "2026-09-20T05:00:00.000Z",
    createdAt: "2026-09-19T05:00:00.000Z",
    updatedAt: "2026-09-20T05:00:00.000Z",
    volunteerId: "volunteer-1",
    opportunityId: "vacancy-1",
    ...overrides,
  });
}

describe("the Tashkent day", () => {
  it("rolls over at Tashkent midnight, not UTC midnight", () => {
    expect(tashkentDay(new Date("2026-09-23T19:30:00.000Z"))).toBe("2026-09-24");
    expect(tashkentDay(new Date("2026-09-23T18:30:00.000Z"))).toBe("2026-09-23");
  });

  it("matches only the same local day", () => {
    expect(isSameTashkentDay("2026-09-24T02:00:00.000Z", NOW)).toBe(true);
    expect(isSameTashkentDay("2026-09-22T12:00:00.000Z", NOW)).toBe(false);
    expect(isSameTashkentDay(undefined, NOW)).toBe(false);
  });

  it("calls a decision fresh only for a few seconds", () => {
    expect(isFresh("2026-09-24T08:59:55.000Z", NOW)).toBe(true);
    expect(isFresh("2026-09-24T08:58:00.000Z", NOW)).toBe(false);
  });
});

describe("vacancies waiting for approval", () => {
  it("lists only vacancies waiting for a decision, oldest request first", () => {
    const rows = vacanciesToApprove(
      [
        vacancy({
          id: "a",
          approvalStatus: "pending_review",
          approvalSubmittedAt: "2026-09-21T05:00:00.000Z",
        }),
        vacancy({
          id: "b",
          approvalStatus: "pending_review",
          approvalSubmittedAt: "2026-09-19T05:00:00.000Z",
        }),
        vacancy({ id: "c", approvalStatus: "draft" }),
        vacancy({
          id: "d",
          approvalStatus: "pending_review",
          archivedAt: "2026-09-22T05:00:00.000Z",
        }),
      ],
      [verified],
      NOW,
    );

    expect(rows.map((row) => row.vacancy.id)).toEqual(["b", "a"]);
  });

  it("says what approval still needs, such as a verified organization", () => {
    const [row] = vacanciesToApprove(
      [vacancy({ approvalStatus: "pending_review", organizationId: "org-2" })],
      [unverified],
      NOW,
    );

    expect(row?.missing).toContain("organization");
  });
});

describe("organizations blocking publication", () => {
  it("names each unverified organization with the open vacancies it holds back", () => {
    const blocked = blockingOrganizations(
      [
        vacancy({ id: "a", organizationId: "org-2", approvalStatus: "pending_review" }),
        vacancy({
          id: "b",
          organizationId: "org-2",
          approvalStatus: "approved",
          publishedAt: "2026-09-01T00:00:00.000Z",
        }),
        vacancy({ id: "c", organizationId: "org-1", approvalStatus: "draft" }),
      ],
      [verified, unverified],
    );

    expect(blocked).toHaveLength(1);
    expect(blocked[0]?.organization.id).toBe("org-2");
    expect(blocked[0]?.vacancies.map((item) => item.id)).toEqual(["a"]);
  });
});

describe("applications waiting for a decision", () => {
  it("leaves out decided applications and those on archived vacancies", () => {
    const rows = applicationsToDecide(
      [
        application({ id: "new", submittedAt: "2026-09-22T05:00:00.000Z" }),
        application({
          id: "old",
          status: "under_review",
          submittedAt: "2026-09-18T05:00:00.000Z",
        }),
        application({ id: "done", status: "accepted" }),
        application({ id: "archived", opportunityId: "vacancy-2" }),
      ],
      [vacancy(), vacancy({ id: "vacancy-2", archivedAt: "2026-09-21T00:00:00.000Z" })],
    );

    expect(rows.map((row) => row.application.id)).toEqual(["old", "new"]);
  });
});

describe("roll calls", () => {
  it("opens a roll call only once the event has ended and someone is still unrecorded", () => {
    const ended = vacancy({
      id: "ended",
      startsAt: "2026-09-20T05:00:00.000Z",
      endsAt: "2026-09-20T09:00:00.000Z",
      applicationDeadline: "2026-09-18T05:00:00.000Z",
    });
    const upcoming = vacancy({ id: "upcoming" });
    const calls = rollCallsDue(
      [
        application({
          id: "1",
          status: "accepted",
          opportunityId: "ended",
          attendance: { id: "att-1", outcome: "awaiting_confirmation" },
        }),
        application({
          id: "2",
          status: "accepted",
          opportunityId: "ended",
          attendance: { id: "att-2", outcome: "attended", confirmedHours: 4 },
        }),
        application({
          id: "3",
          status: "accepted",
          opportunityId: "upcoming",
          attendance: { id: "att-3", outcome: "awaiting_confirmation" },
        }),
      ],
      [ended, upcoming],
      NOW,
    );

    expect(calls).toEqual([
      expect.objectContaining({ vacancyId: "ended", awaiting: 1, resolved: 1 }),
    ]);
  });
});

describe("what I cleared today", () => {
  it("collects today's own decisions and folds a roll call into one line", () => {
    const cleared = clearedToday({
      me: ME,
      now: NOW,
      vacancies: [
        vacancy({
          id: "mine",
          approvalStatus: "approved",
          approvalReviewedById: ME,
          approvalReviewedAt: "2026-09-24T06:00:00.000Z",
        }),
        vacancy({
          id: "theirs",
          approvalStatus: "approved",
          approvalReviewedById: "someone",
          approvalReviewedAt: "2026-09-24T06:00:00.000Z",
        }),
        vacancy({
          id: "yesterday",
          approvalStatus: "rejected",
          approvalReviewedById: ME,
          approvalReviewedAt: "2026-09-22T06:00:00.000Z",
        }),
      ],
      applications: [
        application({
          id: "accepted",
          status: "accepted",
          reviewedById: ME,
          reviewedAt: "2026-09-24T07:00:00.000Z",
        }),
        application({
          id: "looking",
          status: "under_review",
          reviewedById: ME,
          reviewedAt: "2026-09-24T07:30:00.000Z",
        }),
        application({
          id: "a",
          status: "accepted",
          attendance: {
            id: "x",
            outcome: "attended",
            confirmedHours: 3,
            confirmedById: ME,
            resolvedAt: "2026-09-24T08:00:00.000Z",
          },
        }),
        application({
          id: "b",
          status: "accepted",
          attendance: {
            id: "y",
            outcome: "excused",
            confirmedById: ME,
            resolvedAt: "2026-09-24T08:00:00.000Z",
          },
        }),
      ],
    });

    expect(cleared.map((item) => item.kind)).toEqual([
      "rollCall",
      "application",
      "vacancy",
    ]);
    expect(cleared[0]).toMatchObject({ attended: 1, other: 1 });
  });
});

describe("a coordinator's desk", () => {
  it("separates vacancies sent back for changes from drafts and counts those in review", () => {
    const desk = staffDesk(
      [
        vacancy({
          id: "back",
          approvalStatus: "changes_requested",
          approvalNote: "Add a venue.",
        }),
        vacancy({ id: "draft", approvalStatus: "draft" }),
        vacancy({ id: "waiting", approvalStatus: "pending_review" }),
      ],
      [verified],
      NOW,
    );

    expect(desk.returned.map((row) => row.vacancy.id)).toEqual(["back"]);
    expect(desk.drafts.map((row) => row.vacancy.id)).toEqual(["draft"]);
    expect(desk.inReview).toBe(1);
  });
});
