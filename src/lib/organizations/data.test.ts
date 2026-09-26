import { describe, expect, it } from "vitest";

import { fieldErrorsOf } from "@/lib/auth/credentials";
import { createOrganizationSchema } from "@/lib/organizations/schema";
import { filterOrganizations } from "@/lib/organizations/filters";
import type { Organization } from "@/lib/api/schemas";

const organizations: Organization[] = [
  { id: "b", name: "Green Corridor Group", slug: "green", verified: false },
  { id: "a", name: "Chilonzor Reading Corners", slug: "reading", verified: true },
];

describe("filterOrganizations", () => {
  it("sorts by name so the list is predictable", () => {
    expect(filterOrganizations(organizations, {}).map((item) => item.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("filters by verification in both directions", () => {
    expect(
      filterOrganizations(organizations, { verified: "yes" }).map((item) => item.id),
    ).toEqual(["a"]);
    expect(
      filterOrganizations(organizations, { verified: "no" }).map((item) => item.id),
    ).toEqual(["b"]);
  });

  it("searches the name and the slug", () => {
    expect(filterOrganizations(organizations, { q: "green" }).map((i) => i.id)).toEqual(
      ["b"],
    );
    expect(
      filterOrganizations(organizations, { q: "READING" }).map((i) => i.id),
    ).toEqual(["a"]);
  });
});

describe("createOrganizationSchema", () => {
  it("requires a slug the backend pattern accepts", () => {
    const result = createOrganizationSchema.safeParse({
      name: "Reading Corners",
      slug: "Reading Corners",
      password: "A unique long password for this account!",
    });
    expect(fieldErrorsOf(result.error!).slug).toEqual(["slug"]);
  });

  it("requires a stable login name and password for portal access", () => {
    const result = createOrganizationSchema.safeParse({
      name: "Reading Corners",
      slug: "",
      password: "",
    });
    expect(fieldErrorsOf(result.error!).slug).toContain("required");
    expect(fieldErrorsOf(result.error!).password).toContain("passwordShort");
  });

  it("accepts a complete organization account", () => {
    expect(
      createOrganizationSchema.safeParse({
        name: "Reading Corners",
        slug: "reading-corners",
        password: "A unique long password for this account!",
      }).success,
    ).toBe(true);
  });
});
