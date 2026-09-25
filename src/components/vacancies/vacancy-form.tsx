"use client";

import { useActionState } from "react";

import { ErrorSummary, type ErrorSummaryItem } from "@/components/forms/error-summary";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { buttonClass } from "@/components/ui/button";
import {
  VacancyFields,
  type VacancyFieldDefaults,
  type VacancyFieldLabels,
  type VacancyOrganization,
} from "@/components/vacancies/vacancy-fields";
import { Link } from "@/i18n/navigation";
import { idleResult, type ActionResult } from "@/lib/api/action-result";
import { fieldMessage, fieldsOf, formError } from "@/lib/forms/messages";

export type VacancyFormLabels = VacancyFieldLabels & {
  submit: string;
  pending: string;
  success: string;
  summary: string;
  fallbackError: string;
  cancel: string;
};

export type VacancyFormDefaults = VacancyFieldDefaults;

export function VacancyForm({
  action,
  id,
  locale,
  cancelHref,
  labels,
  defaults,
  organizations,
  regions,
  formats,
}: {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  id?: string;
  locale: string;
  cancelHref: string;
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
    <form action={dispatch} noValidate className="flex flex-col sheet">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <input type="hidden" name="locale" value={locale} />

      {result.status === "ok" || summaryItems.length > 1 || message ? (
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4">
          {result.status === "ok" ? (
            <FormMessage tone="success">{labels.success}</FormMessage>
          ) : null}
          {summaryItems.length > 1 ? (
            <ErrorSummary title={labels.summary} items={summaryItems} />
          ) : null}
          {message ? <FormMessage tone="error">{message}</FormMessage> : null}
        </div>
      ) : null}

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

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 rounded-b-[inherit] border-t border-border bg-surface px-5 py-3">
        <Link
          href={cancelHref}
          className={buttonClass({ variant: "ghost", size: "sm" })}
        >
          {labels.cancel}
        </Link>
        <SubmitButton size="sm" pendingLabel={labels.pending}>
          {labels.submit}
        </SubmitButton>
      </div>
    </form>
  );
}
