import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { BrandIcon } from "@/components/brand/logo";
import { AccountMenu, ThemeSwitch } from "@/components/portal/account-menu";
import {
  CommandMenu,
  type CommandGroup,
  type CommandSearch,
} from "@/components/portal/command-menu";
import {
  HubBar,
  HubRail,
  HubTitle,
  SectionTabs,
  type HubItem,
} from "@/components/portal/hub-nav";
import { LocaleSwitcher } from "@/components/portal/locale-switcher";
import { NavIcon } from "@/components/portal/nav-icon";
import { SignOutForm } from "@/components/portal/sign-out-form";
import { Toaster } from "@/components/ui/sonner";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { isReady } from "@/lib/api/load";
import {
  ACCOUNT_ROUTES,
  HOME_ROUTE,
  HUB_ICONS,
  HUBS,
  JUMP_CREATE,
  JUMP_SEARCH,
  getRoute,
  hubHref,
  hubRoutes,
  navHref,
} from "@/lib/routing/routes";
import { loadStatistics } from "@/lib/statistics/data.server";

const menuLink =
  "flex min-h-10 items-center gap-3 rounded-md px-2 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-sunk";

export async function PortalShell({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const [common, nav, jump, catalog, statistics] = await Promise.all([
    getTranslations("common"),
    getTranslations("nav"),
    getTranslations("jump"),
    getTranslations(),
    loadStatistics(),
  ]);

  const totals = isReady(statistics) ? statistics.data.totals : null;

  const hubs: HubItem[] = HUBS.map((hub) => {
    const sections = hubRoutes(hub).map((route) => {
      const count = route.count && totals ? totals[route.count] : undefined;
      return {
        key: route.key,
        href: route.path,
        label: nav(route.key),
        ...(count ? { count, countLabel: nav(`waiting.${route.count}`) } : {}),
      };
    });
    const count = sections.reduce((total, section) => total + (section.count ?? 0), 0);
    return {
      key: hub,
      href: hubHref(hub),
      label: nav(`hubs.${hub}`),
      icon: HUB_ICONS[hub],
      sections,
      ...(count ? { count, countLabel: nav("hubWaiting", { count }) } : {}),
    };
  });

  const tabLabels = Object.fromEntries(
    hubs.map((hub) => [hub.key, nav("sectionsOf", { hub: hub.label })]),
  );

  const accountRoutes = ACCOUNT_ROUTES.map(getRoute);

  const groups: CommandGroup[] = [
    {
      key: "pages",
      label: jump("groups.pages"),
      items: [
        ...hubs.flatMap((hub) =>
          hubRoutes(hub.key).map((route) => ({
            key: route.key,
            label: nav(route.key),
            href: route.path,
            icon: route.icon,
            context: hub.label,
          })),
        ),
        ...accountRoutes.map((route) => ({
          key: route.key,
          label: nav(route.key),
          href: route.path,
          icon: route.icon,
          context: nav("account"),
        })),
      ],
    },
    {
      key: "create",
      label: jump("groups.create"),
      items: JUMP_CREATE.map(({ key, label }) => ({
        key,
        label: catalog(label),
        href: navHref(key),
        icon: getRoute(key).icon,
      })),
    },
  ];

  const searches: CommandSearch[] = JUMP_SEARCH.map((key) => ({
    key,
    icon: getRoute(key).icon,
    href: navHref(key),
    template: jump("searchIn", { section: nav(key), query: "{query}" }),
  }));

  const home = navHref(HOME_ROUTE);
  const homeLabel = `${common("organizationName")} — ${nav(HOME_ROUTE)}`;

  const account = (
    <AccountMenu
      label={nav("accountMenu")}
      heading={common("portalName")}
      caption={nav("accountCaption")}
    >
      {accountRoutes.map((route) => (
        <Link key={route.key} href={route.path} className={menuLink}>
          <NavIcon name={route.icon} className="size-4 shrink-0 text-ink-muted" />
          {nav(route.key)}
        </Link>
      ))}
      <div className="my-1 border-t border-border" />
      <LocaleSwitcher label={common("language")} className="px-0.5" />
      <ThemeSwitch label={nav("darkTheme")} />
      <div className="my-1 border-t border-border" />
      <SignOutForm
        locale={locale}
        label={common("signOut")}
        pendingLabel={common("signingOut")}
        tone="menu"
      />
    </AccountMenu>
  );

  return (
    <div className="flex min-h-full flex-1">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-action focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-knockout"
      >
        {common("skipToContent")}
      </a>

      <Toaster />

      <div className="hidden w-(--rail-width) shrink-0 border-r border-shell-line bg-shell lg:block">
        <aside className="sticky top-0 flex h-dvh flex-col items-stretch">
          <div className="flex h-(--topbar-height) shrink-0 items-center justify-center">
            <Link
              href={home}
              aria-label={homeLabel}
              className="inline-flex rounded-lg p-1"
            >
              <BrandIcon className="size-8" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto px-1.5 pt-3 pb-4">
            <HubRail hubs={hubs} label={nav("label")} />
          </div>
        </aside>
      </div>

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-shell-line bg-shell">
          <div className="flex h-(--topbar-height) items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link
              href={home}
              aria-label={homeLabel}
              className="-ml-1 inline-flex shrink-0 rounded-lg p-1 lg:hidden"
            >
              <BrandIcon className="size-7" />
            </Link>
            <HubTitle
              hubs={hubs}
              fallback={nav("account")}
              className="shrink-0 truncate text-[0.9375rem] font-semibold text-ink lg:pr-3"
            />
            <SectionTabs
              hubs={hubs}
              labelFor={tabLabels}
              className="hidden h-full self-stretch lg:block"
            />
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <CommandMenu
                groups={groups}
                searches={searches}
                copy={{
                  open: jump("open"),
                  title: jump("title"),
                  placeholder: jump("placeholder"),
                  empty: jump("empty", { query: "{query}" }),
                  hint: jump("hint"),
                  searchGroup: jump("groups.search"),
                }}
              />
              {account}
            </div>
          </div>
          <SectionTabs
            hubs={hubs}
            labelFor={tabLabels}
            className="h-11 border-t border-shell-line px-2 sm:px-4 lg:hidden"
          />
        </header>

        <main
          id="main"
          className="mx-auto flex w-full max-w-[84rem] flex-1 flex-col gap-6 px-4 pt-5 pb-[calc(var(--bottombar-height)+2rem)] sm:px-6 lg:px-8 lg:pt-8 lg:pb-12"
        >
          {children}
        </main>
      </div>

      <HubBar hubs={hubs} label={nav("label")} />
    </div>
  );
}
