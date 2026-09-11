"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ErrorSummary, type ErrorSummaryItem } from "@/components/forms/error-summary";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  type DialogSize,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { idleResult, type ActionResult } from "@/lib/api/action-result";
import { fieldMessage, fieldsOf, formError } from "@/lib/forms/messages";
import type { FieldErrors } from "@/lib/api/errors";
import type { MessageCatalog } from "@/lib/forms/messages";

export type FormDialogLabels = {
  title: string;
  description?: string;
  submit: string;
  pending: string;
  cancel: string;
  close: string;
  success: string;
  summary: string;
  fallbackError: string;
  errors: MessageCatalog;
};

export type FormDialogState = {
  fields: FieldErrors;
  error: (name: string) => string | undefined;
};

export function FormDialog({
  action,
  labels,
  children,
  trigger,
  open,
  onOpenChange,
  fields = {},
  fieldLabels = {},
  idFor,
  size = "md",
  tone = "primary",
  blocked = false,
  blockedNotice,
}: {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  labels: FormDialogLabels;
  children?: ReactNode | ((state: FormDialogState) => ReactNode);
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (next: boolean) => void;
  fields?: Record<string, string>;
  fieldLabels?: Record<string, string>;
  idFor?: (name: string) => string;
  size?: DialogSize;
  tone?: "primary" | "danger";
  blocked?: boolean;
  blockedNotice?: ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [result, dispatch] = useActionState(action, idleResult);
  const [seen, setSeen] = useState(result);
  const formRef = useRef<HTMLFormElement>(null);

  const isOpen = open ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (open === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  if (result !== seen) {
    setSeen(result);
    if (result.status === "ok") {
      setOpen(false);
      toast.success(labels.success);
    }
  }

  useEffect(() => {
    if (result.status !== "error") return;
    const invalid = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );
    invalid?.focus();
  }, [result]);

  const failedFields = fieldsOf(result);
  const message = formError(result, labels.errors, labels.fallbackError);

  const summaryItems: ErrorSummaryItem[] = Object.entries(failedFields).flatMap(
    ([name, codes]) => {
      const code = codes[0];
      if (!code || !fieldLabels[name]) return [];
      return [
        {
          name,
          label: fieldLabels[name],
          message: labels.errors[code] ?? code,
          ...(idFor ? { id: idFor(name) } : {}),
        },
      ];
    },
  );

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent size={size} closeLabel={labels.close}>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          {labels.description ? (
            <DialogDescription>{labels.description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <form
          ref={formRef}
          action={dispatch}
          noValidate
          data-slot="dialog-form"
          className="flex min-h-0 flex-1 flex-col"
        >
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}

          <DialogBody className="flex flex-col gap-5">
            {blocked ? blockedNotice : null}

            {summaryItems.length > 1 ? (
              <ErrorSummary title={labels.summary} items={summaryItems} />
            ) : null}
            {message ? <FormMessage tone="error">{message}</FormMessage> : null}

            {typeof children === "function"
              ? children({
                  fields: failedFields,
                  error: (name) => fieldMessage(failedFields, name, labels.errors),
                })
              : children}
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm">
                {labels.cancel}
              </Button>
            </DialogClose>
            <SubmitButton
              size="sm"
              disabled={blocked}
              className={
                tone === "danger"
                  ? "bg-danger text-knockout hover:bg-danger-ink"
                  : undefined
              }
              pendingLabel={labels.pending}
            >
              {labels.submit}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
