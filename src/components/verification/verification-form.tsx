"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { idleResult } from "@/lib/api/action-result";
import { updateVerificationAction } from "@/lib/verification/actions";

export function VerificationForm({
  id,
  verified,
  labels,
}: {
  id: string;
  verified: boolean;
  labels: {
    verified: string;
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
