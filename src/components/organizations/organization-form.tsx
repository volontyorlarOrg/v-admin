"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { idleResult, type ActionResult } from "@/lib/api/action-result";
import {
  fieldMessage,
  fieldsOf,
  formError,
  type MessageCatalog,
} from "@/lib/forms/messages";

export type OrganizationFormLabels = {
  name: string;
  slug: string;
  slugHelp: string;
  logoUrl: string;
  logoUrlHelp: string;
  verified: string;
  verifiedHelp: string;
  submit: string;
  pending: string;
  success: string;
  fallbackError: string;
  errors: MessageCatalog;
};

export function OrganizationForm({
  action,
  id,
  defaults,
  labels,
}: {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  id?: string;
  defaults?: { name: string; slug: string; logoUrl: string; verified: boolean };
  labels: OrganizationFormLabels;
}) {
  const [result, dispatch] = useActionState(action, idleResult);
  const fields = fieldsOf(result);
  const message = formError(result, labels.errors, labels.fallbackError);
  const error = (name: string) => fieldMessage(fields, name, labels.errors);
  const suffix = id ?? "new";

  return (
    <form action={dispatch} noValidate className="flex flex-col gap-5">
      {id ? <input type="hidden" name="id" value={id} /> : null}

      {result.status === "ok" ? (
        <FormMessage tone="success">{labels.success}</FormMessage>
      ) : null}
      {message ? <FormMessage tone="error">{message}</FormMessage> : null}

      <Field invalid={Boolean(error("name"))}>
        <FieldLabel htmlFor={`name-${suffix}`}>{labels.name}</FieldLabel>
        <Input
          id={`name-${suffix}`}
          name="name"
          required
          defaultValue={defaults?.name ?? ""}
        />
        <FieldError>{error("name")}</FieldError>
      </Field>

      {id ? null : (
        <Field invalid={Boolean(error("slug"))}>
          <FieldLabel htmlFor={`slug-${suffix}`}>{labels.slug}</FieldLabel>
          <Input
            id={`slug-${suffix}`}
            name="slug"
            required
            aria-describedby="slug-help"
          />
          <FieldDescription id="slug-help">{labels.slugHelp}</FieldDescription>
          <FieldError>{error("slug")}</FieldError>
        </Field>
      )}

      <Field invalid={Boolean(error("logoUrl"))}>
        <FieldLabel htmlFor={`logoUrl-${suffix}`}>{labels.logoUrl}</FieldLabel>
        <Input
          id={`logoUrl-${suffix}`}
          name="logoUrl"
          type="url"
          inputMode="url"
          defaultValue={defaults?.logoUrl ?? ""}
          aria-describedby={`logoUrl-help-${suffix}`}
        />
        <FieldDescription id={`logoUrl-help-${suffix}`}>
          {labels.logoUrlHelp}
        </FieldDescription>
        <FieldError>{error("logoUrl")}</FieldError>
      </Field>

      <Field>
        <span className="flex items-center gap-3">
          <input
            id={`verified-${suffix}`}
            name="verified"
            type="checkbox"
            defaultChecked={defaults?.verified ?? false}
            className="size-5 accent-[var(--color-action)]"
            aria-describedby={`verified-help-${suffix}`}
          />
          <FieldLabel htmlFor={`verified-${suffix}`}>{labels.verified}</FieldLabel>
        </span>
        <FieldDescription id={`verified-help-${suffix}`}>
          {labels.verifiedHelp}
        </FieldDescription>
      </Field>

      <div>
        <SubmitButton size="sm" pendingLabel={labels.pending}>
          {labels.submit}
        </SubmitButton>
      </div>
    </form>
  );
}
