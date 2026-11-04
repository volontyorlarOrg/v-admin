import { describe, expect, it } from "vitest";
import {
  reportPageHref,
  reportSchema,
  reportStatusSchema,
} from "@/lib/reports/schemas";

describe("report contracts", () => {
  it("accepts the API's Unicode character limit without breaking the queue", () => {
    const person = {
      id: "00000000-0000-4000-8000-000000000001",
      displayName: "Volunteer",
      username: "volunteer",
    };
    const report = {
      id: person.id,
      description: "😀".repeat(5_000),
      pagePath: "/profile/edit",
      status: "open",
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reporter: person,
      resolvedBy: null,
      resolvedAt: null,
    };
    expect(reportSchema.safeParse(report).success).toBe(true);
    expect(
      reportSchema.safeParse({ ...report, description: "😀".repeat(5_001) }).success,
    ).toBe(false);
  });
  it("requires a known status, a current version and a valid identifier for writes", () => {
    const input = {
      id: "00000000-0000-4000-8000-000000000001",
      status: "resolved",
      version: "2",
    };
    expect(reportStatusSchema.parse(input).version).toBe(2);
    for (const change of [{ status: "deleted" }, { version: "0" }, { id: "bad" }])
      expect(reportStatusSchema.safeParse({ ...input, ...change }).success).toBe(false);
  });
  it("refuses incomplete report responses instead of inventing defaults", () => {
    expect(
      reportSchema.safeParse({
        description: "Problem",
        pagePath: "/settings",
        status: "open",
      }).success,
    ).toBe(false);
  });
  it("uses only a configured app origin for the originating page link", () => {
    expect(reportPageHref("/profile/edit", "https://app.example.org")).toBe(
      "https://app.example.org/profile/edit",
    );
    expect(reportPageHref("/settings", undefined)).toBeNull();
  });
  it.each([
    "https://evil.example",
    "//evil.example",
    "/%2fevil.example",
    "/%5cevil.example",
    "/%252fevil.example",
    "/settings?secret=token",
    "/settings#secret",
    "/%00",
  ])("keeps unsafe page paths out of links: %s", (path) => {
    expect(reportPageHref(path, "https://app.example.org")).toBeNull();
  });
});
