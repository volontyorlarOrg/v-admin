"use client";

import { CircleCheck, Users, X } from "lucide-react";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Avatar } from "@/components/portal/avatar";
import { Register } from "@/components/register/register";
import { Button, buttonClass } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { idleResult } from "@/lib/api/action-result";
import {
  createBulkAwardAction,
  matchingVolunteerIdsAction,
  type CreateAwardState,
} from "@/lib/bulk-awards/actions";
import { fill, formatAmount } from "@/lib/bulk-awards/format";
import type { ComposerLabels } from "@/lib/bulk-awards/labels";
import {
  AWARD_REASON_MAX_LENGTH,
  MAX_AWARD_HOURS,
  MAX_AWARD_SELECTION,
  MAX_AWARD_XP,
  amountErrors,
  type AwardVolunteers,
} from "@/lib/bulk-awards/schema";
import { cn } from "@/lib/utils";

type Scope = "selected" | "all";
type Selection = Map<string, string | null>;

const PREVIEW_NAMES = 6;
const initialState: CreateAwardState = { result: idleResult };

export function AwardComposer({
  volunteers,
  q,
  submissionId,
  labels,
  locale,
  search,
  pagination,
}: {
  volunteers: AwardVolunteers;
  q: string;
  submissionId: string;
  labels: ComposerLabels;
  locale: string;
  search: ReactNode;
  pagination: ReactNode;
}) {
  const [scope, setScope] = useState<Scope>("selected");
  const [selected, setSelected] = useState<Selection>(() => new Map());
  const [xp, setXp] = useState("");
  const [hours, setHours] = useState("");
  const [reason, setReason] = useState("");
  const [checked, setChecked] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState(submissionId);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [selectNotice, setSelectNotice] = useState<string | null>(null);
  const [selectingAll, startSelectingAll] = useTransition();
  const [state, dispatch] = useActionState(createBulkAwardAction, initialState);
  const [seen, setSeen] = useState(state);

  if (state !== seen) {
    setSeen(state);
    if (state.result.status === "ok" && state.award) {
      setReviewing(false);
      toast.success(labels.toast);
    }
  }

  const number = (value: number) => formatAmount(value, locale);
  const count = scope === "all" ? volunteers.eligibleTotal : selected.size;
  const errors = amountErrors({ xp, hours, reason });
  const xpValue = Number(xp) || 0;
  const hoursValue = Number(hours) || 0;
  const message = (code: string | undefined) =>
    code ? (labels.errors[code] ?? labels.error) : undefined;
  const shownError = (field: "xp" | "hours" | "reason") =>
    checked ? message(errors[field]) : undefined;
  const awardFailed =
    state.result.status === "error" ? message(state.result.code) : undefined;
  const pageIds = volunteers.items.map((volunteer) => volunteer.id);
  const pageSelected = pageIds.filter((id) => selected.has(id)).length;

  function update(next: (draft: Selection) => void) {
    setSelected((current) => {
      const draft = new Map(current);
      next(draft);
      return draft;
    });
    setSelectNotice(null);
  }

  function nameOf(id: string) {
    const volunteer = volunteers.items.find((item) => item.id === id);
    return volunteer ? (volunteer.displayName ?? `@${volunteer.username}`) : null;
  }

  function toggle(id: string) {
    update((draft) => {
      if (draft.has(id)) draft.delete(id);
      else if (draft.size < MAX_AWARD_SELECTION) draft.set(id, nameOf(id));
    });
  }

  function togglePage() {
    const everyone = pageSelected === pageIds.length;
    update((draft) => {
      for (const id of pageIds) {
        if (everyone) draft.delete(id);
        else if (draft.size < MAX_AWARD_SELECTION) draft.set(id, nameOf(id));
      }
    });
  }

  function selectMatching() {
    startSelectingAll(async () => {
      const result = await matchingVolunteerIdsAction(q);
      if ("error" in result) {
        setSelectNotice(message(result.error) ?? labels.error);
        return;
      }
      setSelected((current) => {
        const draft = new Map(current);
        for (const id of result.ids) {
          if (draft.size >= MAX_AWARD_SELECTION) break;
          if (!draft.has(id)) draft.set(id, nameOf(id));
        }
        return draft;
      });
      setSelectNotice(result.truncated ? labels.selectionTruncated : null);
    });
  }

  function review() {
    setChecked(true);
    if (count > 0 && Object.keys(errors).length === 0) setReviewing(true);
  }

  function startOver() {
    setDismissed(state.award?.id ?? null);
    setScope("selected");
    setSelected(new Map());
    setXp("");
    setHours("");
    setReason("");
    setChecked(false);
    setSelectNotice(null);
    setCurrentSubmission(crypto.randomUUID());
  }

  if (state.award && state.award.id !== dismissed) {
    const award = state.award;
    return (
      <section
        aria-labelledby="award-given"
        className="flex flex-col gap-5 sheet px-5 py-6 sm:px-7"
      >
        <div className="flex items-start gap-3">
          <CircleCheck
            aria-hidden="true"
            className="mt-1 size-6 shrink-0 text-primary-ink"
          />
          <div className="min-w-0">
            <h2 id="award-given" className="text-section text-ink">
              {labels.successTitle}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">{labels.successBody}</p>
          </div>
        </div>
        <AmountFigures
          labels={labels}
          number={number}
          recipients={award.recipients}
          xp={award.xp}
          hours={award.hours}
        />
        {award.skipped > 0 ? (
          <p className="text-sm text-ink-muted">
            {fill(labels.skipped, { count: number(award.skipped) })}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/bulk-awards/${award.id}`}
            className={buttonClass({ size: "sm" })}
          >
            {labels.viewAward}
          </Link>
          <Button type="button" variant="outline" size="sm" onClick={startOver}>
            {labels.newAward}
          </Button>
        </div>
      </section>
    );
  }

  const previewNames = [...selected.values()].filter(Boolean).slice(0, PREVIEW_NAMES);
  const hiddenCount = selected.size - previewNames.length;

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
      <Register id="award-who" title={labels.who}>
        <div className="border-b border-border px-5 py-4">
          <fieldset>
            <legend className="sr-only">{labels.scopeLabel}</legend>
            <div className="grid grid-cols-2 gap-1 rounded-full bg-surface-sunk p-1">
              {(["selected", "all"] as const).map((value) => (
                <label
                  key={value}
                  className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold text-ink-muted transition-colors hover:text-ink has-checked:bg-surface has-checked:text-ink has-checked:shadow-sm has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary-ink"
                >
                  <input
                    type="radio"
                    name="award-scope"
                    value={value}
                    checked={scope === value}
                    onChange={() => setScope(value)}
                    className="sr-only"
                  />
                  {value === "selected" ? labels.scopeSelected : labels.scopeAll}
                  {value === "all" ? (
                    <span className="tabular text-xs font-medium text-ink-muted">
                      {number(volunteers.eligibleTotal)}
                    </span>
                  ) : null}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {scope === "all" ? (
          <div className="flex items-start gap-4 px-5 py-8">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-soft text-primary-ink">
              <Users aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-section text-ink">
                {fill(labels.everyoneTitle, {
                  count: number(volunteers.eligibleTotal),
                })}
              </p>
              <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-muted">
                {labels.everyoneHelp}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-border px-5 py-3">{search}</div>
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col gap-2.5 border-b border-border bg-surface-soft/50 px-5 py-3"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="tabular text-sm font-semibold text-ink">
                  {fill(labels.selected, { count: number(selected.size) })}
                </p>
                {selected.size > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="row"
                    className="-my-1"
                    onClick={() => update((draft) => draft.clear())}
                  >
                    {labels.clear}
                  </Button>
                ) : null}
              </div>
              {selected.size > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {[...selected.entries()]
                    .filter(([, name]) => name)
                    .slice(0, PREVIEW_NAMES)
                    .map(([id, name]) => (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => update((draft) => draft.delete(id))}
                          aria-label={fill(labels.remove, { name: name ?? "" })}
                          className="inline-flex min-h-8 max-w-[14rem] items-center gap-1.5 rounded-full border border-border bg-surface py-1 pr-2 pl-3 text-xs font-semibold text-ink transition-colors hover:border-danger/55 hover:text-danger-ink"
                        >
                          <span className="truncate">{name}</span>
                          <X aria-hidden="true" className="size-3.5 shrink-0" />
                        </button>
                      </li>
                    ))}
                  {hiddenCount > 0 ? (
                    <li className="inline-flex min-h-8 items-center px-1 text-xs font-semibold text-ink-muted">
                      {fill(labels.more, { count: number(hiddenCount) })}
                    </li>
                  ) : null}
                </ul>
              ) : null}
              {selectNotice ? (
                <p className="text-xs text-ink-muted">{selectNotice}</p>
              ) : null}
            </div>

            {volunteers.items.length ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-2">
                  <PageCheckbox
                    label={labels.selectPage}
                    all={pageSelected === pageIds.length}
                    some={pageSelected > 0}
                    onToggle={togglePage}
                  />
                  {q && volunteers.total > volunteers.items.length ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="row"
                      disabled={selectingAll}
                      aria-busy={selectingAll}
                      onClick={selectMatching}
                    >
                      {selectingAll
                        ? labels.selecting
                        : fill(labels.selectMatching, {
                            count: number(volunteers.total),
                          })}
                    </Button>
                  ) : null}
                </div>
                <ul className="divide-y divide-border">
                  {volunteers.items.map((volunteer) => {
                    const name = volunteer.displayName ?? `@${volunteer.username}`;
                    const isSelected = selected.has(volunteer.id);
                    return (
                      <li key={volunteer.id}>
                        <label
                          className={cn(
                            "flex min-h-15 cursor-pointer items-center gap-3 px-5 py-2.5 transition-colors hover:bg-surface-soft has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-primary-ink",
                            isSelected && "bg-surface-soft/60",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={
                              !isSelected && selected.size >= MAX_AWARD_SELECTION
                            }
                            onChange={() => toggle(volunteer.id)}
                            className="size-4 shrink-0 accent-primary-ink"
                          />
                          <Avatar
                            name={volunteer.displayName ?? undefined}
                            size="sm"
                            person
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-ink">
                              {name}
                            </span>
                            <span className="block truncate text-xs text-ink-muted">
                              @{volunteer.username}
                              {volunteer.email ? ` · ${volunteer.email}` : ""}
                            </span>
                          </span>
                          <span className="tabular shrink-0 text-xs text-ink-muted">
                            {fill(labels.currentXp, { value: number(volunteer.xp) })}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {pagination}
              </>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-ink-muted">
                {q ? labels.noMatches : labels.noVolunteers}
              </p>
            )}
          </>
        )}
      </Register>

      <section
        aria-labelledby="award-what"
        className="flex flex-col gap-5 sheet px-5 py-5 xl:sticky xl:top-5"
      >
        <h2 id="award-what" className="text-section text-ink">
          {labels.what}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Field invalid={Boolean(shownError("xp"))}>
            <FieldLabel htmlFor="award-xp">{labels.xp}</FieldLabel>
            <Input
              id="award-xp"
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_AWARD_XP}
              step={1}
              placeholder="0"
              value={xp}
              onChange={(event) => setXp(event.target.value)}
              aria-invalid={Boolean(shownError("xp")) || undefined}
              aria-describedby="award-amount-help award-xp-error"
              className="tabular"
            />
          </Field>
          <Field invalid={Boolean(shownError("hours"))}>
            <FieldLabel htmlFor="award-hours">{labels.hours}</FieldLabel>
            <Input
              id="award-hours"
              type="number"
              inputMode="decimal"
              min={0}
              max={MAX_AWARD_HOURS}
              step={0.01}
              placeholder="0"
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              aria-invalid={Boolean(shownError("hours")) || undefined}
              aria-describedby="award-amount-help award-hours-error"
              className="tabular"
            />
          </Field>
          <div className="col-span-2 -mt-1 flex flex-col gap-1">
            <FieldDescription id="award-amount-help">
              {labels.amountHelp}
            </FieldDescription>
            <FieldError id="award-xp-error">{shownError("xp")}</FieldError>
            <FieldError id="award-hours-error">{shownError("hours")}</FieldError>
          </div>
        </div>
        <Field invalid={Boolean(shownError("reason"))}>
          <FieldLabel htmlFor="award-reason">{labels.reason}</FieldLabel>
          <Textarea
            id="award-reason"
            required
            maxLength={AWARD_REASON_MAX_LENGTH}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={Boolean(shownError("reason")) || undefined}
            aria-describedby="award-reason-help award-reason-error"
            className="min-h-20"
          />
          <FieldDescription id="award-reason-help">
            {labels.reasonHelp}
          </FieldDescription>
          <FieldError id="award-reason-error">{shownError("reason")}</FieldError>
        </Field>

        <dl className="tabular grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 rounded-xl bg-surface-sunk px-4 py-3 text-sm">
          <dt className="text-ink-muted">{labels.summaryRecipients}</dt>
          <dd className="text-right font-semibold text-ink">{number(count)}</dd>
          <dt className="text-ink-muted">{labels.summaryEach}</dt>
          <dd className="text-right font-semibold text-ink">
            {amountLine(labels, number, xpValue, hoursValue)}
          </dd>
          <dt className="text-ink-muted">{labels.summaryTotal}</dt>
          <dd className="text-right font-semibold text-ink">
            {amountLine(labels, number, xpValue * count, hoursValue * count)}
          </dd>
        </dl>

        {checked && count === 0 ? (
          <FormMessage tone="error">
            {labels.errors.bulkAwardSelectionInvalid ?? labels.error}
          </FormMessage>
        ) : null}
        <Button type="button" onClick={review} aria-haspopup="dialog">
          {labels.review}
        </Button>
        <p className="-mt-2 text-xs leading-relaxed text-ink-muted">
          {labels.reviewHint}
        </p>
      </section>

      <Dialog open={reviewing} onOpenChange={setReviewing}>
        <DialogContent closeLabel={labels.close}>
          <DialogHeader>
            <DialogTitle>{labels.confirmTitle}</DialogTitle>
            <DialogDescription>{labels.confirmDescription}</DialogDescription>
          </DialogHeader>
          <form action={dispatch} className="flex min-h-0 flex-1 flex-col">
            <input type="hidden" name="submissionId" value={currentSubmission} />
            <input type="hidden" name="scope" value={scope} />
            <input
              type="hidden"
              name="userIds"
              value={JSON.stringify(scope === "all" ? [] : [...selected.keys()])}
            />
            <input type="hidden" name="xp" value={xp} />
            <input type="hidden" name="hours" value={hours} />
            <input type="hidden" name="reason" value={reason} />
            <DialogBody className="flex flex-col gap-5">
              {awardFailed ? (
                <FormMessage tone="error">{awardFailed}</FormMessage>
              ) : null}
              <AmountFigures
                labels={labels}
                number={number}
                recipients={count}
                xp={xpValue}
                hours={hoursValue}
              />
              <dl className="divide-y divide-border text-sm">
                <div className="grid gap-1 py-2.5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-ink-muted">{labels.who}</dt>
                  <dd className="min-w-0 break-words text-ink">
                    {scope === "all"
                      ? labels.everyoneSummary
                      : [
                          previewNames.join(", "),
                          hiddenCount > 0
                            ? fill(labels.more, { count: number(hiddenCount) })
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                  </dd>
                </div>
                <div className="grid gap-1 py-2.5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-ink-muted">{labels.reason}</dt>
                  <dd className="min-w-0 break-words whitespace-pre-line text-ink">
                    {reason.trim()}
                  </dd>
                </div>
                <div className="grid gap-1 py-2.5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-ink-muted">{labels.summaryTotal}</dt>
                  <dd className="tabular text-ink">
                    {amountLine(labels, number, xpValue * count, hoursValue * count)}
                  </dd>
                </div>
              </dl>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="sm">
                  {labels.cancel}
                </Button>
              </DialogClose>
              <SubmitButton size="sm" pendingLabel={labels.pending}>
                {labels.confirm}
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function amountLine(
  labels: ComposerLabels,
  number: (value: number) => string,
  xp: number,
  hours: number,
) {
  const parts = [
    xp > 0 ? fill(labels.xpValue, { value: number(xp) }) : null,
    hours > 0 ? fill(labels.hoursValue, { value: number(hours) }) : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

function AmountFigures({
  labels,
  number,
  recipients,
  xp,
  hours,
}: {
  labels: ComposerLabels;
  number: (value: number) => string;
  recipients: number;
  xp: number;
  hours: number;
}) {
  const figures = [
    { label: labels.summaryRecipients, value: number(recipients) },
    ...(xp > 0 ? [{ label: labels.xp, value: `+${number(xp)}` }] : []),
    ...(hours > 0 ? [{ label: labels.hours, value: `+${number(hours)}` }] : []),
  ];
  return (
    <dl
      className={cn(
        "grid gap-px overflow-hidden rounded-xl border border-border bg-border",
        figures.length === 3 ? "grid-cols-3" : "grid-cols-2",
      )}
    >
      {figures.map((figure) => (
        <div key={figure.label} className="bg-surface px-4 py-3">
          <dt className="text-xs text-ink-muted">{figure.label}</dt>
          <dd className="display-face tabular mt-1 text-figure-inline text-ink">
            {figure.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PageCheckbox({
  label,
  all,
  some,
  onToggle,
}: {
  label: string;
  all: boolean;
  some: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = some && !all;
  }, [some, all]);
  return (
    <label className="flex min-h-9 cursor-pointer items-center gap-3 text-sm font-semibold text-ink">
      <input
        ref={ref}
        type="checkbox"
        checked={all}
        onChange={onToggle}
        className="size-4 shrink-0 accent-primary-ink"
      />
      {label}
    </label>
  );
}
