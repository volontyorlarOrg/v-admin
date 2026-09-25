"use client";

import { UserX } from "lucide-react";

import { FormDialog, type FormDialogLabels } from "@/components/forms/form-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { removeCoordinatorAction } from "@/lib/coordinators/actions";

export function RemoveCoordinator({
  coordinatorId,
  candidates,
  needsReassignment,
  labels,
  trigger,
  reassignLabel,
  reassignHelp,
  reassignPlaceholder,
}: {
  coordinatorId: string;
  candidates: Array<{ id: string; name: string }>;
  needsReassignment: boolean;
  labels: FormDialogLabels;
  trigger: string;
  reassignLabel: string;
  reassignHelp: string;
  reassignPlaceholder: string;
}) {
  return (
    <FormDialog
      action={removeCoordinatorAction}
      labels={labels}
      tone="danger"
      size="sm"
      fields={{ id: coordinatorId }}
      trigger={
        <Button type="button" size="sm" variant="danger-outline">
          <UserX aria-hidden="true" />
          {trigger}
        </Button>
      }
    >
      {needsReassignment ? (
        <Field>
          <FieldLabel htmlFor="reassignToCoordinatorId">{reassignLabel}</FieldLabel>
          <NativeSelect
            id="reassignToCoordinatorId"
            name="reassignToCoordinatorId"
            required
            defaultValue=""
            aria-describedby="reassign-help"
          >
            <option value="" disabled>
              {reassignPlaceholder}
            </option>
            {candidates.map((candidate) => (
              <NativeSelectOption key={candidate.id} value={candidate.id}>
                {candidate.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription id="reassign-help">{reassignHelp}</FieldDescription>
        </Field>
      ) : null}
    </FormDialog>
  );
}
