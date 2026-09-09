"use client";

import { ConfirmAction, type ConfirmLabels } from "@/components/forms/confirm-action";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { removeCoordinatorAction } from "@/lib/coordinators/actions";

export function RemoveCoordinator({
  coordinatorId,
  candidates,
  needsReassignment,
  labels,
  reassignLabel,
  reassignHelp,
  reassignPlaceholder,
}: {
  coordinatorId: string;
  candidates: Array<{ id: string; name: string }>;
  needsReassignment: boolean;
  labels: ConfirmLabels;
  reassignLabel: string;
  reassignHelp: string;
  reassignPlaceholder: string;
}) {
  return (
    <ConfirmAction
      action={removeCoordinatorAction}
      tone="danger"
      fields={{ id: coordinatorId }}
      labels={labels}
      extra={
        needsReassignment ? (
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
        ) : null
      }
    />
  );
}
