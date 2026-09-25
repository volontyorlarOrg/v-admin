import type { Locale } from "@/i18n/routing";

export const ROUTE_KEYS = [
  "login",
  "dashboard",
  "insights",
  "vacancies",
  "newVacancy",
  "applications",
  "users",
  "attendance",
  "activity",
  "coordinators",
  "newCoordinator",
  "organizations",
  "audit",
  "changePassword",
] as const;

export type RouteKey = (typeof ROUTE_KEYS)[number];

export type RouteArea = "auth" | "portal" | "account";

export type RouteGuard = "guest" | "session";

export const NAV_GROUPS = ["work", "office", "records"] as const;

export const NAV_COUNTS = [
  "pendingApproval",
  "changesRequested",
  "pendingReview",
  "attendanceDue",
] as const;

export type NavCount = (typeof NAV_COUNTS)[number];

export type NavGroup = (typeof NAV_GROUPS)[number];

export type AppRoute = {
  key: RouteKey;
  path: string;
  area: RouteArea;
  guard: RouteGuard;
  inNav: boolean;
  group?: NavGroup;
  count?: NavCount;
  icon: string;
};

export const appRoutes: readonly AppRoute[] = [
  {
    key: "login",
    path: "/login",
    area: "auth",
    guard: "guest",
    inNav: false,
    icon: "log-in",
  },
  {
    key: "dashboard",
    path: "/dashboard",
    area: "portal",
    guard: "session",
    inNav: true,
    group: "work",
    icon: "layout-dashboard",
  },
  {
    key: "insights",
    path: "/insights",
    area: "portal",
    guard: "session",
    inNav: true,
    group: "records",
    icon: "chart-column",
  },
  {
    key: "vacancies",
    path: "/vacancies",
    area: "portal",
    guard: "session",
    inNav: true,
    group: "work",
    count: "pendingApproval",
    icon: "clipboard-list",
  },
  {
    key: "newVacancy",
    path: "/vacancies/new",
    area: "portal",
    guard: "session",
    inNav: false,
    icon: "plus",
  },
  {
    key: "applications",
    path: "/applications",
    area: "portal",
    guard: "session",
    inNav: true,
    group: "work",
    count: "pendingReview",
    icon: "inbox",
  },
  {
    key: "attendance",
    path: "/attendance",
    area: "portal",
    guard: "session",
    inNav: true,
    group: "work",
    count: "attendanceDue",
    icon: "calendar-check",
  },
  {
    key: "users",
    path: "/users",
    area: "portal",
    guard: "session",
    inNav: true,
    group: "work",
    icon: "users",
  },
  {
    key: "activity",
    path: "/activity",
    area: "account",
    guard: "session",
    inNav: false,
    icon: "history",
  },
  {
    key: "coordinators",
    path: "/coordinators",
    area: "portal",
    guard: "session",
    inNav: true,
    group: "office",
    icon: "user-cog",
  },
  {
    key: "newCoordinator",
    path: "/coordinators/new",
    area: "portal",
    guard: "session",
    inNav: false,
    icon: "user-plus",
  },
  {
    key: "organizations",
    path: "/organizations",
    area: "portal",
    guard: "session",
    inNav: true,
    group: "office",
    icon: "building-2",
  },
  {
    key: "audit",
    path: "/audit",
    area: "portal",
    guard: "session",
    inNav: true,
    group: "records",
    icon: "scroll-text",
  },
  {
    key: "changePassword",
    path: "/account/change-password",
    area: "account",
    guard: "session",
    inNav: false,
    icon: "key-round",
  },
] as const;

export const ENTRY_ROUTE: RouteKey = "login";
export const HOME_ROUTE: RouteKey = "dashboard";
export const PASSWORD_ROUTE: RouteKey = "changePassword";

export const navRoutes = appRoutes.filter((route) => route.inNav);

export const ACCOUNT_ROUTES: readonly RouteKey[] = ["activity", "changePassword"];

export function navGroupRoutes(group: NavGroup): AppRoute[] {
  return navRoutes.filter((route) => route.group === group);
}

export function getRoute(key: RouteKey): AppRoute {
  const route = appRoutes.find((candidate) => candidate.key === key);
  if (!route) throw new Error(`Unknown portal route: ${key}`);
  return route;
}

export function navHref(key: RouteKey): string {
  return getRoute(key).path;
}

export function vacancyHref(id: string): string {
  return `${navHref("vacancies")}/${encodeURIComponent(id)}`;
}

export function vacancyEditHref(id: string): string {
  return `${vacancyHref(id)}/edit`;
}

export function applicationHref(id: string): string {
  return `${navHref("applications")}/${encodeURIComponent(id)}`;
}

export function userHref(id: string): string {
  return `${navHref("users")}/${encodeURIComponent(id)}`;
}

export function coordinatorHref(id: string): string {
  return `${navHref("coordinators")}/${encodeURIComponent(id)}`;
}

export function localePath(locale: Locale, key: RouteKey): string {
  return `/${locale}${getRoute(key).path}`;
}

export function isActivePath(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function pathWithoutLocale(pathname: string): string {
  const withoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
  return withoutLocale === "" ? "/" : withoutLocale;
}

export function routeFor(pathname: string): AppRoute | null {
  const path = pathWithoutLocale(pathname);
  const matches = appRoutes.filter((route) => isActivePath(path, route.path));
  return matches.sort((a, b) => b.path.length - a.path.length)[0] ?? null;
}

export function guardFor(pathname: string): RouteGuard | null {
  return routeFor(pathname)?.guard ?? null;
}
