"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { idleResult, type ActionResult } from "@/lib/api/action-result";
import {
  fieldMessage,
  fieldsOf,
  formError,
  type MessageCatalog,
} from "@/lib/forms/messages";

export type VacancyFormLabels = {
  fields: Record<string, string>;
  help: Record<string, string>;
  regions: Record<string, string>;
  formats: Record<string, string>;
  submit: string;
  pending: string;
  success: string;
  fallbackError: string;
  errors: MessageCatalog;
};

export type VacancyFormDefaults = Record<string, string>;

export function VacancyForm({
  action,
  id,
  labels,
  defaults,
  organizations,
  regions,
  formats,
}: {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  id?: string;
  labels: VacancyFormLabels;
  defaults: VacancyFormDefaults;
  organizations: Array<{ id: string; name: string; verified: boolean }>;
  regions: readonly string[];
  formats: readonly string[];
}) {
  const [result, dispatch] = useActionState(action, idleResult);
  const fields = fieldsOf(result);
  const message = formError(result, labels.errors, labels.fallbackError);
  const error = (name: string) => fieldMessage(fields, name, labels.errors);

  const text = (
    name: string,
    options: {
      type?: string;
      required?: boolean;
      min?: number;
      max?: number;
      step?: number;
    } = {},
  ) => {
    const invalid = error(name);
    return (
      <Field invalid={Boolean(invalid)}>
        <FieldLabel htmlFor={name}>{labels.fields[name]}</FieldLabel>
        <Input
          id={name}
          name={name}
          type={options.type ?? "text"}
          required={options.required}
          min={options.min}
          max={options.max}
          step={options.step}
          defaultValue={defaults[name] ?? ""}
          aria-invalid={Boolean(invalid) || undefined}
          aria-describedby={
            [
              labels.help[name] ? `${name}-help` : null,
              invalid ? `${name}-error` : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        {labels.help[name] ? (
          <FieldDescription id={`${name}-help`}>{labels.help[name]}</FieldDescription>
        ) : null}
        <FieldError id={`${name}-error`}>{invalid}</FieldError>
      </Field>
    );
  };

  const area = (name: string, required = false) => {
    const invalid = error(name);
    return (
      <Field invalid={Boolean(invalid)}>
        <FieldLabel htmlFor={name}>{labels.fields[name]}</FieldLabel>
        <Textarea
          id={name}
          name={name}
          required={required}
          defaultValue={defaults[name] ?? ""}
          aria-invalid={Boolean(invalid) || undefined}
          aria-describedby={
            [
              labels.help[name] ? `${name}-help` : null,
              invalid ? `${name}-error` : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        {labels.help[name] ? (
          <FieldDescription id={`${name}-help`}>{labels.help[name]}</FieldDescription>
        ) : null}
        <FieldError id={`${name}-error`}>{invalid}</FieldError>
      </Field>
    );
  };

  return (
    <form action={dispatch} noValidate className="flex flex-col gap-6">
      {id ? <input type="hidden" name="id" value={id} /> : null}

      {result.status === "ok" ? (
        <FormMessage tone="success">{labels.success}</FormMessage>
      ) : null}
      {message ? <FormMessage tone="error">{message}</FormMessage> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        {text("title", { required: true })}
        {text("slug", { required: true })}
      </div>

      {area("summary", true)}
      {area("description", true)}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field invalid={Boolean(error("organizationId"))}>
          <FieldLabel htmlFor="organizationId">
            {labels.fields.organizationId}
          </FieldLabel>
          <NativeSelect
            id="organizationId"
            name="organizationId"
            required
            defaultValue={defaults.organizationId ?? ""}
            aria-invalid={Boolean(error("organizationId")) || undefined}
            aria-describedby="organizationId-help"
          >
            <option value="" disabled />
            {organizations.map((organization) => (
              <NativeSelectOption key={organization.id} value={organization.id}>
                {organization.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription id="organizationId-help">
            {labels.help.organizationId}
          </FieldDescription>
          <FieldError>{error("organizationId")}</FieldError>
        </Field>

        <Field invalid={Boolean(error("region"))}>
          <FieldLabel htmlFor="region">{labels.fields.region}</FieldLabel>
          <NativeSelect
            id="region"
            name="region"
            required
            defaultValue={defaults.region ?? ""}
          >
            {regions.map((region) => (
              <NativeSelectOption key={region} value={region}>
                {labels.regions[region] ?? region}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError>{error("region")}</FieldError>
        </Field>

        <Field invalid={Boolean(error("format"))}>
          <FieldLabel htmlFor="format">{labels.fields.format}</FieldLabel>
          <NativeSelect
            id="format"
            name="format"
            required
            defaultValue={defaults.format ?? ""}
          >
            {formats.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {labels.formats[value] ?? value}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError>{error("format")}</FieldError>
        </Field>

        {text("city")}
        {text("locationName")}
        {text("capacity", { type: "number", required: true, min: 1, step: 1 })}
        {text("estimatedTotalHours", {
          type: "number",
          required: true,
          min: 0.25,
          max: 100_000,
          step: 0.01,
        })}
        {text("startsAt", { type: "datetime-local", required: true })}
        {text("endsAt", { type: "datetime-local", required: true })}
        {text("applicationDeadline", { type: "datetime-local", required: true })}
      </div>

      {area("requirements")}

      <div>
        <SubmitButton pendingLabel={labels.pending}>{labels.submit}</SubmitButton>
      </div>
    </form>
  );
}
