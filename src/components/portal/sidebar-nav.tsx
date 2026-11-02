"use client";

import { NavIcon } from "@/components/portal/nav-icon";
import { Link, usePathname } from "@/i18n/navigation";
import { isActivePath } from "@/lib/routing/routes";
import { cn } from "@/lib/utils";

export type NavItem = {
  key: string;
  href: string;
  label: string;
  icon: string;
  count?: number;
  countLabel?: string;
};

export type NavGroupItems = { key: string; label: string; items: NavItem[] };

export function SidebarNav({
  groups,
  label,
  onNavigate,
}: {
  groups: NavGroupItems[];
  label: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-1">
          <p
            id={`nav-group-${group.key}`}
            className="px-2.5 text-xs font-semibold text-shell-muted"
          >
            {group.label}
          </p>
          <ul
            aria-labelledby={`nav-group-${group.key}`}
            className="flex flex-col gap-px"
          >
            {group.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              const counted = item.count !== undefined && item.count > 0;

              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-h-9 items-center gap-2.5 rounded-md border px-2.5 text-sm transition-colors duration-150",
                      active
                        ? "border-shell-line bg-shell-active font-semibold text-shell-ink"
                        : "border-transparent font-medium text-shell-muted hover:bg-shell-raised hover:text-shell-ink",
                    )}
                  >
                    <NavIcon
                      name={item.icon}
                      strokeWidth={active ? 2.25 : 1.9}
                      className={cn(
                        "size-[1.125rem] shrink-0 transition-colors",
                        active
                          ? "text-shell-active-ink"
                          : "text-shell-muted group-hover:text-shell-ink",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {counted ? (
                      <span className="tabular min-w-5 rounded-sm bg-warning-muted px-1.5 text-center text-xs leading-5 font-semibold text-warning-ink">
                        {item.count}
                        {item.countLabel ? (
                          <span className="sr-only"> {item.countLabel}</span>
                        ) : null}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
