import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { HeaderGround } from "@/components/portal/ground/ground-window";
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
      className={cn("flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-8", className)}
    >
      <div className="min-w-0 lg:max-w-[min(40rem,58%)]">
        {back ? (
          <Link
            href={back.href}
            className="mb-3 -ml-1 inline-flex min-h-8 items-center gap-1.5 rounded-md px-1 text-sm font-semibold text-primary-ink hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {back.label}
          </Link>
        ) : null}
        <h1 className="text-page-compact text-balance text-ink sm:text-page">
          {title}
        </h1>
        {meta ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-muted">
            {meta}
          </div>
        ) : null}
        {description ? (
          <p className="mt-2 max-w-2xl leading-relaxed text-pretty text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      <HeaderGround />
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
