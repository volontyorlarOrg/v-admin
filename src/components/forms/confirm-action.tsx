"use client";

import { useActionState, useState, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { idleResult, type ActionResult } from "@/lib/api/action-result";
import { formError, type MessageCatalog } from "@/lib/forms/messages";

export type ConfirmLabels = {
  trigger: string;
  title: string;
  description: string;
  confirm: string;
  cancel: string;
  pending: string;
  fallbackError: string;
  errors: MessageCatalog;
};

export function ConfirmAction({
  action,
  labels,
  fields = {},
  tone = "primary",
  extra,
}: {
  action: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  labels: ConfirmLabels;
  fields?: Record<string, string>;
  tone?: "primary" | "danger";
  extra?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [result, dispatch] = useActionState(action, idleResult);
  const [seen, setSeen] = useState(result);
  const message = formError(result, labels.errors, labels.fallbackError);

  if (result !== seen) {
    setSeen(result);
    if (result.status === "ok") setOpen(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant={tone === "danger" ? "outline" : "outline"}
          className={
            tone === "danger" ? "text-danger-ink hover:border-danger" : undefined
          }
        >
          {labels.trigger}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.title}</AlertDialogTitle>
          <AlertDialogDescription>{labels.description}</AlertDialogDescription>
        </AlertDialogHeader>

        <form action={dispatch} className="flex flex-col gap-4">
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}

          {extra}

          {message ? <FormMessage tone="error">{message}</FormMessage> : null}

          <AlertDialogFooter>
            <AlertDialogCancel type="button">{labels.cancel}</AlertDialogCancel>
            <SubmitButton size="sm" pendingLabel={labels.pending}>
              {labels.confirm}
            </SubmitButton>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
