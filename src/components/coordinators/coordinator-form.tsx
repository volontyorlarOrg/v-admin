"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { idleResult } from "@/lib/api/action-result";
import { createCoordinatorAction } from "@/lib/coordinators/actions";
import {
  fieldMessage,
  fieldsOf,
  formError,
  type MessageCatalog,
} from "@/lib/forms/messages";

export type CoordinatorFormLabels = {
  name: string;
  email: string;
  password: string;
  passwordHelp: string;
  showPassword: string;
  hidePassword: string;
  submit: string;
  pending: string;
  success: string;
  fallbackError: string;
  errors: MessageCatalog;
};

export function CoordinatorForm({ labels }: { labels: CoordinatorFormLabels }) {
  const [result, dispatch] = useActionState(createCoordinatorAction, idleResult);
  const fields = fieldsOf(result);
  const message = formError(result, labels.errors, labels.fallbackError);
  const error = (name: string) => fieldMessage(fields, name, labels.errors);

  return (
    <form action={dispatch} noValidate className="flex flex-col gap-5">
      {result.status === "ok" ? (
        <FormMessage tone="success">{labels.success}</FormMessage>
      ) : null}
      {message ? <FormMessage tone="error">{message}</FormMessage> : null}

      <Field invalid={Boolean(error("displayName"))}>
        <FieldLabel htmlFor="displayName">{labels.name}</FieldLabel>
        <Input id="displayName" name="displayName" autoComplete="off" required />
        <FieldError>{error("displayName")}</FieldError>
      </Field>

      <Field invalid={Boolean(error("email"))}>
        <FieldLabel htmlFor="email">{labels.email}</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="off"
          required
        />
        <FieldError>{error("email")}</FieldError>
      </Field>

      <Field invalid={Boolean(error("password"))}>
        <FieldLabel htmlFor="password">{labels.password}</FieldLabel>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          showLabel={labels.showPassword}
          hideLabel={labels.hidePassword}
          aria-describedby="password-help"
        />
        <FieldDescription id="password-help">{labels.passwordHelp}</FieldDescription>
        <FieldError>{error("password")}</FieldError>
      </Field>

      <div>
        <SubmitButton pendingLabel={labels.pending}>{labels.submit}</SubmitButton>
      </div>
    </form>
  );
}
