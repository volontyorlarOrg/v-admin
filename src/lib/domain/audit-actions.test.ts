import { describe, expect, it } from "vitest";

import {
  AUDIT_ACTIONS,
  AUDIT_FAMILIES,
  AUDIT_FAMILY_ICONS,
  auditActionGroups,
  auditActionKey,
  auditActionOptions,
  auditFamilyOf,
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

describe("auditFamilyOf", () => {
  it("files every known action under a family other than other", () => {
    for (const action of AUDIT_ACTIONS) {
      expect(auditFamilyOf(action), action).not.toBe("other");
    }
  });

  it("keeps a volunteer's past events and XP apart from account changes", () => {
    expect(auditFamilyOf("user.past_event.created")).toBe("pastEvent");
    expect(auditFamilyOf("user.progress.adjusted")).toBe("award");
    expect(auditFamilyOf("bulk_award.revoked")).toBe("award");
    expect(auditFamilyOf("user.password.replaced")).toBe("user");
    expect(auditFamilyOf("past_event_roster.submitted")).toBe("pastEvent");
  });

  it("files an action it has never seen under other", () => {
    expect(auditFamilyOf("blog.published")).toBe("other");
  });

  it("has an icon for every family", () => {
    for (const family of AUDIT_FAMILIES)
      expect(AUDIT_FAMILY_ICONS[family]).toBeTruthy();
  });
});

describe("auditActionGroups", () => {
  it("offers every action exactly once, grouped by family in a fixed order", () => {
    const groups = auditActionGroups(["blog.published"]);
    const flat = groups.flatMap((group) => group.actions);
    expect(new Set(flat).size).toBe(flat.length);
    expect(flat).toContain("blog.published");
    expect(groups.map((group) => group.family)).toEqual(
      AUDIT_FAMILIES.filter((family) =>
        groups.some((group) => group.family === family),
      ),
    );
    expect(groups.at(-1)?.family).toBe("other");
  });
});
