"use client";

import {
  BadgeCheck,
  Flag,
  FlagOff,
  Hourglass,
  PencilLine,
  Trophy,
  Undo2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/portal/avatar";
import { StatusBadge, attendanceStatus } from "@/components/portal/status-badge";
import { AttendanceDesk, type SheetDates } from "@/components/results/attendance-desk";
import { FinishAttendanceDialog } from "@/components/results/finish-attendance-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { compactInputClass } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  requestAttendanceChangesAction,
  verifyAttendanceAction,
} from "@/lib/results/actions";
import type { AttendanceSheet } from "@/lib/results/schemas";
import {
  currentValues,
  differsFromVerified,
  editableRow,
  previewXp,
  summarise,
} from "@/lib/results/sheet";
import { cn } from "@/lib/utils";

export function AdminAttendance({
  vacancyId,
  initial,
  dates,
}: {
  vacancyId: string;
  initial: AttendanceSheet;
  dates: SheetDates;
}) {
  const [adjusting, setAdjusting] = useState(false);
  if (initial.status === "submitted" && !adjusting) {
    return (
      <VerificationDesk
        vacancyId={vacancyId}
        sheet={initial}
        dates={dates}
        onAdjust={() => setAdjusting(true)}
      />
    );
  }
  return (
    <AttendanceDesk
      vacancyId={vacancyId}
      initial={initial}
      dates={dates}
      startEditing={adjusting}
    />
  );
}

function VerificationDesk({
  vacancyId,
  sheet,
  dates,
  onAdjust,
}: {
  vacancyId: string;
  sheet: AttendanceSheet;
  dates: SheetDates;
  onAdjust: () => void;
}) {
  const t = useTranslations("results.verify");
  const sheetCopy = useTranslations("results.sheet");
  const outcomeLabel = useTranslations("attendance.outcome");
  const errors = useTranslations("results.errors");
  const noteId = useId();
  const [flags, setFlags] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      sheet.rows.flatMap((row) =>
        row.reviewNote ? [[row.applicationId, row.reviewNote]] : [],
      ),
    ),
  );
  const [returning, setReturning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rows = useMemo(() => sheet.rows.map(editableRow), [sheet.rows]);
  const summary = useMemo(
    () => summarise(rows, sheet.kind, sheet.rules),
    [rows, sheet.kind, sheet.rules],
  );
  const flagged = Object.entries(flags);
  const flagsComplete = flagged.every(([, text]) => text.trim().length > 0);
  const reason = sheet.history.find(
    (event) => event.action === "correction_submitted",
  )?.note;
  const nameOf = (id: string) => {
    const row = sheet.rows.find((item) => item.applicationId === id);
    return row?.volunteer.displayName?.trim() || row?.volunteer.username || id;
  };
  const placements = {
    winner: rows.filter(
      (row) => row.outcome === "attended" && row.placement === "winner",
    ).length,
    contributor: rows.filter(
      (row) => row.outcome === "attended" && row.placement === "contributor",
    ).length,
  };

  function failure(code: string) {
    return errors.has(code) ? errors(code) : errors("generic");
  }

  function sendBack() {
    setError(null);
    startTransition(async () => {
      const result = await requestAttendanceChangesAction(
        vacancyId,
        note,
        flagged.map(([applicationId, text]) => ({ applicationId, note: text.trim() })),
      );
      if (!result.ok) {
        setError(failure(result.code));
        return;
      }
      setReturning(false);
      toast.success(t("returnedToast"));
    });
  }

  function verify() {
    setError(null);
    startTransition(async () => {
      const result = await verifyAttendanceAction(vacancyId, []);
      if (!result.ok) {
        setError(failure(result.code));
        return;
      }
      setVerifying(false);
      toast.success(t("verifiedToast"));
    });
  }

  return (
    <section aria-labelledby="verify-title" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-primary-muted bg-surface-soft px-5 py-4 sm:flex-row sm:items-start">
        <Hourglass
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-primary-ink"
        />
        <div className="min-w-0 flex-1">
          <p id="verify-title" className="font-semibold text-ink">
            {sheet.correction ? t("titleCorrection") : t("title")}
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {t("submitted", {
              when: dates.submitted ?? "",
              organization: sheet.organization?.name ?? "",
              revision: sheet.revision,
            })}
          </p>
          {sheet.correction && reason ? (
            <p className="mt-2 text-sm text-ink">
              <span className="font-semibold">{t("reason")}</span> “{reason}”
            </p>
          ) : null}
        </div>
      </div>

      <div className="min-w-0 sheet">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-5 py-4">
          <h2 className="text-section text-ink">
            {sheet.kind === "competition"
              ? sheetCopy("titleCompetition", { count: sheet.rows.length })
              : sheetCopy("title", { count: sheet.rows.length })}
          </h2>
          <p className="tabular w-full text-sm text-ink-muted">
            {[
              sheetCopy("summary.attended", { count: summary.attended }),
              sheetCopy("summary.excused", { count: summary.excused }),
              sheetCopy("summary.noShow", { count: summary.noShow }),
              ...(sheet.kind === "volunteering"
                ? [sheetCopy("footer.hours", { hours: summary.hours })]
                : []),
              t("xpTotal", { value: summary.xp }),
            ].join(" · ")}
          </p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{t("caption")}</caption>
            <thead className="hidden bg-surface-sunk/45 text-left text-xs text-ink-muted md:table-header-group">
              <tr className="border-b border-border">
                <th scope="col" className="py-2.5 pr-4 pl-5 font-semibold">
                  {sheet.kind === "competition"
                    ? sheetCopy("columns.participant")
                    : sheetCopy("columns.volunteer")}
                </th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">
                  {sheetCopy("columns.attendance")}
                </th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">
                  {sheet.kind === "competition"
                    ? sheetCopy("columns.placement")
                    : sheetCopy("columns.hours")}
                </th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">
                  {sheetCopy("columns.note")}
                </th>
                <th scope="col" className="py-2.5 pr-4 text-right font-semibold">
                  {t("columns.xp")}
                </th>
                <th scope="col" className="py-2.5 pr-5 text-right font-semibold">
                  <span className="sr-only">{t("columns.flag")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group">
              {sheet.rows.map((row) => {
                const values = currentValues(row);
                const name = nameOf(row.applicationId);
                const flag = flags[row.applicationId];
                const isFlagged = flag !== undefined;
                const changed =
                  differsFromVerified(row) &&
                  row.verified.outcome !== "awaiting_confirmation";
                const chip = attendanceStatus(values.outcome);
                return (
                  <tr
                    key={row.applicationId}
                    className={cn(
                      "grid grid-cols-1 gap-y-2 border-b border-border px-5 py-3 last:border-0 md:table-row md:px-0 md:py-0",
                      isFlagged && "bg-danger-muted/50",
                    )}
                  >
                    <td className="md:py-3 md:pr-4 md:pl-5">
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar
                          name={name}
                          src={row.volunteer.avatarUrl ?? undefined}
                          size="md"
                          person
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink">
                            {name}
                          </span>
                          <span className="block truncate text-xs text-ink-muted">
                            @{row.volunteer.username}
                          </span>
                        </span>
                      </span>
                      {isFlagged ? (
                        <label className="mt-2 block">
                          <span className="sr-only">{t("flagFor", { name })}</span>
                          <input
                            value={flag}
                            maxLength={300}
                            autoFocus={!flag}
                            placeholder={t("flagPlaceholder")}
                            aria-invalid={!flag.trim() || undefined}
                            onChange={(event) =>
                              setFlags((state) => ({
                                ...state,
                                [row.applicationId]: event.target.value,
                              }))
                            }
                            className={cn(
                              compactInputClass,
                              "min-h-9 rounded-lg border-danger/50 text-sm",
                            )}
                          />
                        </label>
                      ) : null}
                    </td>
                    <td className="md:py-3 md:pr-4">
                      {values.outcome === "awaiting_confirmation" ? (
                        <span className="text-ink-muted">
                          {sheetCopy("notRecorded")}
                        </span>
                      ) : (
                        <StatusBadge
                          label={sheetCopy(`outcome.${values.outcome}`)}
                          tone={chip.tone}
                          icon={chip.icon}
                        />
                      )}
                      {changed ? (
                        <span className="mt-1 block text-xs text-ink-muted">
                          {sheetCopy("was", {
                            value:
                              row.verified.outcome === "attended" &&
                              sheet.kind === "volunteering"
                                ? `${outcomeLabel("attended")} · ${row.verified.hours ?? 0} h`
                                : row.verified.placement
                                  ? sheetCopy(`placement.${row.verified.placement}`)
                                  : outcomeLabel(row.verified.outcome),
                          })}
                        </span>
                      ) : null}
                    </td>
                    <td className="tabular md:py-3 md:pr-4">
                      {values.outcome !== "attended" ? (
                        <span className="text-ink-muted">—</span>
                      ) : sheet.kind === "volunteering" ? (
                        sheetCopy("hoursValue", { hours: values.hours ?? 0 })
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-semibold">
                          {values.placement === "winner" ? (
                            <Trophy
                              aria-hidden="true"
                              className="size-4 text-accent-ink"
                            />
                          ) : null}
                          {sheetCopy(`placement.${values.placement ?? "attendee"}`)}
                        </span>
                      )}
                    </td>
                    <td className="text-ink-muted md:py-3 md:pr-4">
                      {values.note ?? "—"}
                    </td>
                    <td className="tabular font-semibold md:py-3 md:pr-4 md:text-right">
                      {(() => {
                        const xp = previewXp(sheet.rules, sheet.kind, editableRow(row));
                        return (
                          <span
                            className={
                              xp === null || xp === 0
                                ? "text-ink-muted"
                                : xp > 0
                                  ? "text-primary-ink"
                                  : "text-danger-ink"
                            }
                          >
                            {xp === null
                              ? "—"
                              : sheetCopy("xp", {
                                  value:
                                    xp > 0
                                      ? `+${xp}`
                                      : xp < 0
                                        ? `−${Math.abs(xp)}`
                                        : "0",
                                })}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="md:py-3 md:pr-5 md:text-right">
                      <Button
                        type="button"
                        variant={isFlagged ? "danger-outline" : "ghost"}
                        size="row"
                        aria-pressed={isFlagged}
                        onClick={() =>
                          setFlags((state) => {
                            const next = { ...state };
                            if (isFlagged) delete next[row.applicationId];
                            else next[row.applicationId] = "";
                            return next;
                          })
                        }
                      >
                        {isFlagged ? (
                          <FlagOff aria-hidden="true" />
                        ) : (
                          <Flag aria-hidden="true" />
                        )}
                        {isFlagged ? t("unflag") : t("flag")}
                        <span className="sr-only"> — {name}</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sticky bottom-3 z-20">
        <div className="flex flex-col gap-3 rounded-xl border border-primary-ink/25 bg-surface-raised px-5 py-3 shadow-raised lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-ink-muted">
            <span className="font-semibold text-ink">
              {flagged.length > 0
                ? t("flagged", { count: flagged.length })
                : t("noneFlagged")}
            </span>
            <span className="mt-0.5 block text-xs">{t("help")}</span>
          </p>
          <span className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onAdjust}>
              <PencilLine aria-hidden="true" />
              {t("adjust")}
            </Button>
            <Button
              type="button"
              variant="danger-outline"
              size="sm"
              onClick={() => {
                setError(null);
                setReturning(true);
              }}
            >
              <Undo2 aria-hidden="true" />
              {t("requestChanges")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={flagged.length > 0}
              title={flagged.length > 0 ? t("unflagFirst") : undefined}
              onClick={() => {
                setError(null);
                setVerifying(true);
              }}
            >
              <BadgeCheck aria-hidden="true" />
              {t("verify")}
            </Button>
          </span>
        </div>
      </div>

      <Dialog open={returning} onOpenChange={(next) => !pending && setReturning(next)}>
        <DialogContent size="sm" closeLabel={t("close")} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("returnTitle")}</DialogTitle>
            <DialogDescription className="text-sm text-ink-muted">
              {t("returnDescription", { organization: sheet.organization?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <div>
              <label htmlFor={noteId} className="text-sm font-semibold text-ink">
                {t("note")}
              </label>
              <Textarea
                id={noteId}
                value={note}
                maxLength={2000}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t("notePlaceholder")}
                className="mt-1.5 min-h-24 text-sm"
              />
            </div>
            {flagged.length > 0 ? (
              <div>
                <p className="text-sm font-semibold text-ink">
                  {t("flaggedRows", { count: flagged.length })}
                </p>
                <ul className="mt-1.5 flex flex-col gap-1 text-sm">
                  {flagged.map(([id, text]) => (
                    <li key={id} className="text-ink-muted">
                      <span className="font-semibold text-ink">{nameOf(id)}:</span>{" "}
                      {text.trim() || (
                        <span className="text-danger-ink">{t("flagMissing")}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">{t("noFlagsHint")}</p>
            )}
            {error ? (
              <p role="alert" className="text-sm font-semibold text-danger-ink">
                {error}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => setReturning(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={pending || !note.trim() || !flagsComplete}
              onClick={sendBack}
            >
              <Undo2 aria-hidden="true" />
              {pending ? t("working") : t("returnConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FinishAttendanceDialog
        open={verifying}
        onOpenChange={setVerifying}
        summary={summary}
        kind={sheet.kind}
        penalty={sheet.rules.xpNoShowPenalty}
        placements={placements}
        problems={[]}
        verification={false}
        correction={false}
        pending={pending}
        error={error}
        onConfirm={verify}
      />
    </section>
  );
}
