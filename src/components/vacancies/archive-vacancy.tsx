"use client";

import { Archive } from "lucide-react";

import { FormDialog, type FormDialogLabels } from "@/components/forms/form-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/api/action-result";

export function ArchiveVacancy({
  vacancyId,
  action,
  labels,
  undecided,
}: {
  vacancyId: string;
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  labels: FormDialogLabels & { trigger: string };
  undecided: number;
}) {
  return (
    <FormDialog
      action={action}
      labels={labels}
      tone="danger"
      size="sm"
      fields={{ id: vacancyId, undecided: String(undecided) }}
      trigger={
        <Button type="button" size="sm" variant="danger-outline">
          <Archive aria-hidden="true" />
          {labels.trigger}
        </Button>
      }
    />
  );
}
