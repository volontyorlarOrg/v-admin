"use client";

import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { idleResult, type ActionResult } from "@/lib/api/action-result";
import {
  fieldMessage,
  fieldsOf,
  formError,
  type MessageCatalog,
} from "@/lib/forms/messages";
import { cn } from "@/lib/utils";

export type DecisionOption = {
  key: string;
  label: string;
  variant?: "primary" | "outline" | "danger-outline";
  fields: Record<string, string>;
  success: string;
  confirm?: { prompt: string; submit: string; danger?: boolean };
  note?: {
    name: string;
    label: string;
    help: string;
    required: boolean;
    submit: string;
    danger?: boolean;
  };
  disabled?: boolean;
  describedBy?: string;
};

export type DecisionLabels = {
  group: string;
  cancel: string;
  pending: string;
  fallbackError: string;
  errors: MessageCatalog;
};

type Action = (previous: ActionResult, formData: FormData) => Promise<ActionResult>;

function Hidden({ fields }: { fields: Record<string, string> }) {
  return (
    <>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </>
  );
}

export function InlineDecision({
  action,
  hidden,
  options,
  labels,
  subject,
  className,
  expandClassName,
}: {
  action: Action;
  hidden: Record<string, string>;
  options: DecisionOption[];
  labels: DecisionLabels;
  subject: string;
  className?: string;
  expandClassName?: string;
}) {
  const noteId = useId();
  const [active, setActive] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult>(idleResult);
  const returnFocus = useRef<string | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const option = options.find((candidate) => candidate.key === active);

  useEffect(() => {
    if (active !== null || !returnFocus.current) return;
    buttons.current.get(returnFocus.current)?.focus();
    returnFocus.current = null;
  }, [active]);

  function open(key: string) {
    setResult(idleResult);
    setActive(key);
  }

  function cancel() {
    returnFocus.current = active;
    setResult(idleResult);
    setActive(null);
  }

  function submit(chosen: DecisionOption) {
    return async (formData: FormData) => {
      const outcome = await action(idleResult, formData);
      if (outcome.status === "ok") {
        toast.success(chosen.success);
        setActive(null);
        setResult(idleResult);
        return;
      }
      setResult(outcome);
    };
  }

  const fields = fieldsOf(result);
  const message = formError(result, labels.errors, labels.fallbackError);
  const noteError = option?.note
    ? fieldMessage(fields, option.note.name, labels.errors)
    : undefined;

  return (
    <>
      <div
        role="group"
        aria-label={`${labels.group}: ${subject}`}
        className={cn("flex flex-wrap items-center gap-2", className)}
      >
        {active === null
          ? options.map((candidate) =>
              candidate.confirm || candidate.note ? (
                <Button
                  key={candidate.key}
                  ref={(element) => {
                    if (element) buttons.current.set(candidate.key, element);
                    else buttons.current.delete(candidate.key);
                  }}
                  type="button"
                  size="row"
                  variant={candidate.variant ?? "outline"}
                  disabled={candidate.disabled}
                  aria-describedby={candidate.describedBy}
                  onClick={() => open(candidate.key)}
                >
                  {candidate.label}
                </Button>
              ) : (
                <form key={candidate.key} action={submit(candidate)}>
                  <Hidden fields={{ ...hidden, ...candidate.fields }} />
                  <SubmitButton
                    size="row"
                    variant={candidate.variant ?? "outline"}
                    disabled={candidate.disabled}
                    aria-describedby={candidate.describedBy}
                    pendingLabel={labels.pending}
                  >
                    {candidate.label}
                  </SubmitButton>
                </form>
              ),
            )
          : null}

        {option?.confirm ? (
          <form action={submit(option)} className="flex flex-wrap items-center gap-2">
            <Hidden fields={{ ...hidden, ...option.fields }} />
            <span className="text-sm font-medium text-ink">
              {option.confirm.prompt}
            </span>
            <SubmitButton
              size="row"
              autoFocus
              variant={option.confirm.danger ? "danger" : "primary"}
              pendingLabel={labels.pending}
            >
              {option.confirm.submit}
            </SubmitButton>
            <Button type="button" size="row" variant="ghost" onClick={cancel}>
              {labels.cancel}
            </Button>
          </form>
        ) : null}

        {option?.note ? (
          <span className="text-sm font-medium text-ink">{option.label}</span>
        ) : null}

        {message && !option?.note ? (
          <p role="alert" className="basis-full text-sm font-medium text-danger-ink">
            {message}
          </p>
        ) : null}
      </div>

      {option?.note ? (
        <form
          action={submit(option)}
          noValidate
          className={cn(
            "flex flex-col gap-3 rounded-lg border border-border bg-surface-sunk/50 p-4",
            expandClassName,
          )}
        >
          <Hidden fields={{ ...hidden, ...option.fields }} />
          {message ? (
            <p role="alert" className="text-sm font-medium text-danger-ink">
              {message}
            </p>
          ) : null}
          <Field invalid={Boolean(noteError)}>
            <FieldLabel htmlFor={noteId}>{option.note.label}</FieldLabel>
            <Textarea
              id={noteId}
              name={option.note.name}
              autoFocus
              required={option.note.required}
              maxLength={2000}
              className="min-h-24"
              aria-invalid={Boolean(noteError) || undefined}
              aria-describedby={`${noteId}-help${noteError ? ` ${noteId}-error` : ""}`}
            />
            <FieldDescription id={`${noteId}-help`}>
              {option.note.help}
            </FieldDescription>
            <FieldError id={`${noteId}-error`}>{noteError}</FieldError>
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <SubmitButton
              size="row"
              variant={option.note.danger ? "danger" : "primary"}
              pendingLabel={labels.pending}
            >
              {option.note.submit}
            </SubmitButton>
            <Button type="button" size="row" variant="ghost" onClick={cancel}>
              {labels.cancel}
            </Button>
          </div>
        </form>
      ) : null}
    </>
  );
}
