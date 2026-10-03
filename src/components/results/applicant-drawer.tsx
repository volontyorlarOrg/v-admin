"use client";

import { ArrowLeft, ArrowRight, ChevronDown, Mail, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Avatar } from "@/components/portal/avatar";
import { StatusBadge, applicationStatus } from "@/components/portal/status-badge";
import { DecisionSelect } from "@/components/results/decision-select";
import { Button, buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { StagedDecision } from "@/lib/domain/vocabulary";
import type { DeskApplicant } from "@/lib/results/desk";
import { cn } from "@/lib/utils";

export function ApplicantDrawer({
  applicant,
  decision,
  decidable,
  position,
  onDecide,
  onPrevious,
  onNext,
  onClose,
}: {
  applicant: DeskApplicant | null;
  decision: StagedDecision | null;
  decidable: boolean;
  position: { index: number; total: number };
  onDecide: (decision: StagedDecision | null) => void;
  onPrevious: (() => void) | null;
  onNext: (() => void) | null;
  onClose: () => void;
}) {
  const t = useTranslations("results.drawer");
  const status = useTranslations("applications.status");
  const chip = applicant ? applicationStatus(applicant.status) : null;

  return (
    <DialogPrimitive.Root
      open={applicant !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-shell/40" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="drawer-panel fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-surface-raised text-ink shadow-raised outline-none sm:inset-y-2 sm:right-2 sm:rounded-2xl sm:border"
          onKeyDown={(event) => {
            if (event.target instanceof HTMLSelectElement) return;
            if (event.key === "ArrowRight" && onNext) onNext();
            if (event.key === "ArrowLeft" && onPrevious) onPrevious();
          }}
        >
          {applicant ? (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <DialogPrimitive.Title className="text-section text-ink">
                  {t("title")}
                </DialogPrimitive.Title>
                <span className="tabular ml-auto text-xs text-ink-muted">
                  {t("position", {
                    index: position.index + 1,
                    total: position.total,
                  })}
                </span>
                <DialogPrimitive.Close className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink">
                  <X aria-hidden="true" className="size-4" />
                  <span className="sr-only">{t("close")}</span>
                </DialogPrimitive.Close>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={applicant.name}
                    src={applicant.avatarUrl ?? undefined}
                    size="lg"
                    person
                  />
                  <div className="min-w-0">
                    <p className="display-face truncate text-2xl leading-tight text-ink">
                      {applicant.name}
                    </p>
                    {applicant.username ? (
                      <p className="truncate text-sm text-ink-muted">
                        @{applicant.username}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4 text-sm text-ink-muted">
                  <span>
                    {applicant.appliedLabel
                      ? t("applied", { when: applicant.appliedLabel })
                      : null}
                  </span>
                  {chip ? (
                    <StatusBadge
                      label={status(applicant.status)}
                      tone={chip.tone}
                      icon={chip.icon}
                    />
                  ) : null}
                </div>

                {applicant.essay ? (
                  <section className="mt-5">
                    <h3 className="text-sm font-semibold text-ink">{t("essay")}</h3>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink">
                      {applicant.essay}
                    </p>
                  </section>
                ) : null}

                {applicant.answers.length > 0 ? (
                  <section className="mt-5">
                    <h3 className="text-sm font-semibold text-ink">{t("answers")}</h3>
                    <dl className="mt-2 flex flex-col gap-3">
                      {applicant.answers.map((answer) => (
                        <div key={answer.prompt}>
                          <dt className="text-xs font-semibold text-ink-muted">
                            {answer.prompt}
                          </dt>
                          <dd className="mt-0.5 text-sm whitespace-pre-line text-ink">
                            {answer.value || "—"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ) : null}

                {applicant.profile.length > 0 ? (
                  <details className="group mt-5 rounded-lg border border-border">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                      {t("profile")}
                      <ChevronDown
                        aria-hidden="true"
                        className="size-4 text-ink-muted transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <dl className="grid gap-x-4 gap-y-2.5 border-t border-border px-4 py-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
                      {applicant.profile.map((entry) => (
                        <div key={entry.label} className="contents">
                          <dt className="text-xs font-semibold text-ink-muted sm:pt-0.5">
                            {entry.label}
                          </dt>
                          <dd className="text-sm break-words text-ink">
                            {entry.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="border-t border-border px-4 py-2.5 text-xs text-ink-muted">
                      {t("profileNote")}
                    </p>
                  </details>
                ) : null}

                <section className="mt-6">
                  <h3 className="text-sm font-semibold text-ink">{t("decision")}</h3>
                  {decidable ? (
                    <>
                      <DecisionSelect
                        value={decision}
                        onChange={onDecide}
                        label={t("decisionFor", { name: applicant.name })}
                        size="field"
                        className="mt-2"
                      />
                      <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                        {decision === "hold"
                          ? t("holdHelp")
                          : decision
                            ? t("stagedHelp")
                            : t("chooseHelp")}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
                      {applicant.decidedLabel ? (
                        <>
                          <Mail aria-hidden="true" className="size-4" />
                          {t("sentOn", { when: applicant.decidedLabel })}
                        </>
                      ) : (
                        t("noDecision")
                      )}
                    </p>
                  )}
                </section>
              </div>

              <footer className="flex flex-col gap-2 border-t border-border bg-surface-sunk/60 px-5 py-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!onPrevious}
                    onClick={onPrevious ?? undefined}
                  >
                    <ArrowLeft aria-hidden="true" />
                    {t("previous")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!onNext}
                    onClick={onNext ?? undefined}
                  >
                    {t("next")}
                    <ArrowRight aria-hidden="true" />
                  </Button>
                </div>
                <Link
                  href={applicant.href}
                  className={cn(
                    buttonClass({ variant: "ghost", size: "sm" }),
                    "w-full",
                  )}
                >
                  {t("open")}
                </Link>
              </footer>
            </>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
