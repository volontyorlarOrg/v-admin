import type { SheetStatus, VacancyState } from "@/lib/domain/vocabulary";
import { eventEndsAt } from "@/lib/vacancies/approval";

export const TRACK_STAGES = [
  "draft",
  "approval",
  "applications",
  "event",
  "results",
] as const;

export type TrackStage = (typeof TRACK_STAGES)[number];

export type TrackTone = "institution" | "earned";

export const TRACK_TONES: Record<TrackStage, TrackTone> = {
  draft: "institution",
  approval: "institution",
  applications: "institution",
  event: "earned",
  results: "earned",
};

export type TrackStatus = "done" | "current" | "upcoming" | "stopped";

export type TrackNote =
  | "created"
  | "preparing"
  | "waiting"
  | "returned"
  | "rejected"
  | "approved"
  | "closes"
  | "closed"
  | "starts"
  | "running"
  | "held"
  | "due"
  | "recording"
  | "submitted"
  | "correcting"
  | "verified"
  | "archived"
  | "later";

export type TrackStep = {
  stage: TrackStage;
  status: TrackStatus;
  note: TrackNote;
  at?: string;
};

export type TrackSubject = {
  state: VacancyState;
  createdAt: string;
  approvalReviewedAt?: string | undefined;
  applicationDeadline?: string | undefined;
  startsAt?: string | undefined;
  endsAt?: string | undefined;
  attendanceSheet?: { status: SheetStatus; correction?: boolean } | undefined;
};

const RESULT_NOTES: Record<SheetStatus, TrackNote> = {
  draft: "recording",
  submitted: "submitted",
  changes_requested: "correcting",
  verified: "verified",
};

function passed(value: string | undefined, now: Date): boolean {
  return value !== undefined && Date.parse(value) <= now.getTime();
}

function reached(subject: TrackSubject, now: Date): TrackStage {
  if (subject.state === "draft") return "draft";
  if (
    subject.state === "pending_review" ||
    subject.state === "changes_requested" ||
    subject.state === "rejected"
  ) {
    return "approval";
  }
  if (!passed(subject.applicationDeadline, now)) return "applications";
  const ends = subject.startsAt
    ? eventEndsAt({ startsAt: subject.startsAt, endsAt: subject.endsAt })
    : null;
  if (!ends || ends.getTime() > now.getTime()) return "event";
  return "results";
}

function currentNote(stage: TrackStage, subject: TrackSubject, now: Date): TrackNote {
  switch (stage) {
    case "draft":
      return "preparing";
    case "approval":
      return subject.state === "changes_requested" ? "returned" : "waiting";
    case "applications":
      return "closes";
    case "event":
      return passed(subject.startsAt, now) ? "running" : "starts";
    case "results": {
      const sheet = subject.attendanceSheet;
      if (!sheet) return "due";
      return sheet.correction && sheet.status === "draft"
        ? "correcting"
        : RESULT_NOTES[sheet.status];
    }
  }
}

function doneNote(stage: TrackStage): TrackNote {
  return (
    {
      draft: "created",
      approval: "approved",
      applications: "closed",
      event: "held",
      results: "verified",
    } as const
  )[stage];
}

function dateOf(stage: TrackStage, subject: TrackSubject): string | undefined {
  switch (stage) {
    case "draft":
      return subject.createdAt;
    case "approval":
      return subject.approvalReviewedAt;
    case "applications":
      return subject.applicationDeadline;
    case "event":
      return subject.startsAt;
    case "results":
      return undefined;
  }
}

export function vacancyTrack(subject: TrackSubject, now: Date): TrackStep[] {
  const stage = reached(subject, now);
  const position = TRACK_STAGES.indexOf(stage);
  const verified =
    stage === "results" &&
    subject.attendanceSheet?.status === "verified" &&
    !subject.attendanceSheet.correction;

  return TRACK_STAGES.map((candidate, index) => {
    const at = dateOf(candidate, subject);
    const step = (status: TrackStatus, note: TrackNote): TrackStep =>
      at ? { stage: candidate, status, note, at } : { stage: candidate, status, note };

    if (index < position || (index === position && verified)) {
      return step("done", doneNote(candidate));
    }
    if (index === position) {
      if (subject.state === "rejected") return step("stopped", "rejected");
      if (subject.state === "archived" && candidate !== "results") {
        return step("stopped", "archived");
      }
      return step("current", currentNote(candidate, subject, now));
    }
    const upcoming: TrackNote =
      candidate === "applications"
        ? "closes"
        : candidate === "event"
          ? "starts"
          : "later";
    return step("upcoming", upcoming);
  });
}
