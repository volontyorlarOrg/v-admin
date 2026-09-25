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

export type NavGroupItems = { key: string; items: NavItem[] };

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
    <nav aria-label={label} className="flex flex-col">
      {groups.map((group, index) => (
        <ul
          key={group.key}
          className={cn(
            "flex flex-col gap-0.5",
            index > 0 && "mt-3 border-t border-shell-line pt-3",
          )}
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
                    "group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors",
                    active
                      ? "bg-shell-active text-shell-active-ink"
                      : "text-shell-muted hover:bg-shell-raised hover:text-shell-ink",
                  )}
                >
                  <NavIcon
                    name={item.icon}
                    strokeWidth={active ? 2.25 : 2}
                    className={cn(
                      "size-5 shrink-0 transition-colors",
                      active
                        ? "text-shell-active-ink"
                        : "text-shell-muted group-hover:text-shell-ink",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {counted ? (
                    <span
                      className={cn(
                        "tabular min-w-6 rounded-full px-1.5 text-center text-xs leading-5 font-semibold",
                        active
                          ? "bg-shell-active-ink text-shell-active"
                          : "bg-shell-raised text-shell-ink",
                      )}
                    >
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
      ))}
    </nav>
  );
}
