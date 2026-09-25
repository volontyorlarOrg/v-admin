import { describe, expect, it } from "vitest";

import { subjectOf } from "@/lib/audit/describe";

describe("what an audit event touched", () => {
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
