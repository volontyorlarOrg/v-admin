"use client";

import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Eye,
  Info,
  Link2,
  LoaderCircle,
  Mail,
  RefreshCw,
  Send,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  refreshInstructionsAction,
  retryInstructionsAction,
  sendInstructionsAction,
} from "@/lib/results/actions";
import {
  INSTRUCTIONS_LIMIT,
  TELEGRAM_GROUP_LINK,
  type Instructions,
} from "@/lib/results/schemas";
import { cn } from "@/lib/utils";

export function InstructionsPanel({
  vacancyId,
  vacancyTitle,
  initial,
  sentLabel,
}: {
  vacancyId: string;
  vacancyTitle: string;
  initial: Instructions;
  sentLabel: string | null;
}) {
  const t = useTranslations("results.instructions");
  const errors = useTranslations("results.errors");
  const messageId = useId();
  const linkId = useId();
  const [view, setView] = useState(initial);
  const [message, setMessage] = useState(initial.message ?? "");
  const [link, setLink] = useState(initial.groupLink ?? "");
  const [previewing, setPreviewing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const trimmed = message.trim();
  const linkValid = link.trim() === "" || TELEGRAM_GROUP_LINK.test(link.trim());
  const edited =
    view.sentAt !== null &&
    (trimmed !== (view.message ?? "") || (link.trim() || null) !== view.groupLink);
  const waiting = view.delivery.pending > 0;
  const total =
    view.delivery.sent +
    view.delivery.notConnected +
    view.delivery.failed +
    view.delivery.pending;

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(async () => {
      const result = await refreshInstructionsAction(vacancyId);
      if (result.ok) setView(result.data);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [waiting, view, vacancyId]);

  const sendLabel =
    view.sentAt === null
      ? t("send")
      : edited
        ? t("sendUpdate")
        : view.unsent > 0
          ? t("sendNew", { count: view.unsent })
          : t("allReached");
  const canSend =
    trimmed.length > 0 &&
    linkValid &&
    !pending &&
    (view.sentAt === null || edited || view.unsent > 0);

  function send() {
    setError(null);
    startTransition(async () => {
      const result = await sendInstructionsAction(vacancyId, {
        message: trimmed,
        groupLink: link.trim() || null,
      });
      if (!result.ok) {
        setError(errors.has(result.code) ? errors(result.code) : errors("generic"));
        return;
      }
      setView(result.data);
      toast.success(t("sent"));
    });
  }

  function retry() {
    startTransition(async () => {
      const result = await retryInstructionsAction(vacancyId);
      if (!result.ok) {
        toast.error(errors.has(result.code) ? errors(result.code) : errors("generic"));
        return;
      }
      setView(result.data);
    });
  }

  const statuses = [
    {
      key: "sent",
      icon: CircleCheck,
      tone: "text-primary-ink",
      count: view.delivery.sent,
    },
    {
      key: "notConnected",
      icon: CircleAlert,
      tone: "text-accent-ink",
      count: view.delivery.notConnected,
    },
    {
      key: "failed",
      icon: CircleX,
      tone: "text-danger-ink",
      count: view.delivery.failed,
    },
    {
      key: "pending",
      icon: LoaderCircle,
      tone: "text-ink-muted motion-safe:animate-spin",
      count: view.delivery.pending,
    },
  ] as const;

  return (
    <section aria-labelledby={`${messageId}-title`} className="flex flex-col sheet">
      <header className="border-b border-border px-5 py-4">
        <h2
          id={`${messageId}-title`}
          className="flex items-center gap-2 text-section text-ink"
        >
          <Mail aria-hidden="true" className="size-4.5 text-primary-ink" />
          {t("title")}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">
          {t("description", { count: view.recipients })}
        </p>
      </header>

      <div className="flex flex-col gap-4 px-5 py-4">
        <p className="flex items-center gap-2 text-sm text-ink">
          <Users aria-hidden="true" className="size-4 text-ink-muted" />
          {t("recipients", { count: view.recipients })}
        </p>

        <div>
          <label htmlFor={messageId} className="text-sm font-semibold text-ink">
            {t("message")}
          </label>
          <Textarea
            id={messageId}
            value={message}
            maxLength={INSTRUCTIONS_LIMIT}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={t("messagePlaceholder")}
            className="mt-1.5 min-h-28 text-sm"
          />
          <p className="tabular mt-1 text-right text-xs text-ink-muted">
            {message.length}/{INSTRUCTIONS_LIMIT}
          </p>
        </div>

        <div>
          <label
            htmlFor={linkId}
            className="flex items-center gap-1.5 text-sm font-semibold text-ink"
          >
            <Link2 aria-hidden="true" className="size-4 text-ink-muted" />
            {t("link")}
            <span className="font-normal text-ink-muted">{t("optional")}</span>
          </label>
          <Input
            id={linkId}
            type="url"
            inputMode="url"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://t.me/…"
            aria-invalid={!linkValid || undefined}
            aria-describedby={`${linkId}-help`}
            className="mt-1.5 min-h-10 text-sm"
          />
          <p
            id={`${linkId}-help`}
            className={cn(
              "mt-1 text-xs",
              linkValid ? "text-ink-muted" : "text-danger-ink",
            )}
          >
            {linkValid ? t("linkHelp") : t("linkInvalid")}
          </p>
        </div>

        {error ? (
          <p role="alert" className="text-sm font-semibold text-danger-ink">
            {error}
          </p>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" size="sm" disabled={!canSend} onClick={send}>
            <Send aria-hidden="true" />
            {pending ? t("sending") : sendLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={trimmed.length === 0}
            onClick={() => setPreviewing(true)}
          >
            <Eye aria-hidden="true" />
            {t("preview")}
          </Button>
        </div>
        {edited ? <p className="text-xs text-ink-muted">{t("editedHelp")}</p> : null}
      </div>

      {view.sentAt ? (
        <div className="border-t border-border px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-ink">{t("delivery.title")}</h3>
            {view.delivery.failed > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="row"
                disabled={pending}
                onClick={retry}
              >
                <RefreshCw aria-hidden="true" />
                {t("delivery.retry")}
              </Button>
            ) : null}
          </div>
          {sentLabel ? (
            <p className="mt-0.5 text-xs text-ink-muted">
              {t("delivery.lastSent", { when: sentLabel })}
            </p>
          ) : null}
          <ul className="mt-3 flex flex-col gap-2" aria-live="polite">
            {statuses
              .filter((item) => item.count > 0 || item.key === "sent")
              .map(({ key, icon: Icon, tone, count }) => (
                <li key={key} className="flex items-center gap-2.5 text-sm">
                  <Icon aria-hidden="true" className={cn("size-4.5 shrink-0", tone)} />
                  <span className="text-ink">{t(`delivery.${key}`)}</span>
                  <span className="tabular ml-auto text-ink-muted">
                    {count} / {total}
                  </span>
                </li>
              ))}
          </ul>
          <p className="mt-3 flex gap-2 rounded-lg bg-surface-soft px-3 py-2.5 text-xs leading-relaxed text-primary-ink">
            <Info aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {t("delivery.help")}
          </p>
        </div>
      ) : null}

      <Dialog open={previewing} onOpenChange={setPreviewing}>
        <DialogContent size="sm" closeLabel={t("close")}>
          <DialogHeader>
            <DialogTitle>{t("previewTitle")}</DialogTitle>
          </DialogHeader>
          <DialogBody className="bg-surface-sunk/60">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-surface px-4 py-3 text-sm leading-relaxed shadow-sheet">
              <p className="font-semibold text-ink">
                {t("previewHeading", { title: vacancyTitle })}
              </p>
              <p className="mt-2 whitespace-pre-line text-ink">{trimmed}</p>
              {link.trim() && linkValid ? (
                <p className="mt-2 break-all text-primary-ink underline">
                  {link.trim()}
                </p>
              ) : null}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-ink-muted">
              {t("previewHelp")}
            </p>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </section>
  );
}
