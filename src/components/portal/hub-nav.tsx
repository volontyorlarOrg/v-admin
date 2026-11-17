"use client";

import { NavIcon } from "@/components/portal/nav-icon";
import { Link, usePathname } from "@/i18n/navigation";
import { hubFor, isActivePath, type Hub } from "@/lib/routing/routes";
import { cn } from "@/lib/utils";

export type SectionItem = {
  key: string;
  href: string;
  label: string;
  count?: number;
  countLabel?: string;
};

export type HubItem = {
  key: Hub;
  href: string;
  label: string;
  icon: string;
  count?: number;
  countLabel?: string;
  sections: SectionItem[];
};

function HubCount({ value, label }: { value?: number; label?: string }) {
  if (!value) return null;
  return (
    <span className="tabular absolute -top-0.5 left-[calc(50%+0.625rem)] min-w-[1.125rem] rounded-sm bg-warning-muted px-1 text-center text-[0.6875rem] leading-[1.125rem] font-semibold text-warning-ink ring-2 ring-shell">
      {value}
      {label ? <span className="sr-only"> {label}</span> : null}
    </span>
  );
}

export function HubRail({ hubs, label }: { hubs: HubItem[]; label: string }) {
  const current = hubFor(usePathname());

  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-1.5">
        {hubs.map((hub) => {
          const active = hub.key === current;
          return (
            <li key={hub.key}>
              <Link
                href={hub.href}
                aria-current={active ? "true" : undefined}
                className="group relative flex flex-col items-center gap-1 rounded-lg px-0.5 pt-1 pb-1.5 text-center outline-offset-0"
              >
                <span
                  className={cn(
                    "relative flex h-8 w-12 items-center justify-center rounded-lg transition-colors duration-150",
                    active
                      ? "bg-shell-active text-shell-active-ink"
                      : "text-shell-muted group-hover:bg-shell-raised group-hover:text-shell-ink",
                  )}
                >
                  <NavIcon
                    name={hub.icon}
                    strokeWidth={active ? 2.2 : 1.85}
                    className="size-5"
                  />
                </span>
                <HubCount value={hub.count} label={hub.countLabel} />
                <span
                  className={cn(
                    "max-w-full text-[0.6875rem] leading-tight tracking-[-0.01em]",
                    active
                      ? "font-semibold text-shell-ink"
                      : "font-medium text-shell-muted group-hover:text-shell-ink",
                  )}
                >
                  {hub.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function HubBar({ hubs, label }: { hubs: HubItem[]; label: string }) {
  const current = hubFor(usePathname());

  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-shell-line bg-shell pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul
        className="grid h-(--bottombar-height)"
        style={{ gridTemplateColumns: `repeat(${hubs.length}, minmax(0, 1fr))` }}
      >
        {hubs.map((hub) => {
          const active = hub.key === current;
          return (
            <li key={hub.key} className="min-w-0">
              <Link
                href={hub.href}
                aria-current={active ? "true" : undefined}
                className="group relative flex h-full flex-col items-center justify-center gap-1 px-1 text-center outline-offset-[-2px]"
              >
                <span
                  className={cn(
                    "flex h-7 w-11 items-center justify-center rounded-lg transition-colors duration-150",
                    active
                      ? "bg-shell-active text-shell-active-ink"
                      : "text-shell-muted",
                  )}
                >
                  <NavIcon
                    name={hub.icon}
                    strokeWidth={active ? 2.2 : 1.85}
                    className="size-5"
                  />
                </span>
                <HubCount value={hub.count} label={hub.countLabel} />
                <span
                  className={cn(
                    "max-w-full truncate text-[0.6875rem] leading-tight",
                    active
                      ? "font-semibold text-shell-ink"
                      : "font-medium text-shell-muted",
                  )}
                >
                  {hub.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SectionTabs({
  hubs,
  labelFor,
  className,
}: {
  hubs: HubItem[];
  labelFor: Record<string, string>;
  className?: string;
}) {
  const pathname = usePathname();
  const current = hubFor(pathname);
  const hub = hubs.find((item) => item.key === current);
  if (!hub || hub.sections.length < 2) return null;

  return (
    <nav aria-label={labelFor[hub.key]} className={cn("min-w-0", className)}>
      <ul className="relative -mb-px flex h-full min-w-0 [scrollbar-width:none] items-stretch gap-1 overflow-x-auto">
        {hub.sections.map((section) => {
          const active = isActivePath(pathname, section.href);
          return (
            <li key={section.key} className="flex shrink-0">
              <Link
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-2.5 text-sm whitespace-nowrap outline-offset-[-2px] transition-colors duration-150",
                  active
                    ? "border-action font-semibold text-ink"
                    : "border-transparent font-medium text-ink-muted hover:border-border-strong hover:text-ink",
                )}
              >
                {section.label}
                {section.count ? (
                  <span className="tabular min-w-5 rounded-sm bg-warning-muted px-1.5 text-center text-xs leading-5 font-semibold text-warning-ink">
                    {section.count}
                    {section.countLabel ? (
                      <span className="sr-only"> {section.countLabel}</span>
                    ) : null}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function HubTitle({
  hubs,
  fallback,
  className,
}: {
  hubs: HubItem[];
  fallback: string;
  className?: string;
}) {
  const current = hubFor(usePathname());
  const hub = hubs.find((item) => item.key === current);
  return <p className={className}>{hub?.label ?? fallback}</p>;
}
