import type { ApplicationStatus, StagedDecision } from "@/lib/domain/vocabulary";

export type DeskApplicant = {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  status: ApplicationStatus;
  staged: StagedDecision | null;
  appliedAt: string | null;
  appliedLabel: string;
  decidedLabel: string | null;
  essay: string | null;
  answers: Array<{ prompt: string; value: string }>;
  profile: Array<{ label: string; value: string }>;
  href: string;
};

export const DESK_FILTERS = [
  "all",
  "undecided",
  "ready",
  "hold",
  "accepted",
  "rejected",
  "withdrawn",
] as const;
export type DeskFilter = (typeof DESK_FILTERS)[number];

export type DeskSort = {
  key: "applied" | "status" | "name";
  direction: "asc" | "desc";
};

export type Staged = Readonly<Record<string, StagedDecision | null>>;

export function isDecidable(status: ApplicationStatus) {
  return status === "submitted" || status === "under_review";
}

export function matchesFilter(
  applicant: DeskApplicant,
  decision: StagedDecision | null,
  filter: DeskFilter,
) {
  const decidable = isDecidable(applicant.status);
  switch (filter) {
    case "all":
      return true;
    case "undecided":
      return decidable && decision === null;
    case "ready":
      return decidable && (decision === "accept" || decision === "reject");
    case "hold":
      return decidable && decision === "hold";
    case "accepted":
      return applicant.status === "accepted";
    case "rejected":
      return applicant.status === "rejected";
    case "withdrawn":
      return applicant.status === "withdrawn" || applicant.status === "closed";
  }
}

export function matchesQuery(applicant: DeskApplicant, query: string) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  return [applicant.name, applicant.username ?? ""].some((value) =>
    value.toLocaleLowerCase().includes(needle.replace(/^@/, "")),
  );
}

const STATUS_ORDER: Record<ApplicationStatus, number> = {
  submitted: 0,
  under_review: 0,
  accepted: 1,
  rejected: 2,
  withdrawn: 3,
  closed: 3,
  draft: 4,
};

export function sortApplicants(
  applicants: readonly DeskApplicant[],
  sort: DeskSort,
  locale: string,
) {
  const sign = sort.direction === "asc" ? 1 : -1;
  const byName = (left: DeskApplicant, right: DeskApplicant) =>
    left.name.localeCompare(right.name, locale, { sensitivity: "base" });
  return [...applicants].sort((left, right) => {
    if (sort.key === "status") {
      return (
        sign * (STATUS_ORDER[left.status] - STATUS_ORDER[right.status]) ||
        byName(left, right)
      );
    }
    if (sort.key === "name") return sign * byName(left, right);
    const leftTime = left.appliedAt ? Date.parse(left.appliedAt) : 0;
    const rightTime = right.appliedAt ? Date.parse(right.appliedAt) : 0;
    return sign * (leftTime - rightTime) || byName(left, right);
  });
}

export type DeskCounts = {
  total: number;
  pending: number;
  undecided: number;
  accept: number;
  reject: number;
  hold: number;
  ready: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
};

export function countDesk(applicants: readonly DeskApplicant[], staged: Staged) {
  const counts: DeskCounts = {
    total: applicants.length,
    pending: 0,
    undecided: 0,
    accept: 0,
    reject: 0,
    hold: 0,
    ready: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
  };
  for (const applicant of applicants) {
    if (applicant.status === "accepted") counts.accepted += 1;
    if (applicant.status === "rejected") counts.rejected += 1;
    if (applicant.status === "withdrawn" || applicant.status === "closed") {
      counts.withdrawn += 1;
    }
    if (!isDecidable(applicant.status)) continue;
    counts.pending += 1;
    const decision = staged[applicant.id] ?? null;
    if (decision === null) counts.undecided += 1;
    else counts[decision] += 1;
  }
  counts.ready = counts.accept + counts.reject;
  return counts;
}

export function pageWindow(page: number, pages: number): Array<number | null> {
  if (pages <= 7) return Array.from({ length: pages }, (_item, index) => index + 1);
  const shown = new Set([1, pages, page - 1, page, page + 1]);
  const output: Array<number | null> = [];
  for (let index = 1; index <= pages; index += 1) {
    if (shown.has(index)) output.push(index);
    else if (output.at(-1) !== null) output.push(null);
  }
  return output;
}
