"use client";

import type { ReactNode } from "react";

import { FormDialog, type FormDialogLabels } from "@/components/forms/form-dialog";
import { PasswordInput } from "@/components/forms/password-input";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/api/action-result";

export type OrganizationDialogLabels = FormDialogLabels & {
  fields: {
    name: string;
    slug: string;
    slugHelp: string;
    password: string;
    passwordHelp: string;
    showPassword: string;
    hidePassword: string;
    logoUrl: string;
    logoUrlHelp: string;
    verified: string;
    verifiedHelp: string;
  };
};

export type OrganizationDefaults = {
  name: string;
  slug: string;
  logoUrl: string;
  verified: boolean;
};

export function OrganizationDialog({
  action,
  labels,
  id,
  defaults,
  trigger,
}: {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  labels: OrganizationDialogLabels;
  id?: string;
  defaults?: OrganizationDefaults;
  trigger: ReactNode;
}) {
  const suffix = id ?? "new";
  const idOf = (name: string) => `organization-${suffix}-${name}`;

  return (
    <FormDialog
      action={action}
      labels={labels}
      trigger={trigger}
      fieldLabels={labels.fields}
      idFor={idOf}
      {...(id ? { fields: { id } } : {})}
    >
      {({ error }) => (
        <>
          <Field invalid={Boolean(error("name"))}>
            <FieldLabel htmlFor={idOf("name")}>{labels.fields.name}</FieldLabel>
            <Input
              id={idOf("name")}
              name="name"
              required
              defaultValue={defaults?.name ?? ""}
              aria-invalid={Boolean(error("name")) || undefined}
              aria-describedby={error("name") ? `${idOf("name")}-error` : undefined}
            />
            <FieldError id={`${idOf("name")}-error`}>{error("name")}</FieldError>
          </Field>

          {id ? null : (
            <Field invalid={Boolean(error("slug"))}>
              <FieldLabel htmlFor={idOf("slug")}>{labels.fields.slug}</FieldLabel>
              <Input
                id={idOf("slug")}
                name="slug"
                autoComplete="off"
                required
                aria-invalid={Boolean(error("slug")) || undefined}
                aria-describedby={`${idOf("slug")}-help${
                  error("slug") ? ` ${idOf("slug")}-error` : ""
                }`}
              />
              <FieldDescription id={`${idOf("slug")}-help`}>
                {labels.fields.slugHelp}
              </FieldDescription>
              <FieldError id={`${idOf("slug")}-error`}>{error("slug")}</FieldError>
            </Field>
          )}

          {id ? null : (
            <Field invalid={Boolean(error("password"))}>
              <FieldLabel htmlFor={idOf("password")}>
                {labels.fields.password}
              </FieldLabel>
              <PasswordInput
                id={idOf("password")}
                name="password"
                autoComplete="new-password"
                required
                showLabel={labels.fields.showPassword}
                hideLabel={labels.fields.hidePassword}
                aria-invalid={Boolean(error("password")) || undefined}
                aria-describedby={`${idOf("password")}-help${
                  error("password") ? ` ${idOf("password")}-error` : ""
                }`}
              />
              <FieldDescription id={`${idOf("password")}-help`}>
                {labels.fields.passwordHelp}
              </FieldDescription>
              <FieldError id={`${idOf("password")}-error`}>
                {error("password")}
              </FieldError>
            </Field>
          )}

          {id ? (
            <Field invalid={Boolean(error("logoUrl"))}>
              <FieldLabel htmlFor={idOf("logoUrl")}>{labels.fields.logoUrl}</FieldLabel>
              <Input
                id={idOf("logoUrl")}
                name="logoUrl"
                type="url"
                inputMode="url"
                defaultValue={defaults?.logoUrl ?? ""}
                aria-invalid={Boolean(error("logoUrl")) || undefined}
                aria-describedby={`${idOf("logoUrl")}-help${
                  error("logoUrl") ? ` ${idOf("logoUrl")}-error` : ""
                }`}
              />
              <FieldDescription id={`${idOf("logoUrl")}-help`}>
                {labels.fields.logoUrlHelp}
              </FieldDescription>
              <FieldError id={`${idOf("logoUrl")}-error`}>
                {error("logoUrl")}
              </FieldError>
            </Field>
          ) : null}

          {id ? (
            <Field>
              <span className="flex items-center gap-3">
                <input
                  id={idOf("verified")}
                  name="verified"
                  type="checkbox"
                  defaultChecked={defaults?.verified ?? false}
                  className="size-5 accent-[var(--color-action)]"
                  aria-describedby={`${idOf("verified")}-help`}
                />
                <FieldLabel htmlFor={idOf("verified")}>
                  {labels.fields.verified}
                </FieldLabel>
              </span>
              <FieldDescription id={`${idOf("verified")}-help`}>
                {labels.fields.verifiedHelp}
              </FieldDescription>
            </Field>
          ) : null}
        </>
      )}
    </FormDialog>
  );
}
