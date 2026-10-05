"use client";

import { useState } from "react";

import { FormDialog, type FormDialogLabels } from "@/components/forms/form-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input, inputClass } from "@/components/ui/input";
import type { ActionResult } from "@/lib/api/action-result";
import type { ManualPastEvent, Organization } from "@/lib/api/schemas";

export type PastEventLabels = {
  add: string;
  edit: string;
  remove: string;
  noOrganizations: string;
  counted: string;
  notCounted: string;
  countHelp: string;
  removePrompt: string;
  title: string;
  organization: string;
  date: string;
  hours: string;
  xp: string;
  close: string;
  cancel: string;
  pending: string;
  addSuccess: string;
  editSuccess: string;
  removeSuccess: string;
  fallbackError: string;
  errors: Record<string, string>;
};

export function PastEventDialog({
  userId,
  event,
  organizations,
  submissionId,
  action,
  labels,
}: {
  userId: string;
  event?: ManualPastEvent;
  organizations: Organization[];
  submissionId?: string;
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  labels: PastEventLabels;
}) {
  const [counted, setCounted] = useState(event?.countsTowardProgress ?? false);
  const [requestId, setRequestId] = useState(submissionId ?? "");
  const edit = Boolean(event);
  const suffix = event?.id ?? "new";
  const fieldId = (name: string) => `past-event-${suffix}-${name}`;
  const fieldLabels = {
    title: labels.title,
    organizationId: labels.organization,
    eventDate: labels.date,
    hours: labels.hours,
    xpAwarded: labels.xp,
  };
  const dialogLabels: FormDialogLabels = {
    title: edit ? labels.edit : labels.add,
    description: labels.countHelp,
    submit: edit ? labels.edit : labels.add,
    pending: labels.pending,
    cancel: labels.cancel,
    close: labels.close,
    success: edit ? labels.editSuccess : labels.addSuccess,
    summary: labels.fallbackError,
    fallbackError: labels.fallbackError,
    errors: labels.errors,
  };

  return (
    <FormDialog
      action={action}
      onOpenChange={(open) => {
        if (open && !edit) setRequestId(crypto.randomUUID());
      }}
      labels={dialogLabels}
      trigger={
        <Button type="button" variant="outline" size="sm">
          {edit ? labels.edit : labels.add}
        </Button>
      }
      fields={{
        id: userId,
        ...(event ? { eventId: event.id } : { submissionId: requestId }),
      }}
      fieldLabels={fieldLabels}
      idFor={fieldId}
      size="lg"
      blocked={organizations.length === 0}
      blockedNotice={<p className="text-sm text-ink-muted">{labels.noOrganizations}</p>}
    >
      {({ error }) => (
        <>
          <Field invalid={Boolean(error("title"))}>
            <FieldLabel htmlFor={fieldId("title")}>{labels.title}</FieldLabel>
            <Input
              id={fieldId("title")}
              name="title"
              required
              maxLength={160}
              defaultValue={event?.title ?? ""}
              aria-invalid={Boolean(error("title")) || undefined}
            />
            <FieldError id={`${fieldId("title")}-error`}>{error("title")}</FieldError>
          </Field>
          <Field invalid={Boolean(error("organizationId"))}>
            <FieldLabel htmlFor={fieldId("organizationId")}>
              {labels.organization}
            </FieldLabel>
            <select
              id={fieldId("organizationId")}
              name="organizationId"
              required
              defaultValue={event?.organizationId ?? ""}
              className={inputClass}
              aria-invalid={Boolean(error("organizationId")) || undefined}
            >
              <option value="" disabled>
                {labels.organization}
              </option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
            <FieldError id={`${fieldId("organizationId")}-error`}>
              {error("organizationId")}
            </FieldError>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field invalid={Boolean(error("eventDate"))}>
              <FieldLabel htmlFor={fieldId("eventDate")}>{labels.date}</FieldLabel>
              <Input
                id={fieldId("eventDate")}
                name="eventDate"
                type="date"
                required
                defaultValue={event?.eventDate ?? ""}
                aria-invalid={Boolean(error("eventDate")) || undefined}
              />
              <FieldError id={`${fieldId("eventDate")}-error`}>
                {error("eventDate")}
              </FieldError>
            </Field>
            <Field invalid={Boolean(error("hours"))}>
              <FieldLabel htmlFor={fieldId("hours")}>{labels.hours}</FieldLabel>
              <Input
                id={fieldId("hours")}
                name="hours"
                type="number"
                min={0}
                max={999}
                step={0.01}
                required
                defaultValue={event?.hours ?? ""}
                aria-invalid={Boolean(error("hours")) || undefined}
              />
              <FieldError id={`${fieldId("hours")}-error`}>{error("hours")}</FieldError>
            </Field>
          </div>
          <Field>
            <label className="flex items-center gap-3 text-sm font-semibold text-ink">
              <input
                name="countsTowardProgress"
                type="checkbox"
                checked={counted}
                onChange={(change) => setCounted(change.target.checked)}
                className="size-5 accent-[var(--color-action)]"
              />
              {labels.counted}
            </label>
            <FieldDescription>{labels.countHelp}</FieldDescription>
          </Field>
          {counted ? (
            <Field invalid={Boolean(error("xpAwarded"))}>
              <FieldLabel htmlFor={fieldId("xpAwarded")}>{labels.xp}</FieldLabel>
              <Input
                id={fieldId("xpAwarded")}
                name="xpAwarded"
                type="number"
                min={0}
                max={100000}
                step={1}
                defaultValue={event?.xpAwarded ?? 0}
                aria-invalid={Boolean(error("xpAwarded")) || undefined}
              />
              <FieldError id={`${fieldId("xpAwarded")}-error`}>
                {error("xpAwarded")}
              </FieldError>
            </Field>
          ) : null}
        </>
      )}
    </FormDialog>
  );
}

export function RemovePastEventDialog({
  userId,
  eventId,
  action,
  labels,
}: {
  userId: string;
  eventId: string;
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  labels: PastEventLabels;
}) {
  return (
    <FormDialog
      action={action}
      fields={{ id: userId, eventId }}
      labels={{
        title: labels.remove,
        description: labels.removePrompt,
        submit: labels.remove,
        pending: labels.pending,
        cancel: labels.cancel,
        close: labels.close,
        success: labels.removeSuccess,
        summary: labels.fallbackError,
        fallbackError: labels.fallbackError,
        errors: labels.errors,
      }}
      trigger={
        <Button type="button" variant="danger-outline" size="sm">
          {labels.remove}
        </Button>
      }
      tone="danger"
    />
  );
}
