import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Button, buttonClass } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";

export async function FilterForm({
  action,
  legend,
  searchName = "q",
  searchLabel,
  searchValue,
  children,
  resetHref,
  hideSearch = false,
}: {
  action: string;
  legend: string;
  searchName?: string;
  searchLabel: string;
  searchValue: string;
  children?: ReactNode;
  resetHref: string;
  hideSearch?: boolean;
}) {
  const t = await getTranslations("common");

  return (
    <form
      method="get"
      action={action}
      className="rounded-xl border border-border bg-card px-5 py-4"
    >
      <fieldset className="flex flex-col gap-4">
        <legend className="sr-only">{legend}</legend>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          {hideSearch ? null : (
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Label htmlFor="filter-search">{searchLabel}</Label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-muted"
                />
                <Input
                  id="filter-search"
                  type="search"
                  name={searchName}
                  defaultValue={searchValue}
                  autoComplete="off"
                  className="pl-11"
                />
              </div>
            </div>
          )}

          {children}

          <div className="flex gap-2">
            <Button type="submit" size="sm">
              {t("apply")}
            </Button>
            <Link
              href={resetHref}
              className={buttonClass({ variant: "ghost", size: "sm" })}
            >
              {t("reset")}
            </Link>
          </div>
        </div>
      </fieldset>
    </form>
  );
}

export function FilterSelect({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-2 lg:w-56">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
