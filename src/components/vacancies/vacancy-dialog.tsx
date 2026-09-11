"use client";

import { useState, type ReactNode } from "react";

import { FormDialog, type FormDialogLabels } from "@/components/forms/form-dialog";
import { buttonClass } from "@/components/ui/button";
import {
  VacancyFields,
  type VacancyFieldDefaults,
  type VacancyFieldLabels,
  type VacancyOrganization,
} from "@/components/vacancies/vacancy-fields";
import type { ActionResult } from "@/lib/api/action-result";

export type VacancyDialogLabels = VacancyFieldLabels & FormDialogLabels;

export function VacancyDialog({
  action,
  labels,
  defaults,
  organizations,
  regions,
  formats,
  id,
  trigger,
  triggerLabel,
  triggerHref,
  open,
  onOpenChange,
}: {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  labels: VacancyDialogLabels;
  defaults: VacancyFieldDefaults;
  organizations: readonly VacancyOrganization[];
  regions: readonly string[];
  formats: readonly string[];
  id?: string;
  trigger?: ReactNode;
  triggerLabel?: string;
  triggerHref?: string;
  open?: boolean;
  onOpenChange?: (next: boolean) => void;
}) {
  const idPrefix = `vacancy-${id ?? "new"}`;
  const [linkOpen, setLinkOpen] = useState(false);
  const asLink = !trigger && Boolean(triggerLabel && triggerHref);

  const controlled = open !== undefined || asLink;
  const isOpen = open ?? linkOpen;
  const setOpen = (next: boolean) => {
    if (open === undefined) setLinkOpen(next);
    onOpenChange?.(next);
  };

  return (
    <>
      {asLink ? (
        <a
          href={triggerHref}
          className={buttonClass({ size: "sm" })}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={(event) => {
            event.preventDefault();
            setOpen(true);
          }}
        >
          {triggerLabel}
        </a>
      ) : null}

      <FormDialog
        action={action}
        labels={labels}
        size="lg"
        fieldLabels={labels.fields}
        idFor={(name) => `${idPrefix}-${name}`}
        {...(id ? { fields: { id } } : {})}
        {...(trigger ? { trigger } : {})}
        {...(controlled ? { open: isOpen, onOpenChange: setOpen } : {})}
      >
        {({ error }) => (
          <VacancyFields
            labels={labels}
            defaults={defaults}
            organizations={organizations}
            regions={regions}
            formats={formats}
            error={error}
            idPrefix={idPrefix}
          />
        )}
      </FormDialog>
    </>
  );
}
