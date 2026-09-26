"use client";

import { useActionState, useId, useState } from "react";

import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  ResolveAttendanceForm,
  type ResolveLabels,
} from "@/components/attendance/resolve-form";
import { StatusBadge, attendanceStatus } from "@/components/portal/status-badge";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { idleResult } from "@/lib/api/action-result";
import { resolveVacancyAttendanceAction } from "@/lib/attendance/actions";
import {
  fieldMessage,
  fieldsOf,
  formError,
  type MessageCatalog,
} from "@/lib/forms/messages";

export type RosterRow = {
  applicationId: string;
  name: string;
  outcome: string;
  outcomeLabel: string;
  resolved: boolean;
  detail: string;
  hours: string;
};

export type RosterLabels = {
  caption: string;
  volunteer: string;
  state: string;
  select: string;
  selectAll: string;
  selected: readonly string[];
  correct: string;
  batchTitle: string;
  batchHelp: string;
  outcome: string;
  outcomes: Record<string, string>;
  hours: string;
  hoursHelp: string;
  submit: string;
  pending: string;
  success: string;
  fallbackError: string;
  errors: MessageCatalog;
  row: ResolveLabels;
};

export function AttendanceRoster({
  vacancyId,
  rows,
  outcomes,
  defaultHours,
  kind = "volunteering",
  labels,
}: {
  vacancyId: string;
  rows: readonly RosterRow[];
  outcomes: readonly string[];
  defaultHours?: string;
  kind?: "volunteering" | "competition";
  labels: RosterLabels;
}) {
  const formId = useId();
  const [result, dispatch] = useActionState(resolveVacancyAttendanceAction, idleResult);
  const [selected, setSelected] = useState<readonly string[]>(() =>
    rows.filter((row) => !row.resolved).map((row) => row.applicationId),
  );

  const fields = fieldsOf(result);
  const message = formError(result, labels.errors, labels.fallbackError);
  const selectionError = fieldMessage(fields, "applicationIds", labels.errors);
  const outcomeError = fieldMessage(fields, "outcome", labels.errors);
  const hoursError = fieldMessage(fields, "confirmedHours", labels.errors);
  const allSelected = selected.length === rows.length && rows.length > 0;

  function toggle(applicationId: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? current.includes(applicationId)
          ? current
          : [...current, applicationId]
        : current.filter((item) => item !== applicationId),
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="-mx-5 overflow-x-auto">
        <Table className="block sm:table">
          <TableCaption className="sr-only">{labels.caption}</TableCaption>
          <TableHeader className="hidden sm:table-header-group">
            <TableRow>
              <TableHead scope="col" className="w-10">
                <label className="flex min-h-11 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? rows.map((row) => row.applicationId)
                          : [],
                      )
                    }
                    className="size-4 accent-primary"
                  />
                  <span className="sr-only">{labels.selectAll}</span>
                </label>
              </TableHead>
              <TableHead scope="col">{labels.volunteer}</TableHead>
              <TableHead scope="col">{labels.state}</TableHead>
              <TableHead scope="col">
                <span className="sr-only">{labels.correct}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="block sm:table-row-group">
            {rows.map((row) => (
              <TableRow
                key={row.applicationId}
                className="grid grid-cols-[2.75rem_minmax(0,1fr)] py-3 sm:table-row sm:py-0"
              >
                <TableCell className="row-span-2 block py-0 pr-0 sm:table-cell sm:py-3 sm:pr-5">
                  <label className="flex min-h-11 items-center gap-2">
                    <input
                      type="checkbox"
                      form={formId}
                      name="applicationIds"
                      value={row.applicationId}
                      checked={selected.includes(row.applicationId)}
                      onChange={(event) =>
                        toggle(row.applicationId, event.target.checked)
                      }
                      className="size-4 accent-primary"
                    />
                    <span className="sr-only">
                      {labels.select} — {row.name}
                    </span>
                  </label>
                </TableCell>
                <TableCell className="block py-1 pl-3 sm:table-cell sm:py-3 sm:pl-5">
                  <span className="font-medium text-ink">{row.name}</span>
                </TableCell>
                <TableCell className="block pt-0 pb-2 pl-3 sm:table-cell sm:py-3 sm:pl-5">
                  <StatusBadge
                    label={row.outcomeLabel}
                    tone={attendanceStatus(row.outcome).tone}
                    icon={attendanceStatus(row.outcome).icon}
                  />
                  {row.detail ? (
                    <span className="tabular mt-0.5 block text-xs text-ink-muted">
                      {row.detail}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="col-span-2 block border-t border-border py-0 sm:table-cell sm:border-0 sm:py-3">
                  <details className="text-sm">
                    <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-ink-muted">
                      {labels.correct}
                    </summary>
                    <div className="pt-3 pb-1">
                      <ResolveAttendanceForm
                        applicationId={row.applicationId}
                        outcomes={outcomes}
                        {...(row.outcome ? { currentOutcome: row.outcome } : {})}
                        {...(row.hours ? { currentHours: row.hours } : {})}
                        labels={labels.row}
                        kind={kind}
                      />
                    </div>
                  </details>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <form
        id={formId}
        action={dispatch}
        noValidate
        className="flex flex-col gap-4 border-t border-border pt-5"
      >
        <input type="hidden" name="vacancyId" value={vacancyId} />
        <input type="hidden" name="kind" value={kind} />

        <div>
          <h3 className="text-section font-semibold text-ink">{labels.batchTitle}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            {labels.batchHelp}
          </p>
        </div>

        {result.status === "ok" ? (
          <FormMessage tone="success">{labels.success}</FormMessage>
        ) : null}
        {message ? <FormMessage tone="error">{message}</FormMessage> : null}
        {selectionError ? (
          <FormMessage tone="error">{selectionError}</FormMessage>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field invalid={Boolean(outcomeError)}>
            <FieldLabel htmlFor={`${formId}-outcome`}>{labels.outcome}</FieldLabel>
            <NativeSelect
              id={`${formId}-outcome`}
              name="outcome"
              required
              defaultValue={outcomes[0]}
            >
              {outcomes.map((outcome) => (
                <NativeSelectOption key={outcome} value={outcome}>
                  {labels.outcomes[outcome] ?? outcome}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError>{outcomeError}</FieldError>
          </Field>

          {kind === "volunteering" ? (
            <Field invalid={Boolean(hoursError)}>
              <FieldLabel htmlFor={`${formId}-hours`}>{labels.hours}</FieldLabel>
              <Input
                id={`${formId}-hours`}
                name="confirmedHours"
                type="number"
                min={0.25}
                max={999}
                step="0.25"
                inputMode="decimal"
                defaultValue={defaultHours}
                aria-describedby={`${formId}-hours-help`}
              />
              <FieldDescription id={`${formId}-hours-help`}>
                {labels.hoursHelp}
              </FieldDescription>
              <FieldError>{hoursError}</FieldError>
            </Field>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton size="sm" pendingLabel={labels.pending}>
            {labels.submit}
          </SubmitButton>
          <p role="status" className="text-sm text-ink-muted">
            {labels.selected[selected.length] ?? ""}
          </p>
        </div>
      </form>
    </div>
  );
}
