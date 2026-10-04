"use client";

import { Clock, Lock, PencilLine, Trophy, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import type { VacancyKind } from "@/lib/domain/vocabulary";
import { updateRewardsAction } from "@/lib/results/actions";
import type { XpRules } from "@/lib/results/schemas";

const LIMITS: Record<keyof XpRules, number> = {
  xpPerHour: 100,
  xpWinner: 1000,
  xpContributor: 1000,
  xpAttendee: 1000,
  xpNoShowPenalty: 500,
};

function fieldsFor(kind: VacancyKind): Array<keyof XpRules> {
  return kind === "volunteering"
    ? ["xpPerHour", "xpNoShowPenalty"]
    : ["xpWinner", "xpContributor", "xpAttendee", "xpNoShowPenalty"];
}

export function RewardsPanel({
  vacancyId,
  kind,
  rules,
  editable,
}: {
  vacancyId: string;
  kind: VacancyKind;
  rules: XpRules;
  editable: boolean;
}) {
  const t = useTranslations("results.rewards");
  const errors = useTranslations("results.errors");
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<keyof XpRules, string>>(
    () =>
      Object.fromEntries(
        Object.entries(rules).map(([key, value]) => [key, String(value)]),
      ) as Record<keyof XpRules, string>,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fields = fieldsFor(kind);
  const invalid = fields.filter((field) => {
    const value = values[field].trim();
    return !/^\d+$/.test(value) || Number(value) > LIMITS[field];
  });

  const icon = (field: keyof XpRules) =>
    field === "xpPerHour" ? Clock : field === "xpNoShowPenalty" ? UserX : Trophy;

  function save() {
    setError(null);
    startTransition(async () => {
      const next = Object.fromEntries(
        fields.map((field) => [field, Number(values[field])]),
      ) as Partial<XpRules>;
      const result = await updateRewardsAction(vacancyId, { ...rules, ...next });
      if (!result.ok) {
        setError(errors.has(result.code) ? errors(result.code) : errors("generic"));
        return;
      }
      toast.success(t("saved"));
      setOpen(false);
    });
  }

  return (
    <section aria-labelledby={`${formId}-title`} className="sheet px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={`${formId}-title`} className="text-section text-ink">
            {t("title")}
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            {kind === "volunteering" ? t("leadVolunteering") : t("leadCompetition")}
          </p>
        </div>
        {editable ? (
          <Button
            type="button"
            variant="outline"
            size="row"
            onClick={() => setOpen(true)}
          >
            <PencilLine aria-hidden="true" />
            {t("edit")}
          </Button>
        ) : null}
      </div>
      <dl className="mt-3 grid gap-2">
        {fields.map((field) => {
          const Icon = icon(field);
          const value = rules[field];
          return (
            <div
              key={field}
              className="flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5"
            >
              <Icon
                aria-hidden="true"
                className={
                  field === "xpNoShowPenalty"
                    ? "size-4.5 text-danger-ink"
                    : "size-4.5 text-primary-ink"
                }
              />
              <dt className="min-w-0 flex-1 text-sm text-ink-muted">
                {t(`fields.${field}`)}
              </dt>
              <dd className="display-face tabular shrink-0 text-lg whitespace-nowrap text-ink">
                {field === "xpNoShowPenalty"
                  ? t("penaltyValue", { value })
                  : field === "xpPerHour"
                    ? t("hourValue", { value })
                    : t("value", { value })}
              </dd>
            </div>
          );
        })}
      </dl>
      {!editable ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
          <Lock aria-hidden="true" className="size-3.5" />
          {t("locked")}
        </p>
      ) : null}

      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent size="sm" closeLabel={t("close")}>
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
            <DialogDescription className="text-sm text-ink-muted">
              {t("dialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <form
              id={formId}
              onSubmit={(event) => {
                event.preventDefault();
                if (invalid.length === 0) save();
              }}
              className="flex flex-col gap-4"
            >
              {fields.map((field) => (
                <div key={field}>
                  <label
                    htmlFor={`${formId}-${field}`}
                    className="text-sm font-semibold text-ink"
                  >
                    {t(`fields.${field}`)}
                  </label>
                  <Input
                    id={`${formId}-${field}`}
                    inputMode="numeric"
                    value={values[field]}
                    aria-invalid={invalid.includes(field) || undefined}
                    aria-describedby={`${formId}-${field}-help`}
                    onChange={(event) =>
                      setValues((state) => ({ ...state, [field]: event.target.value }))
                    }
                    className="mt-1.5 min-h-11"
                  />
                  <p
                    id={`${formId}-${field}-help`}
                    className={
                      invalid.includes(field)
                        ? "mt-1 text-xs text-danger-ink"
                        : "mt-1 text-xs text-ink-muted"
                    }
                  >
                    {invalid.includes(field)
                      ? t("invalid", { max: LIMITS[field] })
                      : t(`help.${field}`)}
                  </p>
                </div>
              ))}
              {error ? (
                <p role="alert" className="text-sm font-semibold text-danger-ink">
                  {error}
                </p>
              ) : null}
            </form>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              form={formId}
              size="sm"
              disabled={pending || invalid.length > 0}
            >
              {pending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
