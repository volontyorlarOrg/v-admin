import { getTranslations } from "next-intl/server";

import { NavIcon } from "@/components/portal/nav-icon";
import { LocaleSwitcher } from "@/components/portal/locale-switcher";
import { SignOutForm } from "@/components/portal/sign-out-form";
import { ThemeToggle } from "@/components/portal/theme-toggle";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ACCOUNT_ROUTES, getRoute } from "@/lib/routing/routes";

export async function SidebarFoot({ locale }: { locale: Locale }) {
  const [common, nav] = await Promise.all([
    getTranslations("common"),
    getTranslations("nav"),
  ]);
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-px">
        {ACCOUNT_ROUTES.map((key) => {
          const route = getRoute(key);
          return (
            <li key={key}>
              <Link
                href={route.path}
                className="flex min-h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-shell-muted transition-colors duration-150 hover:bg-shell-raised hover:text-shell-ink"
              >
                <NavIcon name={route.icon} className="size-[1.125rem] shrink-0" />
                {nav(key)}
              </Link>
            </li>
          );
        })}
        <li>
          <SignOutForm
            locale={locale}
            label={common("signOut")}
            pendingLabel={common("signingOut")}
            tone="shell"
          />
        </li>
      </ul>

      <div className="flex items-center gap-2 px-0.5">
        <LocaleSwitcher label={common("language")} tone="shell" className="flex-1" />
        <ThemeToggle label={common("theme")} tone="shell" />
      </div>
    </div>
  );
}
