import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { BrandLockup } from "@/components/brand/logo";
import { CountryGround } from "@/components/portal/country-ground";
import { MobileHeader } from "@/components/portal/mobile-header";
import { SidebarFoot } from "@/components/portal/sidebar-foot";
import { SidebarNav, type NavGroupItems } from "@/components/portal/sidebar-nav";
import { Toaster } from "@/components/ui/sonner";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { isReady } from "@/lib/api/load";
import type { PublicSession } from "@/lib/auth/session";
import { HOME_ROUTE, NAV_GROUPS, navGroupRoutes, navHref } from "@/lib/routing/routes";
import { loadStatistics } from "@/lib/statistics/data.server";

export async function PortalShell({
  locale,
  session,
  children,
}: {
  locale: Locale;
  session: PublicSession;
  children: ReactNode;
}) {
  const [common, nav, statistics] = await Promise.all([
    getTranslations("common"),
    getTranslations("nav"),
    loadStatistics(),
  ]);

  const totals = isReady(statistics) ? statistics.data.totals : null;

  const groups: NavGroupItems[] = NAV_GROUPS.map((group) => ({
    key: group,
    items: navGroupRoutes(group).map((route) => ({
      key: route.key,
      href: route.path,
      label: nav(route.key),
      icon: route.icon,
      ...(route.count && totals
        ? { count: totals[route.count], countLabel: nav(`waiting.${route.count}`) }
        : {}),
    })),
  })).filter((group) => group.items.length > 0);

  const home = navHref(HOME_ROUTE);
  const foot = <SidebarFoot locale={locale} session={session} />;

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-action focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-knockout"
      >
        {common("skipToContent")}
      </a>

      <Toaster />

      <div className="hidden lg:block lg:w-(--sidebar-width) lg:shrink-0 lg:border-r lg:border-shell-line lg:bg-shell">
        <aside className="sticky top-0 flex h-dvh flex-col text-shell-ink [&_:focus-visible]:outline-shell-ink">
          <div className="shell-glow px-4 pt-5 pb-4">
            <Link
              href={home}
              className="-m-1 inline-flex max-w-full rounded-lg p-1"
              aria-label={`${common("organizationName")} — ${nav(HOME_ROUTE)}`}
            >
              <BrandLockup
                name={common("organizationName")}
                portal={common("portalName")}
                tone="inverse"
                stacked
              />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pt-1 pb-3">
            <SidebarNav groups={groups} label={nav("label")} />
          </div>

          <div className="border-t border-shell-line px-3 py-3">{foot}</div>
        </aside>
      </div>

      <div className="relative flex min-h-full min-w-0 flex-1 flex-col">
        <CountryGround />

        <MobileHeader
          brand={
            <Link
              href={home}
              className="-m-1 inline-flex min-w-0 rounded-lg p-1"
              aria-label={`${common("organizationName")} — ${nav(HOME_ROUTE)}`}
            >
              <BrandLockup
                name={common("organizationName")}
                portal={common("portalName")}
              />
            </Link>
          }
          drawerBrand={
            <BrandLockup
              name={common("organizationName")}
              portal={common("portalName")}
              tone="inverse"
              stacked
            />
          }
          groups={groups}
          navLabel={nav("label")}
          openLabel={common("openMenu")}
          closeLabel={common("closeMenu")}
          footer={foot}
        />

        <main
          id="main"
          className="mx-auto flex w-full max-w-[80rem] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
