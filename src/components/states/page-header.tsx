import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  back,
  meta,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-8",
        className,
      )}
    >
      <div className="min-w-0 sm:max-w-[min(48rem,100%)]">
        {back ? (
          <Link
            href={back.href}
            className="mb-2 -ml-1 inline-flex min-h-7 items-center gap-1 rounded-sm px-1 text-sm font-medium text-ink-muted transition-colors duration-150 hover:text-primary-ink"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {back.label}
          </Link>
        ) : null}
        <h1 className="text-page-compact text-balance text-ink sm:text-page">
          {title}
        </h1>
        {meta ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-ink-muted">
            {meta}
          </div>
        ) : null}
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-pretty text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
