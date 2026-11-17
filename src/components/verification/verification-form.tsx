"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { idleResult } from "@/lib/api/action-result";
import { updateVerificationAction } from "@/lib/verification/actions";

export function VerificationForm({
  id,
  verified,
  organizationId,
  organizations,
  labels,
}: {
  id: string;
  verified: boolean;
  organizationId: string | null;
  organizations: { id: string; name: string }[];
  labels: {
    verified: string;
    organization: string;
    none: string;
    save: string;
    saving: string;
    success: string;
    error: string;
  };
}) {
  const [result, action] = useActionState(updateVerificationAction, idleResult);
  return (
    <form action={action} className="flex max-w-lg flex-col gap-5">
      <input type="hidden" name="id" value={id} />
      <label className="flex items-center gap-3 text-sm font-medium text-ink">
        <input
          type="checkbox"
          name="verified"
          defaultChecked={verified}
          className="size-4 accent-action"
        />
        {labels.verified}
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-ink">
        {labels.organization}
        <NativeSelect name="organizationId" defaultValue={organizationId ?? ""}>
          <NativeSelectOption value="">{labels.none}</NativeSelectOption>
          {organizations.map((org) => (
            <NativeSelectOption value={org.id} key={org.id}>
              {org.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </label>
      {result.status === "ok" ? (
        <FormMessage tone="success">{labels.success}</FormMessage>
      ) : null}
      {result.status === "error" ? (
        <FormMessage tone="error">{labels.error}</FormMessage>
      ) : null}
      <div>
        <SubmitButton size="sm" pendingLabel={labels.saving}>
          {labels.save}
        </SubmitButton>
      </div>
    </form>
  );
}
