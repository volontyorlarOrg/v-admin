import { describe, expect, it } from "vitest";

import {
  TRACK_STAGES,
  TRACK_TONES,
  vacancyTrack,
  type TrackSubject,
} from "@/lib/vacancies/track";

const NOW = new Date("2026-11-17T09:00:00Z");

const base: TrackSubject = {
  state: "approved",
  createdAt: "2026-11-01T09:00:00Z",
  approvalReviewedAt: "2026-11-03T09:00:00Z",
  applicationDeadline: "2026-11-22T09:00:00Z",
  startsAt: "2026-11-29T09:00:00Z",
  endsAt: "2026-11-29T13:00:00Z",
};

const statuses = (subject: TrackSubject) =>
  vacancyTrack(subject, NOW).map((step) => `${step.stage}:${step.status}:${step.note}`);

describe("the vacancy track", () => {
  it("keeps a draft at its first station with everything after it still ahead", () => {
    expect(statuses({ ...base, state: "draft" })).toEqual([
      "draft:current:preparing",
      "approval:upcoming:later",
      "applications:upcoming:closes",
      "event:upcoming:starts",
      "results:upcoming:later",
    ]);
  });

  it("says whose move approval is: waiting on the administrator, or returned to the organizer", () => {
    expect(statuses({ ...base, state: "pending_review" })[1]).toBe(
      "approval:current:waiting",
    );
    expect(statuses({ ...base, state: "changes_requested" })[1]).toBe(
      "approval:current:returned",
    );
  });

  it("stops a rejected vacancy at approval instead of showing it as waiting", () => {
    expect(statuses({ ...base, state: "rejected" })[1]).toBe(
      "approval:stopped:rejected",
    );
  });

  it("moves a published vacancy along with the calendar", () => {
    expect(statuses(base)[2]).toBe("applications:current:closes");
    expect(statuses({ ...base, applicationDeadline: "2026-11-10T09:00:00Z" })[3]).toBe(
      "event:current:starts",
    );
    expect(
      statuses({
        ...base,
        applicationDeadline: "2026-11-10T09:00:00Z",
        startsAt: "2026-11-16T09:00:00Z",
        endsAt: "2026-11-18T09:00:00Z",
      })[3],
    ).toBe("event:current:running");
  });

  it("reports results from the attendance sheet once the event has ended", () => {
    const ended = {
      ...base,
      applicationDeadline: "2026-11-05T09:00:00Z",
      startsAt: "2026-11-10T09:00:00Z",
      endsAt: "2026-11-10T13:00:00Z",
    };
    expect(statuses(ended)[4]).toBe("results:current:due");
    expect(statuses({ ...ended, attendanceSheet: { status: "submitted" } })[4]).toBe(
      "results:current:submitted",
    );
    expect(
      statuses({ ...ended, attendanceSheet: { status: "draft", correction: true } })[4],
    ).toBe("results:current:correcting");
    expect(statuses({ ...ended, attendanceSheet: { status: "verified" } })).toEqual([
      "draft:done:created",
      "approval:done:approved",
      "applications:done:closed",
      "event:done:held",
      "results:done:verified",
    ]);
  });

  it("marks where an archived vacancy stopped", () => {
    expect(statuses({ ...base, state: "archived" })[2]).toBe(
      "applications:stopped:archived",
    );
  });

  it("carries the date each station is known by", () => {
    const [draft, approval, applications, event, results] = vacancyTrack(base, NOW);
    expect(draft?.at).toBe(base.createdAt);
    expect(approval?.at).toBe(base.approvalReviewedAt);
    expect(applications?.at).toBe(base.applicationDeadline);
    expect(event?.at).toBe(base.startsAt);
    expect(results?.at).toBeUndefined();
  });

  it("turns from the institution's blue to the volunteer's orange where volunteers start to earn", () => {
    expect(TRACK_STAGES.map((stage) => TRACK_TONES[stage])).toEqual([
      "institution",
      "institution",
      "institution",
      "earned",
      "earned",
    ]);
  });
});
