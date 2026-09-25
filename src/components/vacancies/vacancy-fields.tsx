"use client";

import { ShieldAlert } from "lucide-react";
import { useState } from "react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ACCEPTANCE_MODES, type AcceptanceMode } from "@/lib/domain/vocabulary";
import type { MessageCatalog } from "@/lib/forms/messages";

export type VacancyFieldLabels = {
  fields: Record<string, string>;
  help: Record<string, string>;
  regions: Record<string, string>;
  formats: Record<string, string>;
  acceptanceModes: Record<AcceptanceMode, { label: string; description: string }>;
  sections: {
    about: string;
    organization: string;
    place: string;
    when: string;
    volunteers: string;
  };
  sectionHelp: {
    about: string;
    organization: string;
    place: string;
    when: string;
    volunteers: string;
  };
  unverified: string;
  unverifiedNotice: string;
  choose: string;
  errors: MessageCatalog;
};

export type VacancyOrganization = {
  id: string;
  name: string;
  verified: boolean;
};

export type VacancyFieldDefaults = Record<string, string>;

function Section({
  id,
  title,
  help,
  children,
}: {
  id: string;
  title: string;
  help: string;
  children: React.ReactNode;
}) {
  return (
    <section
      role="group"
      aria-labelledby={id}
      className="grid gap-4 border-t border-border px-5 py-6 first:border-t-0 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10"
    >
      <div className="min-w-0">
        <h2 id={id} className="text-section text-ink">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{help}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </section>
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

  const idOf = (name: string) => `${idPrefix}-${name}`;
  const selected = organizations.find((item) => item.id === organizationId);

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
    <div className="flex flex-col">
      <Section
        id={idOf("about")}
        title={labels.sections.about}
        help={labels.sectionHelp.about}
      >
        {text("title", { required: true })}
        {area("description", true)}
      </Section>

      <Section
        id={idOf("organization-section")}
        title={labels.sections.organization}
        help={labels.sectionHelp.organization}
      >
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
            <option value="" disabled>
              {labels.choose}
            </option>
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

      <Section
        id={idOf("place")}
        title={labels.sections.place}
        help={labels.sectionHelp.place}
      >
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
              <NativeSelectOption value="" disabled>
                {labels.choose}
              </NativeSelectOption>
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
              defaultValue={defaults.format ?? ""}
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

          {text("city")}
        </div>
        {text("locationName")}
      </Section>

      <Section
        id={idOf("when")}
        title={labels.sections.when}
        help={labels.sectionHelp.when}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {text("startsAt", { type: "datetime-local", required: true })}
          {text("endsAt", { type: "datetime-local" })}
          {text("applicationDeadline", { type: "datetime-local", required: true })}
        </div>
      </Section>

      <Section
        id={idOf("volunteers")}
        title={labels.sections.volunteers}
        help={labels.sectionHelp.volunteers}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {text("capacity", { type: "number", min: 1, step: 1 })}
          {text("estimatedTotalHours", {
            type: "number",
            min: 0.25,
            max: 100_000,
            step: 0.01,
          })}
        </div>
        <fieldset
          className="flex flex-col gap-2"
          aria-describedby={describedBy("acceptanceMode", error("acceptanceMode"))}
        >
          <legend className="mb-2 text-sm font-semibold text-foreground">
            {labels.fields.acceptanceMode}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {ACCEPTANCE_MODES.map((mode) => (
              <label
                key={mode}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-primary-ink has-checked:border-primary-ink has-checked:bg-surface-soft"
              >
                <input
                  type="radio"
                  name="acceptanceMode"
                  value={mode}
                  defaultChecked={(defaults.acceptanceMode || "manual") === mode}
                  className="mt-0.5 size-4 shrink-0 accent-primary-ink"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">
                    {labels.acceptanceModes[mode].label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-ink-muted">
                    {labels.acceptanceModes[mode].description}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {labels.help.acceptanceMode ? (
            <FieldDescription id={`${idOf("acceptanceMode")}-help`}>
              {labels.help.acceptanceMode}
            </FieldDescription>
          ) : null}
          <FieldError id={`${idOf("acceptanceMode")}-error`}>
            {error("acceptanceMode")}
          </FieldError>
        </fieldset>
        <label className="flex min-h-11 items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3">
          <input
            type="checkbox"
            name="essayRequired"
            defaultChecked={defaults.essayRequired === "on"}
            className="mt-0.5 size-5 shrink-0 accent-action"
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">
              {labels.fields.essayRequired}
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-ink-muted">
              {labels.help.essayRequired}
            </span>
          </span>
        </label>
        {area("requirements")}
      </Section>
    </div>
  );
}
