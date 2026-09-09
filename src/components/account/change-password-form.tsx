"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { idleResult } from "@/lib/api/action-result";
import { changePasswordAction } from "@/lib/auth/actions";
import {
  fieldMessage,
  fieldsOf,
  formError,
  type MessageCatalog,
} from "@/lib/forms/messages";

export type ChangePasswordLabels = {
  currentPassword: string;
  newPassword: string;
  newPasswordHelp: string;
  confirmPassword: string;
  showPassword: string;
  hidePassword: string;
  submit: string;
  pending: string;
  success: string;
  continueLabel: string;
  continueHref: string;
  fallbackError: string;
  errors: MessageCatalog;
};

export function ChangePasswordForm({ labels }: { labels: ChangePasswordLabels }) {
  const [result, dispatch] = useActionState(changePasswordAction, idleResult);
  const fields = fieldsOf(result);
  const message = formError(result, labels.errors, labels.fallbackError);
  const error = (name: string) => fieldMessage(fields, name, labels.errors);

  if (result.status === "ok") {
    return (
      <div className="flex flex-col items-start gap-4">
        <FormMessage tone="success">{labels.success}</FormMessage>
        <Link href={labels.continueHref} className={buttonClass({ size: "sm" })}>
          {labels.continueLabel}
        </Link>
      </div>
    );
  }

  return (
    <form action={dispatch} noValidate className="flex flex-col gap-5">
      {message ? <FormMessage tone="error">{message}</FormMessage> : null}

      <Field invalid={Boolean(error("currentPassword"))}>
        <FieldLabel htmlFor="currentPassword">{labels.currentPassword}</FieldLabel>
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
          required
          showLabel={labels.showPassword}
          hideLabel={labels.hidePassword}
        />
        <FieldError>{error("currentPassword")}</FieldError>
      </Field>

      <Field invalid={Boolean(error("newPassword"))}>
        <FieldLabel htmlFor="newPassword">{labels.newPassword}</FieldLabel>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          required
          showLabel={labels.showPassword}
          hideLabel={labels.hidePassword}
          aria-describedby="newPassword-help"
        />
        <FieldDescription id="newPassword-help">
          {labels.newPasswordHelp}
        </FieldDescription>
        <FieldError>{error("newPassword")}</FieldError>
      </Field>

      <Field invalid={Boolean(error("confirmPassword"))}>
        <FieldLabel htmlFor="confirmPassword">{labels.confirmPassword}</FieldLabel>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          showLabel={labels.showPassword}
          hideLabel={labels.hidePassword}
        />
        <FieldError>{error("confirmPassword")}</FieldError>
      </Field>

      <div>
        <SubmitButton pendingLabel={labels.pending}>{labels.submit}</SubmitButton>
      </div>
    </form>
  );
}
