"use client";

import { Undo2 } from "lucide-react";

import { FormDialog, type FormDialogLabels } from "@/components/forms/form-dialog";
import { Button } from "@/components/ui/button";
import { revokeBulkAwardAction } from "@/lib/bulk-awards/actions";

export function RevokeAward({
  awardId,
  trigger,
  consequence,
  labels,
}: {
  awardId: string;
  trigger: string;
  consequence: string;
  labels: FormDialogLabels;
}) {
  return (
    <FormDialog
      action={revokeBulkAwardAction}
      labels={labels}
      tone="danger"
      size="sm"
      fields={{ id: awardId }}
      trigger={
        <Button type="button" variant="danger-outline" size="sm">
          <Undo2 aria-hidden="true" />
          {trigger}
        </Button>
      }
    >
      <p className="text-sm leading-relaxed text-ink">{consequence}</p>
    </FormDialog>
  );
}
