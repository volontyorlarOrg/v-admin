"use client";

import {
  CalendarCheck,
  CalendarMinus,
  Clock,
  Info,
  Send,
  Trophy,
  TriangleAlert,
  UserX,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import type { VacancyKind } from "@/lib/domain/vocabulary";
import type { RowProblem, SheetSummary } from "@/lib/results/sheet";
import { cn } from "@/lib/utils";

export type DialogProblem = { name: string; problem: RowProblem };

export function FinishAttendanceDialog({
  open,
  onOpenChange,
  summary,
  kind,
  penalty,
  placements,
  problems,
  verification,
  correction,
  pending,
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: SheetSummary;
  kind: VacancyKind;
  penalty: number;
  placements: { winner: number; contributor: number };
  problems: readonly DialogProblem[];
  verification: boolean;
  correction: boolean;
  pending: boolean;
  error: string | null;
  onConfirm: (note: string) => void;
}) {
  const t = useTranslations("results.finish");
  const noteId = useId();
  const [note, setNote] = useState("");
  const blocked = problems.length > 0 || (correction && !note.trim());

  const lines = [
    {
      key: "recorded",
      icon: Users,
      count: summary.total - summary.undecided,
      tone: "",
    },
    {
      key: "attended",
      icon: CalendarCheck,
      count: summary.attended,
      tone: "text-primary-ink",
    },
    {
      key: "excused",
      icon: CalendarMinus,
      count: summary.excused,
      tone: "text-ink-muted",
    },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent size="sm" closeLabel={t("close")} className="sm:max-w-md">
        <DialogHeader>
          <span
            aria-hidden="true"
            className="mb-1 grid size-10 place-items-center rounded-full bg-surface-soft text-primary-ink"
          >
            <Send className="size-4.5" />
          </span>
          <DialogTitle>
            {verification
              ? correction
                ? t("titleCorrection")
                : t("titleSubmit")
              : t("titleApply")}
          </DialogTitle>
          <DialogDescription className="text-sm text-ink-muted">
            {verification ? t("descriptionSubmit") : t("descriptionApply")}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {lines.map(({ key, icon: Icon, count, tone }) => (
              <li key={key} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <Icon
                  aria-hidden="true"
                  className={cn("size-4.5 text-ink-muted", tone)}
                />
                <span className="text-ink">{t(key, { count })}</span>
              </li>
            ))}
            {summary.noShow > 0 ? (
              <li className="flex items-start gap-3 bg-danger-muted px-4 py-2.5 text-sm">
                <UserX aria-hidden="true" className="mt-0.5 size-4.5 text-danger-ink" />
                <span>
                  <span className="font-semibold text-danger-ink">
                    {t("noShow", { count: summary.noShow })}
                  </span>
                  <span className="block text-xs text-danger-ink">
                    {t("noShowEffect", { penalty })}
                  </span>
                </span>
              </li>
            ) : null}
            {kind === "volunteering" ? (
              <li className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <Clock aria-hidden="true" className="size-4.5 text-ink-muted" />
                <span className="tabular text-ink">
                  {t("hours", { hours: summary.hours })}
                </span>
              </li>
            ) : (
              <li className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <Trophy aria-hidden="true" className="size-4.5 text-accent-ink" />
                <span className="text-ink">{t("placements", placements)}</span>
              </li>
            )}
          </ul>

          {problems.length > 0 ? (
            <div
              role="alert"
              className="rounded-lg border border-danger/40 bg-danger-muted px-4 py-3"
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-danger-ink">
                <TriangleAlert aria-hidden="true" className="size-4" />
                {t("issues", { count: problems.length })}
              </p>
              <ul className="mt-1.5 list-disc pl-6 text-sm text-danger-ink">
                {problems.slice(0, 6).map((item) => (
                  <li key={item.name}>
                    {t(`problem.${item.problem}`, { name: item.name })}
                  </li>
                ))}
                {problems.length > 6 ? (
                  <li>{t("moreIssues", { count: problems.length - 6 })}</li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {correction ? (
            <div>
              <label htmlFor={noteId} className="text-sm font-semibold text-ink">
                {t("reason")}
              </label>
              <Textarea
                id={noteId}
                value={note}
                maxLength={2000}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t("reasonPlaceholder")}
                className="mt-1.5 min-h-24 text-sm"
              />
              <p className="mt-1 text-xs text-ink-muted">{t("reasonHelp")}</p>
            </div>
          ) : null}

          <p className="flex gap-2.5 rounded-lg bg-surface-soft px-3.5 py-3 text-sm leading-relaxed text-primary-ink">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {verification ? t("verifyNote") : t("applyNote")}
          </p>
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
            onClick={() => onOpenChange(false)}
          >
            {t("back")}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending || blocked}
            onClick={() => onConfirm(note)}
          >
            <Send aria-hidden="true" />
            {pending
              ? t("working")
              : verification
                ? t("confirmSubmit")
                : t("confirmApply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
