import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export const VACANCY_TABS = ["details", "applications", "attendance"] as const;
export type VacancyTab = (typeof VACANCY_TABS)[number];

export function isVacancyTab(value: string | undefined): value is VacancyTab {
  return (VACANCY_TABS as readonly string[]).includes(value ?? "");
}

export function VacancyTabs({
  label,
  active,
  items,
}: {
  label: string;
  active: VacancyTab;
  items: Array<{ tab: VacancyTab; label: string; href: string; badge?: ReactNode }>;
}) {
  return (
    <nav aria-label={label} className="-mb-2 overflow-x-auto border-b border-border">
      <ul className="flex w-max gap-1">
        {items.map((item) => (
          <li key={item.tab}>
            <Link
              href={item.href}
              scroll={false}
              aria-current={item.tab === active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors",
                item.tab === active
                  ? "border-primary-ink text-primary-ink"
                  : "border-transparent text-ink-muted hover:border-border-control hover:text-ink",
              )}
            >
              {item.label}
              {item.badge}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
