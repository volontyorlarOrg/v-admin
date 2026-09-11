import { describe, expect, it } from "vitest";

import {
  ATTENDANCE_OUTCOMES,
  RESOLVABLE_ATTENDANCE_OUTCOMES,
  canArchive,
  isAwaitingReview,
  isReviewable,
  stageOf,
} from "@/lib/domain/vocabulary";

const draft = {};
const published = { publishedAt: "2026-01-01T00:00:00.000Z" };
const archived = {
  publishedAt: "2026-01-01T00:00:00.000Z",
  archivedAt: "2026-02-01T00:00:00.000Z",
};

describe("stageOf", () => {
  it("reads the lifecycle from the two timestamps the API sends", () => {
    expect(stageOf(draft)).toBe("draft");
    expect(stageOf(published)).toBe("published");
    expect(stageOf(archived)).toBe("archived");
  });

  it("treats an archived vacancy as archived even though it was published", () => {
    expect(stageOf({ ...published, archivedAt: "2026-03-01T00:00:00.000Z" })).toBe(
      "archived",
    );
  });
});

describe("lifecycle permissions", () => {
  it("archives anything not already archived", () => {
    expect(canArchive(draft)).toBe(true);
    expect(canArchive(published)).toBe(true);
    expect(canArchive(archived)).toBe(false);
  });
});

describe("application status vocabulary", () => {
  it("reviews submitted, under review and accepted applications", () => {
    expect(isReviewable("submitted")).toBe(true);
    expect(isReviewable("under_review")).toBe(true);
    expect(isReviewable("accepted")).toBe(true);
    expect(isReviewable("withdrawn")).toBe(false);
    expect(isReviewable("draft")).toBe(false);
  });

  it("counts only the undecided ones as awaiting review", () => {
    expect(isAwaitingReview("submitted")).toBe(true);
    expect(isAwaitingReview("accepted")).toBe(false);
  });
});

describe("attendance outcomes", () => {
  it("never offers awaiting_confirmation as a resolution", () => {
    expect(ATTENDANCE_OUTCOMES).toContain("awaiting_confirmation");
    expect(RESOLVABLE_ATTENDANCE_OUTCOMES).not.toContain("awaiting_confirmation");
  });
});
