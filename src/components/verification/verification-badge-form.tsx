"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { idleResult, type ActionResult } from "@/lib/api/action-result";
import {
  removeVerificationBadgeAction,
  uploadVerificationBadgeAction,
} from "@/lib/verification/actions";
import { BADGE_ACCEPT, badgeFileProblem } from "@/lib/verification/badge";

type Labels = {
  title: string;
  help: string;
  current: string;
  none: string;
  file: string;
  upload: string;
  uploading: string;
  remove: string;
  removing: string;
  uploaded: string;
  removed: string;
  error: string;
  errors: Record<string, string>;
};

function failure(result: ActionResult, labels: Labels) {
  if (result.status !== "error") return null;
  return labels.errors[result.code] ?? labels.error;
}

export function VerificationBadgeForm({
  id,
  badgeUrl,
  labels,
}: {
  id: string;
  badgeUrl: string | null;
  labels: Labels;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [uploaded, upload] = useActionState(
    async (previous: ActionResult, data: FormData) => {
      const result = await uploadVerificationBadgeAction(previous, data);
      setPreview(null);
      setProblem(null);
      return result;
    },
    idleResult,
  );
  const [removed, remove] = useActionState(removeVerificationBadgeAction, idleResult);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const shown = preview ?? badgeUrl;
  const message = problem ?? failure(uploaded, labels) ?? failure(removed, labels);

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-ink">{labels.title}</h3>
        <p className="text-sm text-ink-muted">{labels.help}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-sunk">
          {shown ? (
            <Image
              unoptimized
              src={shown}
              alt={preview ? "" : labels.current}
              width={64}
              height={64}
              className="size-14 object-contain"
            />
          ) : (
            <span className="px-1 text-center text-xs text-ink-muted">
              {labels.none}
            </span>
          )}
        </div>
        <form action={upload} className="flex min-w-0 flex-1 flex-col gap-3">
          <input type="hidden" name="id" value={id} />
          <label htmlFor={`${id}-badge`} className="sr-only">
            {labels.file}
          </label>
          <Input
            id={`${id}-badge`}
            name="badge"
            type="file"
            accept={BADGE_ACCEPT}
            required
            className="file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-primary-ink"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              const next = file ? badgeFileProblem(file) : null;
              setProblem(next ? (labels.errors[next] ?? labels.error) : null);
              setPreview(file && !next ? URL.createObjectURL(file) : null);
            }}
          />
          <div>
            <SubmitButton
              size="sm"
              pendingLabel={labels.uploading}
              disabled={problem !== null}
            >
              {labels.upload}
            </SubmitButton>
          </div>
        </form>
      </div>
      {badgeUrl ? (
        <form action={remove}>
          <input type="hidden" name="id" value={id} />
          <SubmitButton
            size="sm"
            variant="danger-outline"
            pendingLabel={labels.removing}
          >
            {labels.remove}
          </SubmitButton>
        </form>
      ) : null}
      {message ? <FormMessage tone="error">{message}</FormMessage> : null}
      {!message && uploaded.status === "ok" ? (
        <FormMessage tone="success">{labels.uploaded}</FormMessage>
      ) : null}
      {!message && removed.status === "ok" ? (
        <FormMessage tone="success">{labels.removed}</FormMessage>
      ) : null}
    </div>
  );
}
