"use client";

import { TriangleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  pendingLabel,
  cancelLabel,
  closeLabel,
  tone = "primary",
  disabled = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  cancelLabel: string;
  closeLabel: string;
  tone?: "primary" | "danger";
  disabled?: boolean;
  onConfirm: () => Promise<string | null>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function change(next: boolean) {
    if (pending) return;
    setError(null);
    onOpenChange(next);
  }

  async function confirm() {
    setPending(true);
    setError(null);
    const failure = await onConfirm();
    setPending(false);
    if (failure) setError(failure);
    else onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent size="sm" closeLabel={closeLabel}>
        <DialogHeader>
          <DialogTitle className="font-sans text-lg font-semibold">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children || error ? (
          <DialogBody className="flex flex-col gap-4 text-sm text-ink">
            {children}
            {error ? (
              <p
                role="alert"
                className="flex items-start gap-2 font-semibold text-danger-ink"
              >
                <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            ) : null}
          </DialogBody>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => change(false)}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
            size="sm"
            disabled={pending || disabled}
            onClick={() => void confirm()}
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
