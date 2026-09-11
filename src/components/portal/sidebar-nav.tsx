"use client";

import { NavIcon } from "@/components/portal/nav-icon";
import { Link, usePathname } from "@/i18n/navigation";
import { isActivePath } from "@/lib/routing/routes";
import { cn } from "@/lib/utils";

export type NavItem = { key: string; href: string; label: string; icon: string };

export function SidebarNav({
  items,
  label,
  onNavigate,
}: {
  items: NavItem[];
  label: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              active
                ? "bg-surface-soft font-semibold text-primary-ink before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary-ink"
                : "text-ink-muted hover:bg-surface-sunk hover:text-ink",
            )}
          >
            <NavIcon name={item.icon} className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
