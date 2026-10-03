"use client";

import {
  BadgeCheck,
  CalendarCheck,
  CalendarMinus,
  Clock,
  Eraser,
  FileText,
  History,
  Hourglass,
  Info,
  PencilLine,
  Send,
  TriangleAlert,
  Trophy,
  Undo2,
  UserX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/portal/avatar";
import { StatusBadge, attendanceStatus } from "@/components/portal/status-badge";
import {
  FinishAttendanceDialog,
  type DialogProblem,
} from "@/components/results/finish-attendance-dialog";
import { Button } from "@/components/ui/button";
import { compactInputClass } from "@/components/ui/input";
import {
  PLACEMENTS,
  RESOLVABLE_ATTENDANCE_OUTCOMES,
  type Placement,
  type SheetOutcome,
} from "@/lib/domain/vocabulary";
import {
  discardAttendanceDraftAction,
  finishAttendanceAction,
  saveAttendanceDraftAction,
} from "@/lib/results/actions";
import type { AttendanceSheet, SheetRow } from "@/lib/results/schemas";
import {
  changedEntries,
  currentValues,
  differsFromVerified,
  editableRow,
  previewXp,
  rowProblem,
  summarise,
  type EditableRow,
} from "@/lib/results/sheet";
import { cn } from "@/lib/utils";

export type SheetDates = {
  opens: string;
  submittable: string;
  submitted: string | null;
  reviewed: string | null;
  verified: string | null;
  events: Record<string, string>;
};

function xpText(value: number | null) {
  if (value === null) return "—";
  return value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : "0";
}

function XpFigure({ value, muted }: { value: number | null; muted?: boolean }) {
  const t = useTranslations("results.sheet");
  return (
    <span
      className={cn(
        "tabular font-semibold whitespace-nowrap",
        value === null || value === 0 || muted
          ? "text-ink-muted"
          : value > 0
            ? "text-primary-ink"
            : "text-danger-ink",
      )}
    >
      {value === null ? "—" : t("xp", { value: xpText(value) })}
    </span>
  );
}

export function AttendanceDesk({
  vacancyId,
  initial,
  dates,
  startEditing = false,
}: {
  vacancyId: string;
  initial: AttendanceSheet;
  dates: SheetDates;
  startEditing?: boolean;
}) {
  const t = useTranslations("results.sheet");
  const outcomeLabel = useTranslations("attendance.outcome");
  const errors = useTranslations("results.errors");
  const [view, setView] = useState(initial);
  const kind = view.kind;
  const verification = view.requiresVerification;
  const startsEditing =
    (startEditing && view.editable) ||
    (view.editable &&
      view.rows.length > 0 &&
      (view.status === "draft" ||
        view.status === "changes_requested" ||
        (!verification && view.status !== "verified" && view.status !== "submitted")));
  const [editing, setEditing] = useState(startsEditing);
  const [saved, setSaved] = useState(() => view.rows.map(editableRow));
  const [rows, setRows] = useState(saved);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [bulkHours, setBulkHours] = useState(
    view.estimatedTotalHours === null ? "" : String(view.estimatedTotalHours),
  );
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pending, startTransition] = useTransition();

  const changes = useMemo(() => changedEntries(rows, saved, kind), [rows, saved, kind]);
  const dirty = changes.length > 0;
  const summary = useMemo(
    () => summarise(rows, kind, view.rules),
    [rows, kind, view.rules],
  );
  const byId = useMemo(
    () => new Map(view.rows.map((row) => [row.applicationId, row])),
    [view.rows],
  );
  const nameOf = (row: SheetRow | undefined) =>
    row?.volunteer.displayName?.trim() || row?.volunteer.username || "—";
  const problems: DialogProblem[] = rows.flatMap((row) => {
    const problem = rowProblem(row, kind);
    return problem ? [{ name: nameOf(byId.get(row.applicationId)), problem }] : [];
  });
  const placements = {
    winner: rows.filter(
      (row) => row.outcome === "attended" && row.placement === "winner",
    ).length,
    contributor: rows.filter(
      (row) => row.outcome === "attended" && row.placement === "contributor",
    ).length,
  };

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function adopt(next: AttendanceSheet) {
    const fresh = next.rows.map(editableRow);
    setView(next);
    setSaved(fresh);
    setRows(fresh);
  }

  function update(ids: readonly string[], change: (row: EditableRow) => EditableRow) {
    setRows((state) =>
      state.map((row) => (ids.includes(row.applicationId) ? change(row) : row)),
    );
  }

  function setOutcome(ids: readonly string[], outcome: SheetOutcome | null) {
    update(ids, (row) => ({
      ...row,
      outcome,
      hours:
        outcome === "attended" && kind === "volunteering" && !row.hours.trim()
          ? view.estimatedTotalHours === null
            ? ""
            : String(view.estimatedTotalHours)
          : row.hours,
      placement:
        outcome === "attended" && kind === "competition"
          ? (row.placement ?? "attendee")
          : row.placement,
    }));
  }

  function failure(code: string) {
    return errors.has(code) ? errors(code) : errors("generic");
  }

  function save() {
    startTransition(async () => {
      const result = await saveAttendanceDraftAction(vacancyId, changes);
      if (!result.ok) {
        toast.error(failure(result.code));
        return;
      }
      adopt(result.data);
      toast.success(t("savedToast"));
    });
  }

  function discard() {
    startTransition(async () => {
      const result = await discardAttendanceDraftAction(vacancyId);
      if (!result.ok) {
        toast.error(failure(result.code));
        return;
      }
      adopt(result.data);
      setEditing(false);
      toast.success(t("discardedToast"));
    });
  }

  function finish(note: string) {
    setFinishError(null);
    startTransition(async () => {
      const result = await finishAttendanceAction(vacancyId, { entries: changes, note });
      if (!result.ok) {
        if (result.code === "attendanceIncomplete" && result.problems?.length) {
          setFinishError(
            t("incompleteNames", {
              names: result.problems
                .map((item) => nameOf(byId.get(item.applicationId)))
                .join(", "),
            }),
          );
          return;
        }
        setFinishError(failure(result.code));
        return;
      }
      adopt(result.data);
      setEditing(false);
      setFinishing(false);
      setSelected(new Set());
      toast.success(verification ? t("submittedToast") : t("appliedToast"));
    });
  }

  const correction = view.correction || (view.status === "verified" && editing);
  const chosen = rows.filter((row) => selected.has(row.applicationId));
  const allChosen = rows.length > 0 && chosen.length === rows.length;
  const verifiedRows = view.rows.filter((row) => row.verified.outcome === "attended");
  const verifiedHours = view.rows.reduce(
    (total, row) =>
      total + (row.verified.outcome === "attended" ? (row.verified.hours ?? 0) : 0),
    0,
  );

  const statusChip = {
    draft: { icon: FileText, tone: "draft" as const },
    submitted: { icon: Hourglass, tone: "waiting" as const },
    changes_requested: { icon: Undo2, tone: "returned" as const },
    verified: { icon: BadgeCheck, tone: "live" as const },
  }[view.status];

  if (view.rows.length === 0) {
    return (
      <section className="sheet px-5 py-12 text-center">
        <p className="text-section text-ink">{t("empty.title")}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
          {t("empty.description")}
        </p>
      </section>
    );
  }

  if (!view.started) {
    return (
      <section className="sheet px-5 py-12 text-center">
        <p className="text-section text-ink">{t("notOpen.title")}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
          {t("notOpen.description", { when: dates.opens, count: view.rows.length })}
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="sheet-title" className="flex min-w-0 flex-col gap-4">
      {view.status === "changes_requested" ? (
        <div className="flex flex-col gap-3 rounded-xl border border-accent/40 bg-surface px-5 py-4 sm:flex-row sm:items-start">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-knockout"
          >
            <Undo2 className="size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">
              {view.reviewNote ?? t("returned.title")}
            </p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {verification
                ? t("returned.org", { when: dates.reviewed ?? "" })
                : t("returned.admin", { when: dates.reviewed ?? "" })}
            </p>
          </div>
          {view.history.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="row"
              onClick={() => setShowHistory((state) => !state)}
            >
              <History aria-hidden="true" />
              {t("history.toggle")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {view.status === "submitted" ? (
        <div className="flex flex-col gap-3 rounded-xl border border-primary-muted bg-surface-soft px-5 py-4 sm:flex-row sm:items-center">
          <Hourglass aria-hidden="true" className="size-5 shrink-0 text-primary-ink" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">{t("awaiting.title")}</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {t("awaiting.description", { when: dates.submitted ?? "" })}
            </p>
          </div>
        </div>
      ) : null}

      {view.status === "verified" && !editing ? (
        <div className="flex flex-col gap-3 rounded-xl border border-primary-ink/25 bg-surface px-5 py-4 lg:flex-row lg:items-center">
          <BadgeCheck aria-hidden="true" className="size-6 shrink-0 text-primary-ink" />
          <div className="min-w-0 flex-1">
            <p className="tabular font-semibold text-ink">
              {[
                t("verified.title"),
                t("verified.attended", { count: verifiedRows.length }),
                ...(kind === "volunteering"
                  ? [
                      t("verified.hours", {
                        hours: Math.round(verifiedHours * 100) / 100,
                      }),
                    ]
                  : []),
              ].join(" · ")}
            </p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {dates.verified
                ? t("verified.description", { when: dates.verified })
                : t("verified.applied")}
            </p>
          </div>
          {view.editable ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <PencilLine aria-hidden="true" />
              {verification ? t("verified.correct") : t("verified.edit")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {correction && editing ? (
        <div className="flex flex-col gap-3 rounded-xl border border-primary-muted bg-surface-soft px-5 py-4 sm:flex-row sm:items-center">
          <Info aria-hidden="true" className="size-5 shrink-0 text-primary-ink" />
          <p className="min-w-0 flex-1 text-sm text-primary-ink">
            {verification ? t("correction.org") : t("correction.admin")}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="row"
            disabled={pending}
            onClick={() => {
              if (view.correction) discard();
              else {
                setRows(saved);
                setEditing(false);
              }
            }}
          >
            {t("correction.cancel")}
          </Button>
        </div>
      ) : null}

      <div className="min-w-0 sheet">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-5 py-4">
          <h2 id="sheet-title" className="text-section text-ink">
            {kind === "competition"
              ? t("titleCompetition", { count: view.rows.length })
              : t("title", { count: view.rows.length })}
          </h2>
          <StatusBadge
            label={t(
              `status.${view.correction && view.status === "draft" ? "correction" : view.status}`,
            )}
            tone={statusChip.tone}
            icon={statusChip.icon}
          />
          <p className="tabular w-full text-sm text-ink-muted">
            {editing
              ? [
                  t("summary.attended", { count: summary.attended }),
                  t("summary.excused", { count: summary.excused }),
                  t("summary.noShow", { count: summary.noShow }),
                  ...(summary.undecided > 0
                    ? [t("summary.undecided", { count: summary.undecided })]
                    : []),
                ].join(" · ")
              : view.status === "verified"
                ? t("lead.verified")
                : verification
                  ? t("lead.org")
                  : t("lead.admin")}
          </p>
        </header>

        {editing && chosen.length > 0 ? (
          <div
            role="toolbar"
            aria-label={t("bulk.label")}
            className="bar-rise flex flex-wrap items-center gap-2 border-b border-border bg-surface-soft px-5 py-2.5"
          >
            <span className="tabular mr-2 text-sm font-semibold text-primary-ink">
              {t("bulk.selected", { count: chosen.length })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="row"
              onClick={() => setOutcome([...selected], "attended")}
            >
              <CalendarCheck aria-hidden="true" />
              {t("bulk.attended")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="row"
              onClick={() => setOutcome([...selected], "excused")}
            >
              <CalendarMinus aria-hidden="true" />
              {t("bulk.excused")}
            </Button>
            <Button
              type="button"
              variant="danger-outline"
              size="row"
              onClick={() => setOutcome([...selected], "no_show")}
            >
              <UserX aria-hidden="true" />
              {t("bulk.noShow")}
            </Button>
            {kind === "volunteering" ? (
              <span className="inline-flex items-center gap-1.5">
                <label className="sr-only" htmlFor="bulk-hours">
                  {t("bulk.hoursLabel")}
                </label>
                <input
                  id="bulk-hours"
                  inputMode="decimal"
                  value={bulkHours}
                  onChange={(event) => setBulkHours(event.target.value)}
                  placeholder={t("bulk.hoursPlaceholder")}
                  className={cn(compactInputClass, "min-h-9 w-20 text-center")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="row"
                  disabled={!bulkHours.trim()}
                  onClick={() =>
                    update([...selected], (row) => ({
                      ...row,
                      outcome: "attended",
                      hours: bulkHours.trim(),
                    }))
                  }
                >
                  <Clock aria-hidden="true" />
                  {t("bulk.setHours")}
                </Button>
              </span>
            ) : (
              <select
                aria-label={t("bulk.placementLabel")}
                value=""
                onChange={(event) => {
                  const placement = event.target.value as Placement;
                  if (!placement) return;
                  update([...selected], (row) => ({
                    ...row,
                    outcome: "attended",
                    placement,
                  }));
                }}
                className={cn(
                  compactInputClass,
                  "min-h-9 w-auto appearance-none pr-4 font-semibold",
                )}
              >
                <option value="">{t("bulk.placement")}</option>
                {PLACEMENTS.map((placement) => (
                  <option key={placement} value={placement}>
                    {t(`placement.${placement}`)}
                  </option>
                ))}
              </select>
            )}
            <Button
              type="button"
              variant="ghost"
              size="row"
              onClick={() => setOutcome([...selected], null)}
            >
              <Eraser aria-hidden="true" />
              {t("bulk.clear")}
            </Button>
          </div>
        ) : null}

        {editing ? (
          <label className="flex min-h-11 items-center gap-3 border-b border-border px-5 text-sm font-semibold text-ink md:hidden">
            <input
              type="checkbox"
              checked={allChosen}
              onChange={(event) =>
                setSelected(
                  event.target.checked
                    ? new Set(rows.map((row) => row.applicationId))
                    : new Set(),
                )
              }
              className="size-4 accent-action"
            />
            {t("selectAll")}
          </label>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{t("caption")}</caption>
            <thead className="hidden bg-surface-sunk/45 text-left text-xs text-ink-muted md:table-header-group">
              <tr className="border-b border-border">
                {editing ? (
                  <th scope="col" className="w-12 py-2.5 pl-5">
                    <input
                      type="checkbox"
                      aria-label={t("selectAll")}
                      checked={allChosen}
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? new Set(rows.map((row) => row.applicationId))
                            : new Set(),
                        )
                      }
                      className="size-4 accent-action"
                    />
                  </th>
                ) : null}
                <th
                  scope="col"
                  className={cn("py-2.5 pr-4 font-semibold", !editing && "pl-5")}
                >
                  {kind === "competition"
                    ? t("columns.participant")
                    : t("columns.volunteer")}
                </th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">
                  {t("columns.attendance")}
                </th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">
                  {kind === "competition" ? t("columns.placement") : t("columns.hours")}
                </th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">
                  {t("columns.note")}
                </th>
                <th scope="col" className="py-2.5 pr-5 text-right font-semibold">
                  {editing || view.status !== "verified"
                    ? t("columns.xpPreview")
                    : t("columns.xp")}
                </th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group">
              {rows.map((row) => {
                const source = byId.get(row.applicationId)!;
                const name = nameOf(source);
                const problem = editing ? rowProblem(row, kind) : null;
                const flagged = source.reviewNote;
                const attended = row.outcome === "attended";
                const shown = editing ? row : editableRow(source);
                const values = currentValues(source);
                const xp =
                  !editing && view.status === "verified" && !source.draft
                    ? source.verified.xpAwarded
                    : previewXp(view.rules, kind, shown);
                const changedFromVerified =
                  view.status !== "draft" || view.correction
                    ? differsFromVerified(source) &&
                      source.verified.outcome !== "awaiting_confirmation"
                    : false;
                return (
                  <tr
                    key={row.applicationId}
                    data-flagged={flagged ? true : undefined}
                    className={cn(
                      "grid grid-cols-[2.75rem_minmax(0,1fr)] gap-y-2 border-b border-border py-3 last:border-0 md:table-row md:py-0",
                      !editing && "grid-cols-1 px-5 md:px-0",
                      flagged && "bg-danger-muted/50",
                    )}
                  >
                    {editing ? (
                      <td className="row-span-5 pl-5 md:py-3">
                        <input
                          type="checkbox"
                          aria-label={t("select", { name })}
                          checked={selected.has(row.applicationId)}
                          onChange={(event) => {
                            const next = new Set(selected);
                            if (event.target.checked) next.add(row.applicationId);
                            else next.delete(row.applicationId);
                            setSelected(next);
                          }}
                          className="mt-2.5 size-4 accent-action md:mt-0"
                        />
                      </td>
                    ) : null}
                    <td className={cn("pr-5 md:py-3 md:pr-4", !editing && "md:pl-5")}>
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar
                          name={name}
                          src={source.volunteer.avatarUrl ?? undefined}
                          size="md"
                          person
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink">
                            {name}
                          </span>
                          <span className="block truncate text-xs text-ink-muted">
                            @{source.volunteer.username}
                          </span>
                        </span>
                      </span>
                      {flagged ? (
                        <p className="mt-1.5 flex gap-1.5 text-xs font-semibold text-danger-ink">
                          <TriangleAlert
                            aria-hidden="true"
                            className="mt-px size-3.5 shrink-0"
                          />
                          {flagged}
                        </p>
                      ) : null}
                    </td>
                    <td className="col-start-2 pr-5 md:py-3 md:pr-4">
                      {editing ? (
                        <select
                          aria-label={t("outcomeFor", { name })}
                          aria-invalid={problem === "outcomeRequired" || undefined}
                          value={row.outcome ?? ""}
                          onChange={(event) =>
                            setOutcome(
                              [row.applicationId],
                              (event.target.value || null) as SheetOutcome | null,
                            )
                          }
                          className={cn(
                            compactInputClass,
                            "min-h-9 appearance-none pr-4 font-semibold md:w-48",
                            row.outcome === "no_show" &&
                              "border-danger/50 text-danger-ink",
                            row.outcome === null && "text-ink-muted",
                          )}
                        >
                          <option value="">{t("notRecorded")}</option>
                          {RESOLVABLE_ATTENDANCE_OUTCOMES.map((outcome) => (
                            <option key={outcome} value={outcome}>
                              {t(`outcome.${outcome}`)}
                            </option>
                          ))}
                          {row.outcome === "cancelled" ? (
                            <option value="cancelled">
                              {outcomeLabel("cancelled")}
                            </option>
                          ) : null}
                        </select>
                      ) : values.outcome === "awaiting_confirmation" ? (
                        <span className="text-ink-muted">{t("notRecorded")}</span>
                      ) : (
                        <StatusBadge
                          label={t(
                            `outcome.${values.outcome === "cancelled" ? "cancelled" : values.outcome}`,
                          )}
                          tone={attendanceStatus(values.outcome).tone}
                          icon={attendanceStatus(values.outcome).icon}
                        />
                      )}
                      {changedFromVerified ? (
                        <span className="mt-1 block text-xs text-ink-muted">
                          {t("was", {
                            value:
                              source.verified.outcome === "attended" &&
                              kind === "volunteering"
                                ? `${outcomeLabel("attended")} · ${source.verified.hours ?? 0} h`
                                : source.verified.placement
                                  ? t(`placement.${source.verified.placement}`)
                                  : outcomeLabel(source.verified.outcome),
                          })}
                        </span>
                      ) : null}
                    </td>
                    <td className="col-start-2 pr-5 md:py-3 md:pr-4">
                      {kind === "volunteering" ? (
                        editing ? (
                          <label className="inline-flex items-center gap-2">
                            <span className="sr-only">{t("hoursFor", { name })}</span>
                            <input
                              inputMode="decimal"
                              value={attended ? row.hours : ""}
                              disabled={!attended}
                              aria-invalid={
                                problem === "hoursRequired" ||
                                problem === "hoursInvalid"
                                  ? true
                                  : undefined
                              }
                              placeholder={attended ? t("hoursPlaceholder") : "—"}
                              onChange={(event) =>
                                update([row.applicationId], (item) => ({
                                  ...item,
                                  hours: event.target.value,
                                }))
                              }
                              className={cn(
                                compactInputClass,
                                "min-h-9 w-24 rounded-lg text-center disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:bg-danger-muted",
                              )}
                            />
                            <span className="text-xs text-ink-muted">
                              {t("hoursUnit")}
                            </span>
                          </label>
                        ) : (
                          <span className="tabular text-ink">
                            {values.outcome === "attended" && values.hours !== null
                              ? t("hoursValue", { hours: values.hours })
                              : "—"}
                          </span>
                        )
                      ) : editing ? (
                        <select
                          aria-label={t("placementFor", { name })}
                          value={attended ? (row.placement ?? "attendee") : ""}
                          disabled={!attended}
                          onChange={(event) =>
                            update([row.applicationId], (item) => ({
                              ...item,
                              placement: event.target.value as Placement,
                            }))
                          }
                          className={cn(
                            compactInputClass,
                            "min-h-9 appearance-none pr-4 font-semibold disabled:cursor-not-allowed disabled:opacity-50 md:w-40",
                          )}
                        >
                          {attended ? null : <option value="">—</option>}
                          {PLACEMENTS.map((placement) => (
                            <option key={placement} value={placement}>
                              {t(`placement.${placement}`)}
                            </option>
                          ))}
                        </select>
                      ) : values.outcome === "attended" ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                          {values.placement === "winner" ? (
                            <Trophy
                              aria-hidden="true"
                              className="size-4 text-accent-ink"
                            />
                          ) : null}
                          {t(`placement.${values.placement ?? "attendee"}`)}
                        </span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                      {problem === "hoursRequired" || problem === "hoursInvalid" ? (
                        <span className="mt-1 block text-xs font-semibold text-danger-ink">
                          {t(`problem.${problem}`)}
                        </span>
                      ) : null}
                    </td>
                    <td className="col-start-2 pr-5 md:py-3 md:pr-4">
                      {editing ? (
                        <>
                          <label
                            className="sr-only"
                            htmlFor={`note-${row.applicationId}`}
                          >
                            {t("noteFor", { name })}
                          </label>
                          <input
                            id={`note-${row.applicationId}`}
                            value={row.note}
                            maxLength={300}
                            placeholder={t("notePlaceholder")}
                            onChange={(event) =>
                              update([row.applicationId], (item) => ({
                                ...item,
                                note: event.target.value,
                              }))
                            }
                            className={cn(
                              compactInputClass,
                              "min-h-9 rounded-lg md:w-52",
                            )}
                          />
                        </>
                      ) : (
                        <span className="text-ink-muted">{values.note ?? "—"}</span>
                      )}
                    </td>
                    <td className="col-start-2 pr-5 md:py-3 md:text-right">
                      <XpFigure value={xp} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {view.history.length > 0 ? (
          <div className="border-t border-border px-5 py-3">
            <button
              type="button"
              aria-expanded={showHistory}
              onClick={() => setShowHistory((state) => !state)}
              className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-primary-ink hover:underline"
            >
              <History aria-hidden="true" className="size-4" />
              {t("history.title", { count: view.history.length })}
            </button>
            {showHistory ? (
              <ol className="mt-2 flex flex-col gap-3 border-l border-border pl-4">
                {view.history.map((event) => (
                  <li key={event.id} className="text-sm">
                    <p className="text-ink">
                      <span className="font-semibold">
                        {t.has(`history.actions.${event.action}`)
                          ? t(`history.actions.${event.action}`)
                          : event.action}
                      </span>
                      <span className="text-ink-muted">
                        {" · "}
                        {dates.events[event.id] ?? ""}
                        {event.actor ? ` · ${event.actor.name}` : ""}
                      </span>
                    </p>
                    {event.note ? (
                      <p className="mt-0.5 text-ink-muted italic">“{event.note}”</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        ) : null}
      </div>

      {editing ? (
        <div className="sticky bottom-3 z-20">
          <div className="flex flex-col gap-3 rounded-xl border border-primary-ink/25 bg-surface-raised px-5 py-3 shadow-raised sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-muted">
              <span className="tabular font-semibold text-ink">
                {[
                  t("footer.ready", { count: summary.total - summary.undecided }),
                  ...(summary.undecided > 0
                    ? [t("footer.pending", { count: summary.undecided })]
                    : []),
                  ...(kind === "volunteering"
                    ? [t("footer.hours", { hours: summary.hours })]
                    : []),
                ].join(" · ")}
              </span>
              <span className="mt-0.5 block text-xs">
                {!view.ended
                  ? t("footer.notEnded", { when: dates.submittable })
                  : dirty
                    ? t("footer.unsaved", { count: changes.length })
                    : t("footer.saved")}
              </span>
            </p>
            <span className="flex flex-wrap gap-2">
              {view.status === "submitted" ? null : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!dirty || pending}
                  onClick={save}
                >
                  <FileText aria-hidden="true" />
                  {t("footer.save")}
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                disabled={!view.ended || pending}
                onClick={() => {
                  setFinishError(null);
                  setFinishing(true);
                }}
              >
                <Send aria-hidden="true" />
                {verification ? t("footer.submit") : t("footer.apply")}
              </Button>
            </span>
          </div>
        </div>
      ) : null}

      <FinishAttendanceDialog
        open={finishing}
        onOpenChange={setFinishing}
        summary={summary}
        kind={kind}
        penalty={view.rules.xpNoShowPenalty}
        placements={placements}
        problems={problems}
        verification={verification}
        correction={verification && correction}
        pending={pending}
        error={finishError}
        onConfirm={finish}
      />
    </section>
  );
}
