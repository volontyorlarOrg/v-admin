"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { idleResult } from "@/lib/api/action-result";
import { resolveAttendanceAction } from "@/lib/attendance/actions";
import {
  fieldMessage,
  fieldsOf,
  formError,
  type MessageCatalog,
} from "@/lib/forms/messages";

export type ResolveLabels = {
  outcome: string;
  outcomes: Record<string, string>;
  hours: string;
  hoursHelp: string;
  submit: string;
  pending: string;
  success: string;
  fallbackError: string;
  errors: MessageCatalog;
};

export function ResolveAttendanceForm({
  applicationId,
  outcomes,
  labels,
  currentOutcome,
  currentHours,
  kind = "volunteering",
}: {
  applicationId: string;
  outcomes: readonly string[];
  labels: ResolveLabels;
  currentOutcome?: string;
  currentHours?: string;
  kind?: "volunteering" | "competition";
}) {
  const [result, dispatch] = useActionState(resolveAttendanceAction, idleResult);
  const fields = fieldsOf(result);
  const message = formError(result, labels.errors, labels.fallbackError);
  const outcomeError = fieldMessage(fields, "outcome", labels.errors);
  const hoursError = fieldMessage(fields, "confirmedHours", labels.errors);
  const inputId = `hours-${applicationId}`;
  const outcomeId = `outcome-${applicationId}`;

  return (
    <form action={dispatch} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="kind" value={kind} />

      {result.status === "ok" ? (
        <FormMessage tone="success">{labels.success}</FormMessage>
      ) : null}
      {message ? <FormMessage tone="error">{message}</FormMessage> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field invalid={Boolean(outcomeError)}>
          <FieldLabel htmlFor={outcomeId}>{labels.outcome}</FieldLabel>
          <NativeSelect
            id={outcomeId}
            name="outcome"
            required
            defaultValue={
              currentOutcome && outcomes.includes(currentOutcome)
                ? currentOutcome
                : outcomes[0]
            }
          >
            {outcomes.map((outcome) => (
              <NativeSelectOption key={outcome} value={outcome}>
                {labels.outcomes[outcome] ?? outcome}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError>{outcomeError}</FieldError>
        </Field>

        {kind === "volunteering" ? (
          <Field invalid={Boolean(hoursError)}>
            <FieldLabel htmlFor={inputId}>{labels.hours}</FieldLabel>
            <Input
              id={inputId}
              name="confirmedHours"
              type="number"
              min={0}
              max={999}
              step="0.25"
              inputMode="decimal"
              defaultValue={currentHours ?? ""}
              aria-describedby={`${inputId}-help`}
            />
            <FieldDescription id={`${inputId}-help`}>
              {labels.hoursHelp}
            </FieldDescription>
            <FieldError>{hoursError}</FieldError>
          </Field>
        ) : null}
      </div>

      <div>
        <SubmitButton size="sm" pendingLabel={labels.pending}>
          {labels.submit}
        </SubmitButton>
      </div>
    </form>
  );
}
