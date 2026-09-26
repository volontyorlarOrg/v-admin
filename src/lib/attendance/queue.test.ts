import { describe, expect, it } from "vitest";

import { vacancySchema, type Application } from "@/lib/api/schemas";
import { groupAttendance, unresolvedCount } from "@/lib/attendance/queue";

const NOW = new Date("2026-10-05T12:00:00.000Z");

function application(
  id: string,
  opportunityId: string,
  overrides: Partial<Application> = {},
): Application {
  return {
    id,
    status: "accepted",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    volunteerId: `volunteer-${id}`,
    opportunityId,
    answers: [],
    profileSnapshot: { fullName: `Name ${id}` },
    opportunity: {
      id: opportunityId,
      slug: opportunityId,
      title: `Vacancy ${opportunityId}`,
      startsAt: "2026-10-01T09:00:00.000Z",
      endsAt: "2026-10-01T15:00:00.000Z",
    },
    ...overrides,
  } as Application;
}

const resolved = (id: string, opportunityId: string) =>
  application(id, opportunityId, {
    attendance: {
      id: `att-${id}`,
      outcome: "attended",
      confirmedHours: 4,
      resolvedAt: "2026-10-02T09:00:00.000Z",
      applicationId: id,
      volunteerId: `volunteer-${id}`,
      opportunityId,
    },
  } as Partial<Application>);

describe("groupAttendance", () => {
  it("collects a vacancy's accepted volunteers under the vacancy", () => {
    const groups = groupAttendance(
      [application("a", "v1"), application("b", "v1"), application("c", "v2")],
      NOW,
    );

    expect(groups.map((group) => group.vacancyId).sort()).toEqual(["v1", "v2"]);
    expect(groups.find((group) => group.vacancyId === "v1")?.unresolved).toHaveLength(
      2,
    );
  });

  it("separates what is already resolved from what still needs a decision", () => {
    const groups = groupAttendance([application("a", "v1"), resolved("b", "v1")], NOW);

    expect(groups[0]?.unresolved.map((item) => item.id)).toEqual(["a"]);
    expect(groups[0]?.resolved.map((item) => item.id)).toEqual(["b"]);
  });

  it("keeps a vacancy shut until its event has ended", () => {
    const future = application("a", "v1", {
      opportunity: {
        id: "v1",
        slug: "v1",
        title: "Later",
        startsAt: "2026-11-01T09:00:00.000Z",
        endsAt: "2026-11-01T15:00:00.000Z",
      },
    } as Partial<Application>);

    expect(groupAttendance([future], NOW)[0]?.open).toBe(false);
  });

  it("falls back to the start when a legacy record carries no end", () => {
    const legacy = application("a", "v1", {
      opportunity: {
        id: "v1",
        slug: "v1",
        title: "Legacy",
        startsAt: "2026-10-01T09:00:00.000Z",
      },
    } as Partial<Application>);

    const group = groupAttendance([legacy], NOW)[0];
    expect(group?.opensAt?.toISOString()).toBe("2026-10-01T09:00:00.000Z");
    expect(group?.open).toBe(true);
  });

  it("reads the event's timing from the vacancy, because the application list carries only its title", () => {
    const listed = application("a", "v1", {
      opportunity: { id: "v1", slug: "v1", title: "Listed" },
    } as Partial<Application>);
    const vacancy = vacancySchema.parse({
      id: "v1",
      slug: "v1",
      title: "Library day",
      kind: "volunteering",
      description: "Help at the library.",
      region: "tashkent-city",
      format: "onsite",
      status: "open",
      startsAt: "2026-11-01T09:00:00.000Z",
      endsAt: "2026-11-01T15:00:00.000Z",
      applicationDeadline: "2026-10-20T09:00:00.000Z",
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
      organizationId: "org-1",
    });

    const [group] = groupAttendance([listed], NOW, [vacancy]);
    expect(group?.open).toBe(false);
    expect(group?.title).toBe("Library day");
    expect(group?.opensAt?.toISOString()).toBe("2026-11-01T15:00:00.000Z");
  });

  it("never calls a roll call due when the event's timing is unknown", () => {
    const unknown = application("a", "v1", {
      opportunity: { id: "v1", slug: "v1", title: "Unknown" },
    } as Partial<Application>);

    const [group] = groupAttendance([unknown], NOW);
    expect(group?.open).toBe(false);
    expect(group?.opensAt).toBeNull();
  });

  it("puts the work a coordinator can do now first", () => {
    const later = application("later", "v-later", {
      opportunity: {
        id: "v-later",
        slug: "v-later",
        title: "Later",
        startsAt: "2026-11-01T09:00:00.000Z",
        endsAt: "2026-11-01T15:00:00.000Z",
      },
    } as Partial<Application>);

    const groups = groupAttendance([later, application("now", "v-now")], NOW);
    expect(groups[0]?.vacancyId).toBe("v-now");
  });
});

describe("unresolvedCount", () => {
  it("counts every volunteer still waiting across the queue", () => {
    const groups = groupAttendance(
      [application("a", "v1"), application("b", "v2"), resolved("c", "v2")],
      NOW,
    );
    expect(unresolvedCount(groups)).toBe(2);
  });
});
