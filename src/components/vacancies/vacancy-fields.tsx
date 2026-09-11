"use client";

import { ShieldAlert } from "lucide-react";
import { useState } from "react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { requiresVenue } from "@/lib/vacancies/approval";
import type { VacancyFormat } from "@/lib/domain/vocabulary";
import type { MessageCatalog } from "@/lib/forms/messages";

export type VacancyFieldLabels = {
  fields: Record<string, string>;
  help: Record<string, string>;
  regions: Record<string, string>;
  formats: Record<string, string>;
  sections: {
    about: string;
    organization: string;
    place: string;
    when: string;
    volunteers: string;
  };
  unverified: string;
  unverifiedNotice: string;
  errors: MessageCatalog;
};

export type VacancyOrganization = {
  id: string;
  name: string;
  verified: boolean;
};

export type VacancyFieldDefaults = Record<string, string>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="eyebrow mb-1 text-ink-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

export function VacancyFields({
  labels,
  defaults,
  organizations,
  regions,
  formats,
  error,
  idPrefix = "vacancy",
}: {
  labels: VacancyFieldLabels;
  defaults: VacancyFieldDefaults;
  organizations: readonly VacancyOrganization[];
  regions: readonly string[];
  formats: readonly string[];
  error: (name: string) => string | undefined;
  idPrefix?: string;
}) {
  const [organizationId, setOrganizationId] = useState(defaults.organizationId ?? "");
  const [format, setFormat] = useState(defaults.format ?? "");

  const idOf = (name: string) => `${idPrefix}-${name}`;
  const selected = organizations.find((item) => item.id === organizationId);
  const venue = requiresVenue(format as VacancyFormat);

  const describedBy = (name: string, invalid: string | undefined) =>
    [
      labels.help[name] ? `${idOf(name)}-help` : null,
      invalid ? `${idOf(name)}-error` : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

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
        <FieldLabel htmlFor={idOf(name)}>{labels.fields[name]}</FieldLabel>
        <Input
          id={idOf(name)}
          name={name}
          type={options.type ?? "text"}
          required={options.required}
          min={options.min}
          max={options.max}
          step={options.step}
          defaultValue={defaults[name] ?? ""}
          aria-invalid={Boolean(invalid) || undefined}
          aria-describedby={describedBy(name, invalid)}
        />
        {labels.help[name] ? (
          <FieldDescription id={`${idOf(name)}-help`}>
            {labels.help[name]}
          </FieldDescription>
        ) : null}
        <FieldError id={`${idOf(name)}-error`}>{invalid}</FieldError>
      </Field>
    );
  };

  const area = (name: string, required = false) => {
    const invalid = error(name);
    return (
      <Field invalid={Boolean(invalid)}>
        <FieldLabel htmlFor={idOf(name)}>{labels.fields[name]}</FieldLabel>
        <Textarea
          id={idOf(name)}
          name={name}
          required={required}
          defaultValue={defaults[name] ?? ""}
          aria-invalid={Boolean(invalid) || undefined}
          aria-describedby={describedBy(name, invalid)}
        />
        {labels.help[name] ? (
          <FieldDescription id={`${idOf(name)}-help`}>
            {labels.help[name]}
          </FieldDescription>
        ) : null}
        <FieldError id={`${idOf(name)}-error`}>{invalid}</FieldError>
      </Field>
    );
  };

  return (
    <div className="flex flex-col gap-7">
      <Section title={labels.sections.about}>
        {text("title", { required: true })}
        {text("slug", { required: true })}
        {area("summary", true)}
        {area("description", true)}
      </Section>

      <Section title={labels.sections.organization}>
        <Field invalid={Boolean(error("organizationId"))}>
          <FieldLabel htmlFor={idOf("organizationId")}>
            {labels.fields.organizationId}
          </FieldLabel>
          <NativeSelect
            id={idOf("organizationId")}
            name="organizationId"
            required
            value={organizationId}
            onChange={(event) => setOrganizationId(event.target.value)}
            aria-invalid={Boolean(error("organizationId")) || undefined}
            aria-describedby={describedBy("organizationId", error("organizationId"))}
          >
            <option value="" disabled />
            {organizations.map((organization) => (
              <NativeSelectOption key={organization.id} value={organization.id}>
                {organization.verified
                  ? organization.name
                  : `${organization.name} — ${labels.unverified}`}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription id={`${idOf("organizationId")}-help`}>
            {labels.help.organizationId}
          </FieldDescription>
          <FieldError id={`${idOf("organizationId")}-error`}>
            {error("organizationId")}
          </FieldError>
        </Field>

        {selected && !selected.verified ? (
          <p className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger-muted px-4 py-3 text-sm text-ink">
            <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0">{labels.unverifiedNotice}</span>
          </p>
        ) : null}
      </Section>

      <Section title={labels.sections.place}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field invalid={Boolean(error("region"))}>
            <FieldLabel htmlFor={idOf("region")}>{labels.fields.region}</FieldLabel>
            <NativeSelect
              id={idOf("region")}
              name="region"
              required
              defaultValue={defaults.region ?? ""}
              aria-invalid={Boolean(error("region")) || undefined}
              aria-describedby={describedBy("region", error("region"))}
            >
              {regions.map((region) => (
                <NativeSelectOption key={region} value={region}>
                  {labels.regions[region] ?? region}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError id={`${idOf("region")}-error`}>{error("region")}</FieldError>
          </Field>

          <Field invalid={Boolean(error("format"))}>
            <FieldLabel htmlFor={idOf("format")}>{labels.fields.format}</FieldLabel>
            <NativeSelect
              id={idOf("format")}
              name="format"
              required
              value={format}
              onChange={(event) => setFormat(event.target.value)}
              aria-invalid={Boolean(error("format")) || undefined}
              aria-describedby={describedBy("format", error("format"))}
            >
              {formats.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {labels.formats[value] ?? value}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError id={`${idOf("format")}-error`}>{error("format")}</FieldError>
          </Field>

          {text("city", { required: venue })}
          {text("locationName", { required: true })}
        </div>
      </Section>

      <Section title={labels.sections.when}>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("startsAt", { type: "datetime-local", required: true })}
          {text("endsAt", { type: "datetime-local", required: true })}
          {text("applicationDeadline", { type: "datetime-local", required: true })}
        </div>
      </Section>

      <Section title={labels.sections.volunteers}>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("capacity", { type: "number", required: true, min: 1, step: 1 })}
          {text("estimatedTotalHours", {
            type: "number",
            required: true,
            min: 0.25,
            max: 100_000,
            step: 0.01,
          })}
        </div>
        {area("requirements")}
      </Section>
    </div>
  );
}
