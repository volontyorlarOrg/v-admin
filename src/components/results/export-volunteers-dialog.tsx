"use client";

import { Download, ExternalLink, Info, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import {
  downloadVolunteerExportAction,
  startGoogleSheetsExportAction,
  type ExportFile,
} from "@/lib/exports/actions";
import {
  EXPORT_FORMATS,
  FIELD_GROUPS,
  type ExportField,
  type ExportFormat,
  type ExportList,
  type ExportOptions,
  type FieldGroup,
} from "@/lib/exports/schemas";
import { cn } from "@/lib/utils";

function save(file: ExportFile) {
  const bytes = Uint8Array.from(atob(file.base64), (character) =>
    character.charCodeAt(0),
  );
  const url = URL.createObjectURL(new Blob([bytes], { type: file.type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function ExportVolunteersDialog({
  vacancyId,
  list,
  options,
  count,
  filter,
  query,
  unsaved = false,
}: {
  vacancyId: string;
  list: ExportList;
  options: ExportOptions;
  count: number;
  filter?: string;
  query: string;
  unsaved?: boolean;
}) {
  const t = useTranslations("exports");
  const errors = useTranslations("results.errors");
  const offered = options[list];
  const defaults = offered.filter((field) => field.selected).map((field) => field.key);
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [fields, setFields] = useState<readonly ExportField[]>(defaults);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const offeredKeys = new Set(offered.map((field) => field.key));
  const available = (value: ExportFormat) =>
    value === "google_sheets" ? options.googleSheets : options.formats.includes(value);
  const searched =
    query.trim().length > 0 || (filter !== undefined && filter !== "all");
  const failure = (code: string) =>
    t.has(`errors.${code}`)
      ? t(`errors.${code}`)
      : errors.has(code)
        ? errors(code)
        : errors("generic");

  function toggle(field: ExportField, checked: boolean) {
    setError(null);
    setFields((current) =>
      checked
        ? offered
            .map((item) => item.key)
            .filter((key) => key === field || current.includes(key))
        : current.filter((key) => key !== field),
    );
  }

  function submit() {
    if (fields.length === 0 || count === 0) return;
    setError(null);
    const request = {
      vacancyId,
      list,
      fields: [...fields],
      ...(filter ? { filter } : {}),
      query,
    };
    startTransition(async () => {
      if (format === "google_sheets") {
        const result = await startGoogleSheetsExportAction(request);
        if (!result.ok) {
          setError(failure(result.code));
          return;
        }
        window.location.assign(result.url);
        return;
      }
      const result = await downloadVolunteerExportAction(request, format);
      if (!result.ok) {
        setError(failure(result.code));
        return;
      }
      save(result.file);
      setOpen(false);
      toast.success(t("downloaded", { count: result.file.rows }));
    });
  }

  const groups = (Object.keys(FIELD_GROUPS) as FieldGroup[])
    .map((group) => ({
      group,
      keys: (FIELD_GROUPS[group] as readonly ExportField[]).filter((key) =>
        offeredKeys.has(key),
      ),
    }))
    .filter((entry) => entry.keys.length > 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (next) {
          setFormat("pdf");
          setFields(defaults);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Download aria-hidden="true" />
          {t("trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t("close")} size="lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {count === 0
              ? t("nothing")
              : searched
                ? t("matchingFiltered", { count })
                : t("matching", { count })}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-6">
          <fieldset disabled={pending} className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold text-ink">
              {t("format")}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {EXPORT_FORMATS.map((value) => {
                const enabled = available(value);
                return (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface px-3.5 py-3 transition-[border-color,box-shadow] duration-150",
                      "has-checked:border-action has-checked:shadow-[inset_0_0_0_1px_var(--color-action)]",
                      "has-focus-visible:ring-2 has-focus-visible:ring-ring",
                      "has-disabled:cursor-default has-disabled:opacity-60",
                    )}
                  >
                    <input
                      type="radio"
                      name="export-format"
                      value={value}
                      checked={format === value}
                      disabled={!enabled}
                      onChange={() => {
                        setFormat(value);
                        setError(null);
                      }}
                      className="mt-0.5 size-4 accent-action"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">
                        {t(`formats.${value}`)}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-muted">
                        {enabled ? t(`formatHints.${value}`) : t("googleUnavailable")}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {format === "google_sheets" ? (
              <p className="flex gap-2 text-sm text-ink-muted">
                <ShieldCheck
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary-ink"
                />
                {t("googleNote")}
              </p>
            ) : null}
          </fieldset>

          <fieldset disabled={pending} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <legend className="text-sm font-semibold text-ink">{t("fields")}</legend>
              <Button
                type="button"
                variant="ghost"
                size="row"
                onClick={() => {
                  setFields(defaults);
                  setError(null);
                }}
              >
                {t("reset")}
              </Button>
            </div>
            {groups.map(({ group, keys }) => (
              <div key={group} role="group" aria-labelledby={`export-group-${group}`}>
                <p
                  id={`export-group-${group}`}
                  className="mb-1.5 text-xs font-semibold tracking-wide text-ink-muted uppercase"
                >
                  {t(`groups.${group}`)}
                </p>
                <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                  {keys.map((key) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md py-1.5 text-sm text-ink"
                    >
                      <input
                        type="checkbox"
                        checked={fields.includes(key)}
                        onChange={(event) => toggle(key, event.target.checked)}
                        className="size-4 accent-action"
                      />
                      {t(`field.${key}`)}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {fields.length === 0 ? (
              <p className="text-sm text-danger-ink">{t("noneSelected")}</p>
            ) : null}
          </fieldset>

          {unsaved ? (
            <p className="flex gap-2 text-sm text-warning-ink">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {t("unsaved")}
            </p>
          ) : null}

          <p className="flex gap-2 rounded-lg bg-surface-sunk px-3.5 py-3 text-sm text-ink-muted">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {t("privacy")}
          </p>

          {error ? (
            <p role="alert" className="text-sm text-danger-ink">
              {error}
            </p>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={pending}>
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button
            onClick={submit}
            disabled={
              pending || fields.length === 0 || count === 0 || !available(format)
            }
          >
            {format === "google_sheets" ? (
              <ExternalLink aria-hidden="true" />
            ) : (
              <Download aria-hidden="true" />
            )}
            {pending
              ? t("pending")
              : format === "google_sheets"
                ? t("submitGoogle")
                : t("submitFile", { format: t(`formats.${format}`) })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
