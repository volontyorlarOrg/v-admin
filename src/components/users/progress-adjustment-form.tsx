"use client";

import { Minus, Plus } from "lucide-react";
import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { idleResult, type ActionResult } from "@/lib/api/action-result";
import {
  fieldMessage,
  fieldsOf,
  formError,
  type MessageCatalog,
} from "@/lib/forms/messages";
import {
  ADJUSTMENT_REASON_MAX_LENGTH,
  MAX_HOURS_CHANGE,
  MAX_XP_CHANGE,
  type ProgressDirection,
} from "@/lib/users/progress";

export type ProgressAdjustmentLabels = {
  direction: string;
  add: string;
  remove: string;
  xp: string;
  hours: string;
  amountHelp: string;
  reason: string;
  reasonHelp: string;
  submit: string;
  pending: string;
  success: string;
  fallbackError: string;
  errors: MessageCatalog;
};

const DIRECTIONS: { value: ProgressDirection; icon: typeof Plus }[] = [
  { value: "add", icon: Plus },
  { value: "remove", icon: Minus },
];

export function ProgressAdjustmentForm({
  action,
  targetId,
  labels,
}: {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  targetId: string;
  labels: ProgressAdjustmentLabels;
}) {
  const [result, dispatch] = useActionState(action, idleResult);
  const fields = fieldsOf(result);
  const message = formError(result, labels.errors, labels.fallbackError);
  const values = result.status === "error" ? (result.values ?? {}) : {};
  const idPrefix = `progress-${targetId}`;
  const error = (name: string) => fieldMessage(fields, name, labels.errors);
  const describedBy = (name: string, help?: string) =>
    [
      help ? `${idPrefix}-${help}-help` : null,
      error(name) ? `${idPrefix}-${name}-error` : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <form action={dispatch} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="id" value={targetId} />

      {result.status === "ok" ? (
        <FormMessage tone="success">{labels.success}</FormMessage>
      ) : null}
      {message ? <FormMessage tone="error">{message}</FormMessage> : null}

      <div
        key={result.status === "error" ? result.submissionId : "idle"}
        className="flex flex-col gap-4"
      >
        <fieldset aria-describedby={describedBy("direction")}>
          <legend className="mb-2 text-sm font-semibold text-foreground">
            {labels.direction}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {DIRECTIONS.map(({ value, icon: Icon }) => (
              <label
                key={value}
                className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-surface px-3 text-sm font-semibold text-ink-muted transition-colors hover:border-primary-ink has-checked:border-primary-ink has-checked:bg-surface-soft has-checked:text-ink has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary-ink"
              >
                <input
                  type="radio"
                  name="direction"
                  value={value}
                  defaultChecked={(values.direction || "add") === value}
                  className="sr-only"
                />
                <Icon aria-hidden="true" className="size-4" />
                {value === "add" ? labels.add : labels.remove}
              </label>
            ))}
          </div>
          <FieldError id={`${idPrefix}-direction-error`} className="mt-2">
            {error("direction")}
          </FieldError>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <Field invalid={Boolean(error("xp"))}>
            <FieldLabel htmlFor={`${idPrefix}-xp`}>{labels.xp}</FieldLabel>
            <Input
              id={`${idPrefix}-xp`}
              name="xp"
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_XP_CHANGE}
              step={1}
              defaultValue={values.xp ?? ""}
              placeholder="0"
              aria-invalid={Boolean(error("xp")) || undefined}
              aria-describedby={describedBy("xp", "amount")}
              className="tabular"
            />
          </Field>
          <Field invalid={Boolean(error("hours"))}>
            <FieldLabel htmlFor={`${idPrefix}-hours`}>{labels.hours}</FieldLabel>
            <Input
              id={`${idPrefix}-hours`}
              name="hours"
              type="number"
              inputMode="decimal"
              min={0}
              max={MAX_HOURS_CHANGE}
              step={0.01}
              defaultValue={values.hours ?? ""}
              placeholder="0"
              aria-invalid={Boolean(error("hours")) || undefined}
              aria-describedby={describedBy("hours", "amount")}
              className="tabular"
            />
          </Field>
          <div className="col-span-2 -mt-1 flex flex-col gap-1">
            <FieldDescription id={`${idPrefix}-amount-help`}>
              {labels.amountHelp}
            </FieldDescription>
            <FieldError id={`${idPrefix}-xp-error`}>{error("xp")}</FieldError>
            <FieldError id={`${idPrefix}-hours-error`}>{error("hours")}</FieldError>
          </div>
        </div>

        <Field invalid={Boolean(error("reason"))}>
          <FieldLabel htmlFor={`${idPrefix}-reason`}>{labels.reason}</FieldLabel>
          <Textarea
            id={`${idPrefix}-reason`}
            name="reason"
            required
            maxLength={ADJUSTMENT_REASON_MAX_LENGTH}
            defaultValue={values.reason ?? ""}
            aria-invalid={Boolean(error("reason")) || undefined}
            aria-describedby={describedBy("reason", "reason")}
            className="min-h-24"
          />
          <FieldDescription id={`${idPrefix}-reason-help`}>
            {labels.reasonHelp}
          </FieldDescription>
          <FieldError id={`${idPrefix}-reason-error`}>{error("reason")}</FieldError>
        </Field>
      </div>

      <div>
        <SubmitButton size="sm" pendingLabel={labels.pending}>
          {labels.submit}
        </SubmitButton>
      </div>
    </form>
  );
}
