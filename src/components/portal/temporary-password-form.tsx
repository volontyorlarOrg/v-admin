"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { idleResult, type ActionResult } from "@/lib/api/action-result";
import {
  fieldMessage,
  fieldsOf,
  formError,
  type MessageCatalog,
} from "@/lib/forms/messages";

export type TemporaryPasswordLabels = {
  label: string;
  help: string;
  privacy: string;
  showPassword: string;
  hidePassword: string;
  submit: string;
  pending: string;
  success: string;
  fallbackError: string;
  errors: MessageCatalog;
};

export function TemporaryPasswordForm({
  action,
  targetId,
  labels,
}: {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  targetId: string;
  labels: TemporaryPasswordLabels;
}) {
  const [result, dispatch] = useActionState(action, idleResult);
  const fields = fieldsOf(result);
  const message = formError(result, labels.errors, labels.fallbackError);
  const error = fieldMessage(fields, "temporaryPassword", labels.errors);
  const inputId = `temporary-password-${targetId}`;

  return (
    <form action={dispatch} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="id" value={targetId} />

      <p className="text-sm leading-relaxed text-ink-muted">{labels.privacy}</p>

      {result.status === "ok" ? (
        <FormMessage tone="success">{labels.success}</FormMessage>
      ) : null}
      {message ? <FormMessage tone="error">{message}</FormMessage> : null}

      <Field invalid={Boolean(error)}>
        <FieldLabel htmlFor={inputId}>{labels.label}</FieldLabel>
        <PasswordInput
          id={inputId}
          name="temporaryPassword"
          autoComplete="new-password"
          required
          showLabel={labels.showPassword}
          hideLabel={labels.hidePassword}
          aria-describedby={`${inputId}-help`}
        />
        <FieldDescription id={`${inputId}-help`}>{labels.help}</FieldDescription>
        <FieldError>{error}</FieldError>
      </Field>

      <div>
        <SubmitButton size="sm" pendingLabel={labels.pending}>
          {labels.submit}
        </SubmitButton>
      </div>
    </form>
  );
}
