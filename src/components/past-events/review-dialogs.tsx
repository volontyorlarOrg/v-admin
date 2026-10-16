"use client";

import { FormDialog, type FormDialogLabels } from "@/components/forms/form-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/api/action-result";

type Action = (previous: ActionResult, formData: FormData) => Promise<ActionResult>;

export type ReviewDialogLabels = {
  approve: string;
  approveDescription: string;
  approveRemovalDescription: string;
  approveSuccess: string;
  reject: string;
  rejectDescription: string;
  rejectSuccess: string;
  hours: string;
  xp: string;
  amountsHelp: string;
  reason: string;
  reasonHelp: string;
  close: string;
  cancel: string;
  pending: string;
  fallbackError: string;
  errors: Record<string, string>;
};

function typedValues(result: ActionResult): Record<string, string> {
  return result.status === "error" ? (result.values ?? {}) : {};
}

function attemptKey(result: ActionResult): string {
  return result.status === "error" ? (result.submissionId ?? "error") : "idle";
}

function dialogLabels(
  labels: ReviewDialogLabels,
  copy: { title: string; description: string; submit: string; success: string },
): FormDialogLabels {
  return {
    ...copy,
    pending: labels.pending,
    cancel: labels.cancel,
    close: labels.close,
    summary: labels.fallbackError,
    fallbackError: labels.fallbackError,
    errors: labels.errors,
  };
}

export function ApproveRequestDialog({
  requestId,
  subject,
  amounts,
  action,
  labels,
}: {
  requestId: string;
  subject: string;
  amounts: { hours: number; xpAwarded: number; xpLocked: boolean } | null;
  action: Action;
  labels: ReviewDialogLabels;
}) {
  const fieldId = (name: string) => `approve-${requestId}-${name}`;

  return (
    <FormDialog
      action={action}
      fields={{ requestId }}
      fieldLabels={{ hours: labels.hours, xpAwarded: labels.xp }}
      idFor={fieldId}
      labels={dialogLabels(labels, {
        title: labels.approve,
        description: amounts
          ? labels.approveDescription
          : labels.approveRemovalDescription,
        submit: labels.approve,
        success: labels.approveSuccess,
      })}
      trigger={
        <Button type="button" size="row">
          {labels.approve}
          <span className="sr-only"> — {subject}</span>
        </Button>
      }
    >
      {amounts
        ? ({ error, result }) => (
            <div key={attemptKey(result)} className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field invalid={Boolean(error("hours"))}>
                  <FieldLabel htmlFor={fieldId("hours")}>{labels.hours}</FieldLabel>
                  <Input
                    id={fieldId("hours")}
                    name="hours"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={999}
                    step={0.01}
                    required
                    defaultValue={typedValues(result).hours ?? amounts.hours}
                    aria-invalid={Boolean(error("hours")) || undefined}
                  />
                  <FieldError id={`${fieldId("hours")}-error`}>
                    {error("hours")}
                  </FieldError>
                </Field>
                <Field invalid={Boolean(error("xpAwarded"))}>
                  <FieldLabel htmlFor={fieldId("xpAwarded")}>{labels.xp}</FieldLabel>
                  <Input
                    id={fieldId("xpAwarded")}
                    name="xpAwarded"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100000}
                    step={1}
                    required
                    readOnly={amounts.xpLocked}
                    defaultValue={typedValues(result).xpAwarded ?? amounts.xpAwarded}
                    aria-invalid={Boolean(error("xpAwarded")) || undefined}
                  />
                  <FieldError id={`${fieldId("xpAwarded")}-error`}>
                    {error("xpAwarded")}
                  </FieldError>
                </Field>
              </div>
              <FieldDescription>{labels.amountsHelp}</FieldDescription>
            </div>
          )
        : null}
    </FormDialog>
  );
}

export function RejectRequestDialog({
  requestId,
  subject,
  action,
  labels,
}: {
  requestId: string;
  subject: string;
  action: Action;
  labels: ReviewDialogLabels;
}) {
  const fieldId = (name: string) => `reject-${requestId}-${name}`;

  return (
    <FormDialog
      action={action}
      fields={{ requestId }}
      fieldLabels={{ note: labels.reason }}
      idFor={fieldId}
      labels={dialogLabels(labels, {
        title: labels.reject,
        description: labels.rejectDescription,
        submit: labels.reject,
        success: labels.rejectSuccess,
      })}
      trigger={
        <Button type="button" variant="danger-outline" size="row">
          {labels.reject}
          <span className="sr-only"> — {subject}</span>
        </Button>
      }
      tone="danger"
    >
      {({ error, result }) => (
        <Field key={attemptKey(result)} invalid={Boolean(error("note"))}>
          <FieldLabel htmlFor={fieldId("note")}>{labels.reason}</FieldLabel>
          <Textarea
            id={fieldId("note")}
            name="note"
            rows={3}
            maxLength={500}
            required
            defaultValue={typedValues(result).note ?? ""}
            aria-describedby={`${fieldId("note")}-help`}
            aria-invalid={Boolean(error("note")) || undefined}
          />
          <FieldDescription id={`${fieldId("note")}-help`}>
            {labels.reasonHelp}
          </FieldDescription>
          <FieldError id={`${fieldId("note")}-error`}>{error("note")}</FieldError>
        </Field>
      )}
    </FormDialog>
  );
}
