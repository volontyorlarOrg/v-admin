import { getTranslations } from "next-intl/server";

import { NavIcon } from "@/components/portal/nav-icon";
import { LocaleSwitcher } from "@/components/portal/locale-switcher";
import { SignOutForm } from "@/components/portal/sign-out-form";
import { ThemeToggle } from "@/components/portal/theme-toggle";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { PublicSession } from "@/lib/auth/session";
import { ACCOUNT_ROUTES, getRoute } from "@/lib/routing/routes";
import { initialsOf } from "@/lib/users/initials";

export async function SidebarFoot({
  locale,
  session,
}: {
  locale: Locale;
  session: PublicSession;
}) {
  const [common, nav] = await Promise.all([
    getTranslations("common"),
    getTranslations("nav"),
  ]);
  const name = session.displayName ?? common("signedIn");
  const initials = initialsOf(session.displayName);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-xl border border-shell-line bg-shell-raised/60 px-3 py-2.5">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-muted text-sm font-semibold text-primary-deep outline-2 outline-offset-2 outline-shell-line"
        >
          {initials || "·"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-shell-ink">
            {name}
          </span>
          <span className="block truncate text-xs text-shell-muted">
            {common("roleName")}
          </span>
        </span>
      </div>

      <ul className="flex flex-col gap-0.5">
        {ACCOUNT_ROUTES.map((key) => {
          const route = getRoute(key);
          return (
            <li key={key}>
              <Link
                href={route.path}
                className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-shell-muted transition-colors hover:bg-shell-raised hover:text-shell-ink"
              >
                <NavIcon name={route.icon} className="size-5 shrink-0" />
                {nav(key)}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-2">
        <LocaleSwitcher label={common("language")} tone="shell" className="flex-1" />
        <ThemeToggle label={common("theme")} tone="shell" />
      </div>

      <SignOutForm
        locale={locale}
        label={common("signOut")}
        pendingLabel={common("signingOut")}
        tone="shell"
      />
    </div>
  );
}
