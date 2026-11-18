"use client";

import { useActionState, useState } from "react";
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
    organizationHelp: string;
    none: string;
    save: string;
    saving: string;
    success: string;
    error: string;
  };
}) {
  const [result, action] = useActionState(updateVerificationAction, idleResult);
  const [isVerified, setVerified] = useState(verified);
  return (
    <form action={action} className="flex max-w-lg flex-col gap-5">
      <input type="hidden" name="id" value={id} />
      <label className="flex items-center gap-3 text-sm font-medium text-ink">
        <input
          type="checkbox"
          name="verified"
          checked={isVerified}
          onChange={(event) => setVerified(event.target.checked)}
          className="size-4 accent-action"
        />
        {labels.verified}
      </label>
      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-organization`} className="text-sm font-medium text-ink">
          {labels.organization}
        </label>
        <NativeSelect
          id={`${id}-organization`}
          name="organizationId"
          defaultValue={organizationId ?? ""}
          disabled={!isVerified}
          aria-describedby={`${id}-organization-help`}
        >
          <NativeSelectOption value="">{labels.none}</NativeSelectOption>
          {organizations.map((org) => (
            <NativeSelectOption value={org.id} key={org.id}>
              {org.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <p id={`${id}-organization-help`} className="text-sm text-ink-muted">
          {labels.organizationHelp}
        </p>
      </div>
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
