import { describe, expect, it } from "vitest";

import { awaitingDecision, filterVacancies } from "@/lib/vacancies/filters";
import type { Vacancy } from "@/lib/api/schemas";

function vacancy(overrides: Partial<Vacancy> & { id: string }): Vacancy {
  return {
    slug: overrides.id,
    title: "A vacancy",
    description: "",
    requirements: [],
    region: "tashkent-city",
    format: "onsite",
    status: "open",
    startsAt: "2026-10-01T09:00:00.000Z",
    applicationDeadline: "2026-09-20T18:00:00.000Z",
    createdAt: "2026-09-01T09:00:00.000Z",
    updatedAt: "2026-09-01T09:00:00.000Z",
    organizationId: "org-1",
    questions: [],
    ...overrides,
  } as Vacancy;
}

const draft = vacancy({
  id: "a",
  title: "Book drive",
  createdAt: "2026-09-03T00:00:00.000Z",
});
const published = vacancy({
  id: "b",
  title: "Reading room",
  publishedAt: "2026-09-02T00:00:00.000Z",
  createdAt: "2026-09-02T00:00:00.000Z",
});
const archived = vacancy({
  id: "c",
  title: "Riverbank clean-up",
  publishedAt: "2026-08-01T00:00:00.000Z",
  archivedAt: "2026-08-20T00:00:00.000Z",
  createdAt: "2026-09-01T00:00:00.000Z",
});

const waiting = vacancy({
  id: "d",
  title: "Sports day",
  approvalStatus: "pending_review",
  approvalSubmittedAt: "2026-09-04T00:00:00.000Z",
  createdAt: "2026-09-04T00:00:00.000Z",
});

const all = [published, archived, draft];

describe("filterVacancies", () => {
  it("puts the newest first", () => {
    expect(filterVacancies(all, {}).map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("filters by the state the approval workflow puts a vacancy in", () => {
    expect(filterVacancies(all, { state: "draft" }).map((item) => item.id)).toEqual([
      "a",
    ]);
    expect(filterVacancies(all, { state: "approved" }).map((item) => item.id)).toEqual([
      "b",
    ]);
    expect(filterVacancies(all, { state: "archived" }).map((item) => item.id)).toEqual([
      "c",
    ]);
    expect(
      filterVacancies([...all, waiting], { state: "pending_review" }).map(
        (item) => item.id,
      ),
    ).toEqual(["d"]);
  });

  it("searches the title, description and slug case-insensitively", () => {
    expect(filterVacancies(all, { q: "  READING " }).map((item) => item.id)).toEqual([
      "b",
    ]);
  });

  it("returns everything for a blank search rather than nothing", () => {
    expect(filterVacancies(all, { q: "   " })).toHaveLength(3);
  });

  it("combines a search with a state", () => {
    expect(filterVacancies(all, { q: "room", state: "draft" })).toEqual([]);
  });
});

describe("awaitingDecision", () => {
  it("keeps only what an administrator still has to decide", () => {
    expect(awaitingDecision([...all, waiting]).map((item) => item.id)).toEqual(["d"]);
  });
});
