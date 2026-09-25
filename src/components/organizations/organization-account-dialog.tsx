"use client";

import type { ReactNode } from "react";
import { FormDialog, type FormDialogLabels } from "@/components/forms/form-dialog";
import { PasswordInput } from "@/components/forms/password-input";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import type { ActionResult } from "@/lib/api/action-result";

export function OrganizationAccountDialog({
  action,
  id,
  trigger,
  labels,
  password,
  danger = false,
}: {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  id: string;
  trigger: ReactNode;
  labels: FormDialogLabels & {
    passwordLabel: string;
    passwordHelp: string;
    showPassword: string;
    hidePassword: string;
  };
  password: boolean;
  danger?: boolean;
}) {
  const fieldId = `organization-account-${id}-password`;
  return (
    <FormDialog
      action={action}
      fields={{ id }}
      trigger={trigger}
      labels={labels}
      tone={danger ? "danger" : "primary"}
      fieldLabels={password ? { password: labels.passwordLabel } : {}}
      idFor={() => fieldId}
    >
      {password
        ? ({ error }) => (
            <Field invalid={Boolean(error("password"))}>
              <FieldLabel htmlFor={fieldId}>{labels.passwordLabel}</FieldLabel>
              <PasswordInput
                id={fieldId}
                name="password"
                autoComplete="new-password"
                required
                showLabel={labels.showPassword}
                hideLabel={labels.hidePassword}
                aria-invalid={Boolean(error("password")) || undefined}
                aria-describedby={`${fieldId}-help${error("password") ? ` ${fieldId}-error` : ""}`}
              />
              <FieldDescription id={`${fieldId}-help`}>
                {labels.passwordHelp}
              </FieldDescription>
              <FieldError id={`${fieldId}-error`}>{error("password")}</FieldError>
            </Field>
          )
        : null}
    </FormDialog>
  );
}
