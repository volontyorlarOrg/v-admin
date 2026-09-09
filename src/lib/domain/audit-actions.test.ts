import { describe, expect, it } from "vitest";

import { AUDIT_ACTIONS, auditActionOptions } from "@/lib/domain/audit-actions";

describe("the audit action vocabulary", () => {
  it("mirrors what the backend records, sorted and unique", () => {
    expect([...AUDIT_ACTIONS].sort()).toEqual([...AUDIT_ACTIONS]);
    expect(new Set(AUDIT_ACTIONS).size).toBe(AUDIT_ACTIONS.length);
  });

  it("covers every family of action the portals can cause", () => {
    for (const prefix of [
      "opportunity.",
      "application.",
      "attendance.",
      "coordinator.",
      "user.",
    ]) {
      expect(
        AUDIT_ACTIONS.some((action) => action.startsWith(prefix)),
        prefix,
      ).toBe(true);
    }
  });
});

describe("auditActionOptions", () => {
  it("offers the whole vocabulary even when the page shows few actions", () => {
    expect(auditActionOptions(["coordinator.created"]).length).toBe(
      AUDIT_ACTIONS.length,
    );
  });

  it("adds an action the backend started recording after this list was written", () => {
    expect(auditActionOptions(["organization.verified"])).toContain(
      "organization.verified",
    );
  });

  it("never repeats an action", () => {
    const options = auditActionOptions(["coordinator.created", "coordinator.created"]);
    expect(new Set(options).size).toBe(options.length);
  });
});
