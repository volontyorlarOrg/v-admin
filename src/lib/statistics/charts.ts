import type { Statistics } from "@/lib/api/schemas";

type Totals = Statistics["totals"];

export const PIPELINE_STAGES = [
  "applications",
  "pendingReview",
  "accepted",
  "awaitingAttendance",
  "attended",
] as const;

export const COORDINATOR_STATES = ["active", "blocked", "removed"] as const;

export type PipelineStageKey = (typeof PIPELINE_STAGES)[number];

export type CoordinatorStateKey = (typeof COORDINATOR_STATES)[number];

export type Band = { value: number; share: number };

export type PipelineStage = Band & { key: PipelineStageKey };

export type CoordinatorSegment = Band & { key: CoordinatorStateKey };

export type Ratio = { value: number; total: number; share: number };

function count(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function share(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(1, value / total);
}

export function pipeline(totals: Totals): PipelineStage[] {
  const stages = PIPELINE_STAGES.map((key) => ({ key, value: count(totals[key]) }));
  const peak = stages.reduce((highest, stage) => Math.max(highest, stage.value), 0);

  return stages.map((stage) => ({ ...stage, share: share(stage.value, peak) }));
}

export function publishedRatio(totals: Totals): Ratio {
  const total = count(totals.vacancies);
  const value = Math.min(total, count(totals.publishedVacancies));

  return { value, total, share: share(value, total) };
}

export function attendanceRatio(totals: Totals): Ratio {
  const value = count(totals.attended);
  const total = value + count(totals.awaitingAttendance);

  return { value, total, share: share(value, total) };
}

export function coordinatorSplit(totals: Totals): CoordinatorSegment[] | null {
  const coordinators = totals.coordinators;
  if (!coordinators) return null;

  const segments = COORDINATOR_STATES.map((key) => ({
    key,
    value: count(coordinators[key]),
  }));
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  if (total === 0) return null;

  return segments.map((segment) => ({
    ...segment,
    share: share(segment.value, total),
  }));
}
