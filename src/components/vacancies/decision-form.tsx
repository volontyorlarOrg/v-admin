"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { idleResult } from "@/lib/api/action-result";
import { decideVacancyAction } from "@/lib/vacancies/actions";
import { MAX_DECISION_NOTE } from "@/lib/vacancies/decision";
import {
  fieldMessage,
  fieldsOf,
  formError,
  type MessageCatalog,
} from "@/lib/forms/messages";

export type DecisionLabels = {
  closedTitle: string;
  closedDescription: string;
  decision: string;
  decisions: Record<string, string>;
  note: string;
  noteHelp: string;
  submit: string;
  pending: string;
  success: string;
  fallbackError: string;
  errors: MessageCatalog;
};

export function VacancyDecisionForm({
  vacancyId,
  decisions,
  labels,
}: {
  vacancyId: string;
  decisions: readonly string[];
  labels: DecisionLabels;
}) {
  const [result, dispatch] = useActionState(decideVacancyAction, idleResult);
  const fields = fieldsOf(result);
  const message = formError(result, labels.errors, labels.fallbackError);
  const decisionError = fieldMessage(fields, "decision", labels.errors);
  const noteError = fieldMessage(fields, "note", labels.errors);

  return (
    <form action={dispatch} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="id" value={vacancyId} />

      {result.status === "ok" ? (
        <FormMessage tone="success">{labels.success}</FormMessage>
      ) : null}
      {message ? <FormMessage tone="error">{message}</FormMessage> : null}

      {decisions.length === 0 ? (
        <div role="status">
          <p className="text-section font-semibold text-ink">{labels.closedTitle}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            {labels.closedDescription}
          </p>
        </div>
      ) : null}

      {decisions.length === 0 ? null : (
        <>
          <Field invalid={Boolean(decisionError)}>
            <FieldLabel htmlFor="vacancy-decision">{labels.decision}</FieldLabel>
            <NativeSelect
              id="vacancy-decision"
              name="decision"
              required
              defaultValue={decisions[0]}
            >
              {decisions.map((decision) => (
                <NativeSelectOption key={decision} value={decision}>
                  {labels.decisions[decision] ?? decision}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError>{decisionError}</FieldError>
          </Field>

          <Field invalid={Boolean(noteError)}>
            <FieldLabel htmlFor="decision-note">{labels.note}</FieldLabel>
            <Textarea
              id="decision-note"
              name="note"
              maxLength={MAX_DECISION_NOTE}
              aria-describedby="decision-note-help"
            />
            <FieldDescription id="decision-note-help">
              {labels.noteHelp}
            </FieldDescription>
            <FieldError>{noteError}</FieldError>
          </Field>

          <div>
            <SubmitButton pendingLabel={labels.pending}>{labels.submit}</SubmitButton>
          </div>
        </>
      )}
    </form>
  );
}
