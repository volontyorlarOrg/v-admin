"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { idleResult } from "@/lib/api/action-result";
import { reviewApplicationAction } from "@/lib/applications/actions";
import {
  fieldMessage,
  fieldsOf,
  formError,
  type MessageCatalog,
} from "@/lib/forms/messages";

export type ReviewLabels = {
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

export function ReviewForm({
  applicationId,
  currentStatus,
  currentNote,
  decisions,
  labels,
}: {
  applicationId: string;
  currentStatus: string;
  currentNote: string;
  decisions: readonly string[];
  labels: ReviewLabels;
}) {
  const [result, dispatch] = useActionState(reviewApplicationAction, idleResult);
  const fields = fieldsOf(result);
  const message = formError(result, labels.errors, labels.fallbackError);
  const statusError = fieldMessage(fields, "status", labels.errors);
  const noteError = fieldMessage(fields, "reviewerNote", labels.errors);

  return (
    <form action={dispatch} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="id" value={applicationId} />

      {result.status === "ok" ? (
        <FormMessage tone="success">{labels.success}</FormMessage>
      ) : null}
      {message ? <FormMessage tone="error">{message}</FormMessage> : null}

      <Field invalid={Boolean(statusError)}>
        <FieldLabel htmlFor="review-status">{labels.decision}</FieldLabel>
        <NativeSelect
          id="review-status"
          name="status"
          required
          defaultValue={
            decisions.includes(currentStatus) ? currentStatus : decisions[0]
          }
        >
          {decisions.map((decision) => (
            <NativeSelectOption key={decision} value={decision}>
              {labels.decisions[decision] ?? decision}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldError>{statusError}</FieldError>
      </Field>

      <Field invalid={Boolean(noteError)}>
        <FieldLabel htmlFor="reviewerNote">{labels.note}</FieldLabel>
        <Textarea
          id="reviewerNote"
          name="reviewerNote"
          maxLength={2000}
          defaultValue={currentNote}
          aria-describedby="reviewerNote-help"
        />
        <FieldDescription id="reviewerNote-help">{labels.noteHelp}</FieldDescription>
        <FieldError>{noteError}</FieldError>
      </Field>

      <div>
        <SubmitButton pendingLabel={labels.pending}>{labels.submit}</SubmitButton>
      </div>
    </form>
  );
}
