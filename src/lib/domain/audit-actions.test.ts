import { describe, expect, it } from "vitest";

import {
  AUDIT_ACTIONS,
  auditActionKey,
  auditActionOptions,
  isKnownAuditAction,
} from "@/lib/domain/audit-actions";

describe("the audit action vocabulary", () => {
  it("names every action once", () => {
    expect(new Set(AUDIT_ACTIONS).size).toBe(AUDIT_ACTIONS.length);
  });

  it("uses the strings the backend records, including the decisions it writes per status", () => {
    for (const action of [
      "application.accepted",
      "application.closed",
      "opportunity.approved",
      "opportunity.changes_requested",
      "opportunity.submitted_for_approval",
      "coordinator.active",
      "organization.updated",
    ]) {
      expect(isKnownAuditAction(action), action).toBe(true);
    }
    expect(isKnownAuditAction("application.reviewed")).toBe(false);
  });

  it("covers every family of action the portals can cause", () => {
    for (const prefix of [
      "opportunity.",
      "application.",
      "attendance.",
      "coordinator.",
      "organization.",
      "user.",
    ]) {
      expect(
        AUDIT_ACTIONS.some((action) => action.startsWith(prefix)),
        prefix,
      ).toBe(true);
    }
  });

  it("turns an action into a catalog key without dots", () => {
    expect(auditActionKey("user.password.replaced")).toBe("user_password_replaced");
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
