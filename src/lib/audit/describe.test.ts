import { describe, expect, it } from "vitest";

import { describeSubject, subjectOf } from "@/lib/audit/describe";
import { buildDirectory } from "@/lib/audit/directory";

describe("what an audit event touched", () => {
  it("links a bulk award to its page, where it can be reviewed or taken back", () => {
    expect(
      subjectOf({
        action: "bulk_award.revoked",
        entityType: "BulkAward",
        entityId: "award-1",
      }),
    ).toEqual({ kind: "bulkAward", href: "/bulk-awards/award-1" });
  });
  it("links vacancies, applications and organizations to their pages", () => {
    expect(
      subjectOf({
        action: "opportunity.approved",
        entityType: "opportunity",
        entityId: "v1",
      }),
    ).toEqual({ kind: "vacancy", href: "/vacancies/v1" });
    expect(
      subjectOf({
        action: "application.accepted",
        entityType: "application",
        entityId: "a1",
      }),
    ).toEqual({ kind: "application", href: "/applications/a1" });
    expect(
      subjectOf({
        action: "organization.updated",
        entityType: "organization",
        entityId: "o1",
      }),
    ).toEqual({ kind: "organization", href: "/organizations" });
  });

  it("tells a coordinator from a volunteer behind the same entity type", () => {
    expect(
      subjectOf({ action: "coordinator.blocked", entityType: "User", entityId: "c1" })
        .kind,
    ).toBe("coordinator");
    expect(
      subjectOf(
        { action: "user.password.replaced", entityType: "User", entityId: "c2" },
        new Set(["c2"]),
      ),
    ).toEqual({ kind: "coordinator", href: "/coordinators/c2" });
    expect(
      subjectOf({
        action: "user.password.replaced",
        entityType: "User",
        entityId: "u1",
      }),
    ).toEqual({ kind: "volunteer", href: "/users/u1" });
  });

  it("offers no link where no page shows the record", () => {
    expect(
      subjectOf({
        action: "attendance.resolved",
        entityType: "attendance",
        entityId: "x",
      }).href,
    ).toBeNull();
  });
});

describe("describeSubject", () => {
  const directory = buildDirectory({
    coordinators: [{ id: "c1", name: "Nodira Alimova" }],
    organizations: [{ id: "o1", name: "Green Corridor Group" }],
    vacancies: [{ id: "v1", title: "Winter clothing drive" }],
    applications: [
      {
        id: "a1",
        volunteerId: "u1",
        volunteerName: "Aziza Karimova",
        vacancyTitle: "Winter clothing drive",
      },
    ],
  });

  it("names the vacancy, organization and application an event touched", () => {
    expect(
      describeSubject(
        { action: "opportunity.approved", entityType: "Opportunity", entityId: "v1" },
        directory,
      ),
    ).toEqual({
      kind: "vacancy",
      href: "/vacancies/v1",
      name: "Winter clothing drive",
    });
    expect(
      describeSubject(
        { action: "organization.updated", entityType: "Organization", entityId: "o1" },
        directory,
      ).name,
    ).toBe("Green Corridor Group");
    expect(
      describeSubject(
        { action: "application.accepted", entityType: "Application", entityId: "a1" },
        directory,
      ).name,
    ).toBe("Aziza Karimova · Winter clothing drive");
  });

  it("recognises a coordinator by the directory, not only by the action", () => {
    expect(
      describeSubject(
        { action: "user.password.replaced", entityType: "User", entityId: "c1" },
        directory,
      ),
    ).toEqual({
      kind: "coordinator",
      href: "/coordinators/c1",
      name: "Nodira Alimova",
    });
  });

  it("leaves the name empty rather than guessing one", () => {
    expect(
      describeSubject(
        { action: "opportunity.approved", entityType: "Opportunity", entityId: "v9" },
        directory,
      ).name,
    ).toBeNull();
  });

  it("files a volunteer's manual past event with the past events", () => {
    expect(
      describeSubject(
        {
          action: "user.past_event.created",
          entityType: "ManualPastEvent",
          entityId: "p1",
        },
        directory,
      ).kind,
    ).toBe("pastEvent");
  });
});
