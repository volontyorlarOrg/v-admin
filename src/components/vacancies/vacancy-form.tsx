"use client";

import { useActionState } from "react";

import { ErrorSummary, type ErrorSummaryItem } from "@/components/forms/error-summary";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  VacancyFields,
  type VacancyFieldDefaults,
  type VacancyFieldLabels,
  type VacancyOrganization,
} from "@/components/vacancies/vacancy-fields";
import { idleResult, type ActionResult } from "@/lib/api/action-result";
import { fieldMessage, fieldsOf, formError } from "@/lib/forms/messages";

export type VacancyFormLabels = VacancyFieldLabels & {
  submit: string;
  pending: string;
  success: string;
  summary: string;
  fallbackError: string;
};

export type VacancyFormDefaults = VacancyFieldDefaults;

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
  organizations: readonly VacancyOrganization[];
  regions: readonly string[];
  formats: readonly string[];
}) {
  const [result, dispatch] = useActionState(action, idleResult);
  const fields = fieldsOf(result);
  const message = formError(result, labels.errors, labels.fallbackError);
  const idPrefix = `vacancy-${id ?? "new"}`;

  const summaryItems: ErrorSummaryItem[] = Object.entries(fields).flatMap(
    ([name, codes]) => {
      const code = codes[0];
      if (!code || !labels.fields[name]) return [];
      return [
        {
          name,
          label: labels.fields[name],
          message: labels.errors[code] ?? code,
          id: `${idPrefix}-${name}`,
        },
      ];
    },
  );

  return (
    <form action={dispatch} noValidate className="flex flex-col gap-6">
      {id ? <input type="hidden" name="id" value={id} /> : null}

      {result.status === "ok" ? (
        <FormMessage tone="success">{labels.success}</FormMessage>
      ) : null}
      {summaryItems.length > 1 ? (
        <ErrorSummary title={labels.summary} items={summaryItems} />
      ) : null}
      {message ? <FormMessage tone="error">{message}</FormMessage> : null}

      <VacancyFields
        key={result.status === "error" ? result.submissionId : idPrefix}
        labels={labels}
        defaults={
          result.status === "error" && result.values
            ? { ...defaults, ...result.values }
            : defaults
        }
        organizations={organizations}
        regions={regions}
        formats={formats}
        error={(name) => fieldMessage(fields, name, labels.errors)}
        idPrefix={idPrefix}
      />

      <div>
        <SubmitButton pendingLabel={labels.pending}>{labels.submit}</SubmitButton>
      </div>
    </form>
  );
}
