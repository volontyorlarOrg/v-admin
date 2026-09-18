"use client";

import { Check, TriangleAlert } from "lucide-react";

import { FormDialog, type FormDialogLabels } from "@/components/forms/form-dialog";
import {
  ReadinessList,
  type ReadinessLabels,
} from "@/components/vacancies/readiness-list";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { MAX_DECISION_NOTE } from "@/lib/vacancies/approval";
import type { ApprovalRequirement } from "@/lib/vacancies/approval";
import type { ActionResult } from "@/lib/api/action-result";

export type WorkflowActionLabels = FormDialogLabels & { trigger: string };

export type VacancyWorkflowLabels = {
  submit: WorkflowActionLabels;
  publish: WorkflowActionLabels;
  archive: WorkflowActionLabels;
  readinessTitle: string;
  readinessBlocked: string;
  readyLine: string;
  readiness: ReadinessLabels;
};

export type VacancyDecisionLabels = {
  approve: WorkflowActionLabels;
  requestChanges: WorkflowActionLabels;
  reject: WorkflowActionLabels;
  note: string;
  noteHelp: string;
  noteRequiredHelp: string;
};

export type VacancyWorkflowAbilities = {
  submit: boolean;
  publish: boolean;
  approve: boolean;
  requestChanges: boolean;
  reject: boolean;
  archive: boolean;
};

function BlockedNotice({
  title,
  missing,
  labels,
}: {
  title: string;
  missing: readonly ApprovalRequirement[];
  labels: ReadinessLabels;
}) {
  return (
    <div className="rounded-lg border border-danger/40 bg-danger-muted px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-danger-ink">
        <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
        {title}
      </p>
      <ReadinessList missing={missing} labels={labels} className="mt-2" />
    </div>
  );
}

function NoteField({
  id,
  label,
  help,
  invalid,
  required,
}: {
  id: string;
  label: string;
  help: string;
  invalid: string | undefined;
  required: boolean;
}) {
  return (
    <Field invalid={Boolean(invalid)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea
        id={id}
        name="note"
        required={required}
        maxLength={MAX_DECISION_NOTE}
        aria-invalid={Boolean(invalid) || undefined}
        aria-describedby={[`${id}-help`, invalid ? `${id}-error` : null]
          .filter(Boolean)
          .join(" ")}
      />
      <FieldDescription id={`${id}-help`}>{help}</FieldDescription>
      <FieldError id={`${id}-error`}>{invalid}</FieldError>
    </Field>
  );
}

export function VacancyWorkflow({
  vacancyId,
  abilities,
  missing,
  labels,
  decisionLabels,
  submitAction,
  publishAction,
  decideAction,
  archiveAction,
}: {
  vacancyId: string;
  abilities: VacancyWorkflowAbilities;
  missing: readonly ApprovalRequirement[];
  labels: VacancyWorkflowLabels;
  decisionLabels?: VacancyDecisionLabels;
  submitAction?: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  publishAction?: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  decideAction?: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  archiveAction: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
}) {
  const incomplete = missing.length > 0;

  return (
    <>
      {abilities.submit && submitAction ? (
        <FormDialog
          action={submitAction}
          labels={labels.submit}
          fields={{ id: vacancyId }}
          blocked={incomplete}
          blockedNotice={
            <BlockedNotice
              title={labels.readinessBlocked}
              missing={missing}
              labels={labels.readiness}
            />
          }
          trigger={
            <Button type="button" size="sm">
              {labels.submit.trigger}
            </Button>
          }
        >
          {incomplete ? null : (
            <p className="flex items-start gap-2 text-sm text-ink-muted">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0">{labels.readyLine}</span>
            </p>
          )}
        </FormDialog>
      ) : null}

      {abilities.publish && publishAction ? (
        <FormDialog
          action={publishAction}
          labels={labels.publish}
          fields={{ id: vacancyId }}
          blocked={incomplete}
          blockedNotice={
            <BlockedNotice
              title={labels.readinessBlocked}
              missing={missing}
              labels={labels.readiness}
            />
          }
          trigger={
            <Button type="button" size="sm">
              {labels.publish.trigger}
            </Button>
          }
        >
          {incomplete ? null : (
            <p className="flex items-start gap-2 text-sm text-ink-muted">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0">{labels.readyLine}</span>
            </p>
          )}
        </FormDialog>
      ) : null}

      {abilities.approve && decideAction && decisionLabels ? (
        <FormDialog
          action={decideAction}
          labels={decisionLabels.approve}
          fields={{ id: vacancyId, decision: "approve" }}
          blocked={incomplete}
          blockedNotice={
            <BlockedNotice
              title={labels.readinessBlocked}
              missing={missing}
              labels={labels.readiness}
            />
          }
          trigger={
            <Button type="button" size="sm">
              {decisionLabels.approve.trigger}
            </Button>
          }
        >
          {({ error }) => (
            <>
              {incomplete ? null : (
                <p className="flex items-start gap-2 text-sm text-ink-muted">
                  <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span className="min-w-0">{labels.readyLine}</span>
                </p>
              )}
              <NoteField
                id="approve-note"
                label={decisionLabels.note}
                help={decisionLabels.noteHelp}
                invalid={error("note")}
                required={false}
              />
            </>
          )}
        </FormDialog>
      ) : null}

      {abilities.requestChanges && decideAction && decisionLabels ? (
        <FormDialog
          action={decideAction}
          labels={decisionLabels.requestChanges}
          fields={{ id: vacancyId, decision: "request_changes" }}
          fieldLabels={{ note: decisionLabels.note }}
          idFor={() => "request-changes-note"}
          trigger={
            <Button type="button" size="sm" variant="outline">
              {decisionLabels.requestChanges.trigger}
            </Button>
          }
        >
          {({ error }) => (
            <NoteField
              id="request-changes-note"
              label={decisionLabels.note}
              help={decisionLabels.noteRequiredHelp}
              invalid={error("note")}
              required
            />
          )}
        </FormDialog>
      ) : null}

      {abilities.reject && decideAction && decisionLabels ? (
        <FormDialog
          action={decideAction}
          labels={decisionLabels.reject}
          tone="danger"
          fields={{ id: vacancyId, decision: "reject" }}
          fieldLabels={{ note: decisionLabels.note }}
          idFor={() => "reject-note"}
          trigger={
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-danger-ink hover:border-danger hover:text-danger-ink"
            >
              {decisionLabels.reject.trigger}
            </Button>
          }
        >
          {({ error }) => (
            <NoteField
              id="reject-note"
              label={decisionLabels.note}
              help={decisionLabels.noteRequiredHelp}
              invalid={error("note")}
              required
            />
          )}
        </FormDialog>
      ) : null}

      {abilities.archive ? (
        <FormDialog
          action={archiveAction}
          labels={labels.archive}
          tone="danger"
          size="sm"
          fields={{ id: vacancyId }}
          trigger={
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-danger-ink hover:border-danger hover:text-danger-ink"
            >
              {labels.archive.trigger}
            </Button>
          }
        />
      ) : null}
    </>
  );
}
