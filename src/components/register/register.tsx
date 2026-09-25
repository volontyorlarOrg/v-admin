import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { compactInputClass } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function Count({
  value,
  label,
  tone = "neutral",
}: {
  value: string | number;
  label?: string;
  tone?: "neutral" | "waiting";
}) {
  return (
    <span
      className={cn(
        "tabular inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
        tone === "waiting"
          ? "bg-surface-soft text-primary-ink"
          : "bg-surface-sunk text-ink-muted",
      )}
    >
      {value}
      {label ? <span className="sr-only"> {label}</span> : null}
    </span>
  );
}

export function Register({
  id,
  title,
  count,
  countLabel,
  countTone,
  description,
  actions,
  toolbar,
  children,
  className,
}: {
  id?: string;
  title?: string;
  count?: string | number;
  countLabel?: string;
  countTone?: "neutral" | "waiting";
  description?: ReactNode;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const titleId = id ? `${id}-title` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={title ? titleId : undefined}
      className={cn("min-w-0 overflow-hidden sheet", className)}
    >
      {title ? (
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-5 py-3.5">
          <h2 id={titleId} className="text-section text-ink">
            {title}
          </h2>
          {count !== undefined ? (
            <Count
              value={count}
              {...(countLabel ? { label: countLabel } : {})}
              {...(countTone ? { tone: countTone } : {})}
            />
          ) : null}
          {actions ? (
            <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
          {description ? (
            <p className="w-full text-sm leading-relaxed text-ink-muted">
              {description}
            </p>
          ) : null}
        </header>
      ) : null}
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
          {toolbar}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export type RegisterTab = {
  key: string;
  label: string;
  href: string;
  count?: number;
  active: boolean;
};

export function RegisterTabs({
  label,
  items,
}: {
  label: string;
  items: RegisterTab[];
}) {
  return (
    <nav aria-label={label} className="-mx-1 max-w-full overflow-x-auto">
      <ul className="flex w-max items-center gap-1 px-1 py-0.5">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition-colors",
                item.active
                  ? "bg-action text-knockout"
                  : "text-ink-muted hover:bg-surface-sunk hover:text-ink",
              )}
            >
              {item.label}
              {item.count !== undefined ? (
                <span
                  className={cn(
                    "tabular text-xs",
                    item.active ? "text-band-copy" : "text-ink-muted",
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function RegisterSearch({
  action,
  label,
  submitLabel,
  value,
  name = "q",
  keep = {},
}: {
  action: string;
  label: string;
  submitLabel: string;
  value: string;
  name?: string;
  keep?: Record<string, string | undefined>;
}) {
  return (
    <form
      method="get"
      action={action}
      role="search"
      className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md"
    >
      {Object.entries(keep).map(([key, kept]) =>
        kept ? <input key={key} type="hidden" name={key} value={kept} /> : null,
      )}
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{label}</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
        />
        <input
          type="search"
          name={name}
          defaultValue={value}
          placeholder={label}
          autoComplete="off"
          className={cn(compactInputClass, "pl-10")}
        />
      </label>
      <Button type="submit" size="sm" variant="outline">
        {submitLabel}
      </Button>
    </form>
  );
}

export function RegisterNote({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 px-5 py-10 sm:items-center sm:text-center">
      <p className="text-section text-ink">{title}</p>
      {description ? (
        <p className="max-w-md text-sm leading-relaxed text-pretty text-ink-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
