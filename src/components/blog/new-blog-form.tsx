"use client";

import { TriangleAlert } from "lucide-react";
import { useActionState, useId } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import type { ActionResult } from "@/lib/api/action-result";
import { createBlogAction } from "@/lib/blog/actions";
import { BLOG_LIMITS, BLOG_LOCALES, type BlogLocale } from "@/lib/blog/content";
import { navHref } from "@/lib/routing/routes";
import { cn } from "@/lib/utils";

export type NewBlogLabels = {
  title: string;
  titleHint: string;
  language: string;
  languageHint: string;
  create: string;
  creating: string;
  cancel: string;
  error: string;
  titleRequired: string;
  names: Record<BlogLocale, string>;
};

export function NewBlogForm({
  uiLocale,
  labels,
}: {
  uiLocale: string;
  labels: NewBlogLabels;
}) {
  const id = useId();
  const [result, action] = useActionState(createBlogAction, {
    status: "idle",
  } as ActionResult);
  const invalid = result.status === "error" && result.code === "validationFailed";
  const defaultLocale = (BLOG_LOCALES as readonly string[]).includes(uiLocale)
    ? uiLocale
    : "uz";
  return (
    <form action={action} className="mt-7 flex max-w-2xl flex-col sheet">
      <input type="hidden" name="uiLocale" value={uiLocale} />
      <div className="flex flex-col gap-6 px-5 py-6 sm:px-8">
        {result.status === "error" && !invalid ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger-muted px-4 py-3 text-sm font-semibold text-danger-ink"
          >
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {labels.error}
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-title`} className="text-sm font-semibold text-ink">
            {labels.title}
          </label>
          <input
            id={`${id}-title`}
            name="title"
            required
            maxLength={BLOG_LIMITS.title}
            autoFocus
            autoComplete="off"
            aria-invalid={invalid || undefined}
            aria-describedby={`${id}-title-help`}
            className={cn(inputClass, "font-serif text-xl")}
          />
          <p
            id={`${id}-title-help`}
            className={cn(
              "text-xs leading-5",
              invalid ? "font-semibold text-danger-ink" : "text-ink-muted",
            )}
          >
            {invalid ? labels.titleRequired : labels.titleHint}
          </p>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold text-ink">
            {labels.language}
          </legend>
          <div className="flex flex-wrap gap-2">
            {BLOG_LOCALES.map((locale) => (
              <label
                key={locale}
                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-border-control px-4 text-sm font-semibold text-ink transition-colors has-checked:border-action has-checked:bg-action has-checked:text-knockout has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary-ink"
              >
                <input
                  type="radio"
                  name="locale"
                  value={locale}
                  defaultChecked={locale === defaultLocale}
                  className="sr-only"
                />
                {labels.names[locale]}
              </label>
            ))}
          </div>
          <p className="text-xs leading-5 text-ink-muted">{labels.languageHint}</p>
        </fieldset>
      </div>
      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 rounded-b-[inherit] border-t border-border bg-surface px-5 py-3 sm:px-8">
        <Link
          href={navHref("blog")}
          className={buttonClass({ size: "sm", variant: "ghost" })}
        >
          {labels.cancel}
        </Link>
        <SubmitButton size="sm" pendingLabel={labels.creating}>
          {labels.create}
        </SubmitButton>
      </div>
    </form>
  );
}
