"use client";

import { useActionState, useState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
  decision: string;
  decisions: Record<string, string>;
  note: string;
  noteHelp: string;
  submit: string;
  pending: string;
  success: string;
  rejectConfirm: {
    title: string;
    description: string;
    confirm: string;
    cancel: string;
  };
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
  const [decision, setDecision] = useState(decisions[0] ?? "");
  const [note, setNote] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const fields = fieldsOf(result);
  const message = formError(result, labels.errors, labels.fallbackError);
  const decisionError = fieldMessage(fields, "decision", labels.errors);
  const noteError = fieldMessage(fields, "note", labels.errors);

  return (
    <>
      <form action={dispatch} noValidate className="flex flex-col gap-5">
        <input type="hidden" name="id" value={vacancyId} />

        {result.status === "ok" ? (
          <FormMessage tone="success">{labels.success}</FormMessage>
        ) : null}
        {message ? <FormMessage tone="error">{message}</FormMessage> : null}

        <Field invalid={Boolean(decisionError)}>
          <FieldLabel htmlFor="vacancy-decision">{labels.decision}</FieldLabel>
          <NativeSelect
            id="vacancy-decision"
            name="decision"
            required
            value={decision}
            onChange={(event) => setDecision(event.target.value)}
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
            value={note}
            onChange={(event) => setNote(event.target.value)}
            aria-describedby="decision-note-help"
          />
          <FieldDescription id="decision-note-help">{labels.noteHelp}</FieldDescription>
          <FieldError>{noteError}</FieldError>
        </Field>

        <div>
          {decision === "reject" ? (
            <Button type="button" onClick={() => setRejectOpen(true)}>
              {labels.submit}
            </Button>
          ) : (
            <SubmitButton pendingLabel={labels.pending}>{labels.submit}</SubmitButton>
          )}
        </div>
      </form>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.rejectConfirm.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {labels.rejectConfirm.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form action={dispatch} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={vacancyId} />
            <input type="hidden" name="decision" value="reject" />
            <input type="hidden" name="note" value={note} />
            {noteError ? <FormMessage tone="error">{noteError}</FormMessage> : null}
            {message ? <FormMessage tone="error">{message}</FormMessage> : null}
            <AlertDialogFooter>
              <AlertDialogCancel type="button">
                {labels.rejectConfirm.cancel}
              </AlertDialogCancel>
              <SubmitButton
                size="sm"
                pendingLabel={labels.pending}
                className="bg-danger text-knockout hover:bg-danger/90"
              >
                {labels.rejectConfirm.confirm}
              </SubmitButton>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
