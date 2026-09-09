import type { Locale } from "@/i18n/routing";

export const ROUTE_KEYS = [
  "login",
  "dashboard",
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

export type AppRoute = {
  key: RouteKey;
  path: string;
  area: RouteArea;
  guard: RouteGuard;
  inNav: boolean;
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
    icon: "layout-dashboard",
  },
  {
    key: "vacancies",
    path: "/vacancies",
    area: "portal",
    guard: "session",
    inNav: true,
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
    icon: "inbox",
  },
  {
    key: "users",
    path: "/users",
    area: "portal",
    guard: "session",
    inNav: true,
    icon: "users",
  },
  {
    key: "attendance",
    path: "/attendance",
    area: "portal",
    guard: "session",
    inNav: true,
    icon: "calendar-check",
  },
  {
    key: "activity",
    path: "/activity",
    area: "portal",
    guard: "session",
    inNav: true,
    icon: "history",
  },
  {
    key: "coordinators",
    path: "/coordinators",
    area: "portal",
    guard: "session",
    inNav: true,
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
    icon: "building-2",
  },
  {
    key: "audit",
    path: "/audit",
    area: "portal",
    guard: "session",
    inNav: true,
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
