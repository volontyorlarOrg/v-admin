"use client";

import {
  CircleCheck,
  CircleX,
  Info,
  Pause,
  RotateCcw,
  Send,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

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
import type { CallResult } from "@/lib/results/call.server";
import type { DeskCounts } from "@/lib/results/desk";
import type { SentDecisions } from "@/lib/results/schemas";
import { cn } from "@/lib/utils";

export function SendDecisionsDialog({
  open,
  onOpenChange,
  counts,
  capacity,
  send,
  nameOf,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  counts: DeskCounts;
  capacity: number | null;
  send: () => Promise<CallResult<SentDecisions>>;
  nameOf: (id: string) => string;
}) {
  const t = useTranslations("results.send");
  const errors = useTranslations("results.errors");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const filled = counts.accepted + counts.accept;
  const over = capacity !== null && filled > capacity;

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await send();
      if (result.ok) {
        toast.success(
          t("success", {
            accepted: result.data.accepted,
            rejected: result.data.rejected,
          }),
        );
        onOpenChange(false);
        return;
      }
      if (result.code === "stagedApplicationsChanged") {
        const names = (result.applicationIds ?? []).map(nameOf).join(", ");
        toast.warning(
          t("withdrawnTitle", { count: result.applicationIds?.length ?? 0 }),
          {
            description: t("withdrawnDescription", { names }),
            duration: 12_000,
          },
        );
        onOpenChange(false);
        return;
      }
      setError(errors.has(result.code) ? errors(result.code) : errors("generic"));
    });
  }

  const lines = [
    {
      key: "accepted",
      icon: CircleCheck,
      tone: "text-primary-ink",
      count: counts.accept,
    },
    { key: "rejected", icon: CircleX, tone: "text-danger-ink", count: counts.reject },
    {
      key: "held",
      icon: Pause,
      tone: "text-ink-muted",
      count: counts.hold + counts.undecided,
    },
  ] as const;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
        if (!next) setError(null);
      }}
    >
      <DialogContent size="sm" closeLabel={t("close")} className="sm:max-w-md">
        <DialogHeader>
          <span
            aria-hidden="true"
            className="mb-1 grid size-10 place-items-center rounded-full bg-surface-soft text-primary-ink"
          >
            <Send className="size-4.5" />
          </span>
          <DialogTitle>{t("title", { count: counts.ready })}</DialogTitle>
          <DialogDescription className="text-sm text-ink-muted">
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {lines.map(({ key, icon: Icon, tone, count }) => (
              <li key={key} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <Icon aria-hidden="true" className={cn("size-4.5", tone)} />
                <span className="text-ink">{t(key, { count })}</span>
              </li>
            ))}
            <li className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <Users
                aria-hidden="true"
                className={cn("size-4.5", over ? "text-danger-ink" : "text-ink-muted")}
              />
              <span className={over ? "font-semibold text-danger-ink" : "text-ink"}>
                {capacity === null
                  ? t("acceptedTotal", { count: filled })
                  : t("places", { filled, capacity })}
              </span>
            </li>
          </ul>
          {over ? (
            <p role="alert" className="text-sm text-danger-ink">
              {t("overCapacity", { count: filled - (capacity ?? 0) })}
            </p>
          ) : null}
          <p className="flex gap-2.5 text-sm leading-relaxed text-ink-muted">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {t("notify")}
          </p>
          <p className="flex gap-2.5 rounded-lg bg-surface-soft px-3.5 py-3 text-sm leading-relaxed text-primary-ink">
            <RotateCcw aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {t("recheck")}
          </p>
          {error ? (
            <p role="alert" className="text-sm font-semibold text-danger-ink">
              {error}
            </p>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {t("back")}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending || over || counts.ready === 0}
            onClick={submit}
          >
            <Send aria-hidden="true" />
            {pending ? t("sending") : t("confirm", { count: counts.ready })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
