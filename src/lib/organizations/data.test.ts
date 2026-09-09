import { describe, expect, it } from "vitest";

import { fieldErrorsOf } from "@/lib/auth/credentials";
import { createOrganizationSchema } from "@/lib/organizations/schema";
import {
  filterOrganizations,
  publishableOrganizations,
} from "@/lib/organizations/filters";
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

describe("publishableOrganizations", () => {
  it("keeps only verified organizations, because publishing needs one", () => {
    expect(publishableOrganizations(organizations).map((item) => item.id)).toEqual([
      "a",
    ]);
  });
});

describe("createOrganizationSchema", () => {
  it("requires a slug the backend pattern accepts", () => {
    const result = createOrganizationSchema.safeParse({
      name: "Reading Corners",
      slug: "Reading Corners",
      verified: false,
    });
    expect(fieldErrorsOf(result.error!).slug).toEqual(["slug"]);
  });

  it("treats an empty logo URL as no logo rather than an error", () => {
    expect(
      createOrganizationSchema.safeParse({
        name: "Reading Corners",
        slug: "reading-corners",
        logoUrl: "",
        verified: true,
      }).success,
    ).toBe(true);
  });

  it("rejects a logo that is not a URL", () => {
    const result = createOrganizationSchema.safeParse({
      name: "Reading Corners",
      slug: "reading-corners",
      logoUrl: "not-a-url",
      verified: false,
    });
    expect(fieldErrorsOf(result.error!).logoUrl).toEqual(["url"]);
  });
});
