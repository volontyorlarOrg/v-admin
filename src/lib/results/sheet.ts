import type {
  AttendanceOutcome,
  Placement,
  SheetOutcome,
  VacancyKind,
} from "@/lib/domain/vocabulary";
import type { SheetRow, SheetValues, XpRules } from "@/lib/results/schemas";

export type EditableRow = {
  applicationId: string;
  outcome: SheetOutcome | null;
  hours: string;
  placement: Placement | null;
  note: string;
};

export type SheetEntry = {
  applicationId: string;
  outcome: SheetOutcome | null;
  hours?: number | null;
  placement?: Placement | null;
  note?: string | null;
};

export type RowProblem = "outcomeRequired" | "hoursRequired" | "hoursInvalid";

export const MIN_HOURS = 0.25;
export const MAX_HOURS = 999;

function sheetOutcome(outcome: AttendanceOutcome): SheetOutcome | null {
  return outcome === "awaiting_confirmation" ? null : outcome;
}

function hoursText(hours: number | null) {
  return hours === null ? "" : String(hours);
}

export function currentValues(row: SheetRow): SheetValues {
  return row.draft ?? row.verified;
}

export function editableRow(row: SheetRow): EditableRow {
  const values = currentValues(row);
  return {
    applicationId: row.applicationId,
    outcome: sheetOutcome(values.outcome),
    hours: hoursText(values.hours),
    placement: values.placement,
    note: values.note ?? "",
  };
}

export function parseHours(text: string): number | null {
  const trimmed = text.trim().replace(",", ".");
  if (!trimmed) return null;
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(trimmed)) return Number.NaN;
  return Number(trimmed);
}

export function rowProblem(row: EditableRow, kind: VacancyKind): RowProblem | null {
  if (row.outcome === null) return "outcomeRequired";
  if (kind !== "volunteering" || row.outcome !== "attended") return null;
  const hours = parseHours(row.hours);
  if (hours === null) return "hoursRequired";
  if (Number.isNaN(hours) || hours < MIN_HOURS || hours > MAX_HOURS) {
    return "hoursInvalid";
  }
  return null;
}

export function previewXp(
  rules: XpRules,
  kind: VacancyKind,
  row: EditableRow,
): number | null {
  if (row.outcome === null) return null;
  if (row.outcome === "no_show") return 0 - rules.xpNoShowPenalty;
  if (row.outcome !== "attended") return 0;
  if (kind === "volunteering") {
    const hours = parseHours(row.hours);
    return hours === null || Number.isNaN(hours)
      ? null
      : Math.round(hours * rules.xpPerHour);
  }
  if (row.placement === "winner") return rules.xpWinner;
  if (row.placement === "contributor") return rules.xpContributor;
  return rules.xpAttendee;
}

export function toEntry(row: EditableRow, kind: VacancyKind): SheetEntry {
  if (row.outcome === null) return { applicationId: row.applicationId, outcome: null };
  const attended = row.outcome === "attended";
  const hours = parseHours(row.hours);
  return {
    applicationId: row.applicationId,
    outcome: row.outcome,
    hours:
      attended && kind === "volunteering" && hours !== null && !Number.isNaN(hours)
        ? hours
        : null,
    placement:
      attended && kind === "competition" ? (row.placement ?? "attendee") : null,
    note: row.note.trim() ? row.note.trim() : null,
  };
}

function sameRow(left: EditableRow, right: EditableRow) {
  return (
    left.outcome === right.outcome &&
    left.hours.trim() === right.hours.trim() &&
    left.placement === right.placement &&
    left.note.trim() === right.note.trim()
  );
}

export function changedEntries(
  rows: readonly EditableRow[],
  saved: readonly EditableRow[],
  kind: VacancyKind,
): SheetEntry[] {
  return rows.flatMap((row) => {
    const before = saved.find((item) => item.applicationId === row.applicationId);
    return before && sameRow(before, row) ? [] : [toEntry(row, kind)];
  });
}

export type SheetSummary = {
  total: number;
  attended: number;
  excused: number;
  noShow: number;
  cancelled: number;
  undecided: number;
  hours: number;
  xp: number;
  problems: number;
};

export function summarise(
  rows: readonly EditableRow[],
  kind: VacancyKind,
  rules: XpRules,
): SheetSummary {
  const summary: SheetSummary = {
    total: rows.length,
    attended: 0,
    excused: 0,
    noShow: 0,
    cancelled: 0,
    undecided: 0,
    hours: 0,
    xp: 0,
    problems: 0,
  };
  for (const row of rows) {
    if (row.outcome === "attended") summary.attended += 1;
    else if (row.outcome === "excused") summary.excused += 1;
    else if (row.outcome === "no_show") summary.noShow += 1;
    else if (row.outcome === "cancelled") summary.cancelled += 1;
    else summary.undecided += 1;
    if (rowProblem(row, kind)) summary.problems += 1;
    const hours = parseHours(row.hours);
    if (
      row.outcome === "attended" &&
      kind === "volunteering" &&
      hours !== null &&
      !Number.isNaN(hours)
    ) {
      summary.hours += hours;
    }
    summary.xp += previewXp(rules, kind, row) ?? 0;
  }
  summary.hours = Math.round(summary.hours * 100) / 100;
  return summary;
}

export function differsFromVerified(row: SheetRow) {
  if (!row.draft) return false;
  const { verified, draft } = row;
  return (
    verified.outcome !== draft.outcome ||
    verified.hours !== draft.hours ||
    verified.placement !== draft.placement ||
    (verified.note ?? "") !== (draft.note ?? "")
  );
}
