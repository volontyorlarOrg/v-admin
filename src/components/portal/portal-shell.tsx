import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { FixtureBanner } from "@/components/portal/fixture-banner";
import { LocaleSwitcher } from "@/components/portal/locale-switcher";
import { MobileNav } from "@/components/portal/mobile-nav";
import { SidebarNav, type NavItem } from "@/components/portal/sidebar-nav";
import { SignOutForm } from "@/components/portal/sign-out-form";
import { ThemeToggle } from "@/components/portal/theme-toggle";
import { WavesBackground } from "@/components/portal/waves-background";
import { Toaster } from "@/components/ui/sonner";
import { BrandLockup } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { HOME_ROUTE, navHref, navRoutes } from "@/lib/routing/routes";
import type { PublicSession } from "@/lib/auth/session";

export async function PortalShell({
  locale,
  session,
  children,
}: {
  locale: Locale;
  session: PublicSession;
  children: ReactNode;
}) {
  const t = await getTranslations("common");
  const nav = await getTranslations("nav");

  const items: NavItem[] = navRoutes.map((route) => ({
    key: route.key,
    href: route.path,
    label: nav(route.key),
    icon: route.icon,
  }));

  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-action focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-knockout"
      >
        {t("skipToContent")}
      </a>

      <WavesBackground />
      <Toaster />

      <FixtureBanner />

      <header className="sticky top-0 z-30 border-b border-border/70 panel-surface">
        <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6">
          <MobileNav
            items={items}
            navLabel={nav("label")}
            openLabel={t("openMenu")}
            closeLabel={t("closeMenu")}
          />

          <Link
            href={navHref(HOME_ROUTE)}
            className="-m-1 hidden min-w-0 rounded-lg p-1 sm:block"
            aria-label={t("portalName")}
          >
            <BrandLockup name={t("organizationName")} portal={t("portalName")} />
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <p className="hidden max-w-40 truncate text-sm font-medium text-ink-muted sm:block">
              {session.displayName ?? t("signedIn")}
            </p>
            <LocaleSwitcher label={t("language")} />
            <ThemeToggle label={t("theme")} />
            <SignOutForm
              locale={locale}
              label={t("signOut")}
              pendingLabel={t("signingOut")}
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-start">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-(--sidebar-width) shrink-0 border-r border-border/70 px-3 py-5 lg:block">
          <SidebarNav items={items} label={nav("label")} />
        </aside>

        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
