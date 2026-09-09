import { describe, expect, it } from "vitest";

import {
  ENTRY_ROUTE,
  HOME_ROUTE,
  PASSWORD_ROUTE,
  appRoutes,
  getRoute,
  guardFor,
  isActivePath,
  localePath,
  navHref,
  navRoutes,
  pathWithoutLocale,
  routeFor,
} from "@/lib/routing/routes";

describe("the route registry", () => {
  it("gives every route a unique key and path", () => {
    const keys = appRoutes.map((route) => route.key);
    const paths = appRoutes.map((route) => route.path);

    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("starts every path with a slash and never with a locale", () => {
    for (const route of appRoutes) {
      expect(route.path.startsWith("/"), route.key).toBe(true);
      expect(route.path).not.toMatch(/^\/(uz|ru|en)\b/);
    }
  });

  it("guards every route outside the auth area with a session", () => {
    for (const route of appRoutes) {
      expect(route.guard, route.key).toBe(route.area === "auth" ? "guest" : "session");
    }
  });

  it("keeps sign-in as the only guest route: there is no signup", () => {
    const guestRoutes = appRoutes.filter((route) => route.guard === "guest");

    expect(guestRoutes.map((route) => route.key)).toEqual([ENTRY_ROUTE]);
    expect(appRoutes.map((route) => route.path)).not.toContain("/signup");
    expect(appRoutes.map((route) => route.path)).not.toContain("/register");
  });

  it("shows only portal sections in the navigation", () => {
    for (const route of navRoutes) {
      expect(route.area, route.key).toBe("portal");
    }
    expect(navRoutes.length).toBeGreaterThan(3);
  });

  it("keeps the account password page out of the navigation", () => {
    expect(getRoute(PASSWORD_ROUTE).inNav).toBe(false);
    expect(getRoute(PASSWORD_ROUTE).path).toBe("/account/change-password");
  });

  it("throws for an unknown key rather than returning a broken link", () => {
    // @ts-expect-error the registry is exhaustive; this proves the guard exists
    expect(() => getRoute("nowhere")).toThrow(/Unknown portal route/);
  });
});

describe("localePath", () => {
  it("prefixes the locale for a plain anchor", () => {
    expect(localePath("uz", HOME_ROUTE)).toBe(`/uz${navHref(HOME_ROUTE)}`);
  });
});

describe("pathWithoutLocale", () => {
  it("strips a leading locale segment", () => {
    expect(pathWithoutLocale("/uz/vacancies")).toBe("/vacancies");
    expect(pathWithoutLocale("/ru")).toBe("/");
  });

  it("leaves a path that carries no locale alone", () => {
    expect(pathWithoutLocale("/vacancies")).toBe("/vacancies");
  });
});

describe("routeFor", () => {
  it("matches the most specific route, not the first one", () => {
    expect(routeFor("/uz/vacancies/new")?.key).toBe(
      appRoutes.find((route) => route.path === "/vacancies/new")?.key,
    );
  });

  it("matches a detail page to its section", () => {
    expect(routeFor("/en/vacancies/abc-123")?.path).toBe("/vacancies");
  });

  it("returns null for an unknown path so the proxy leaves it alone", () => {
    expect(routeFor("/uz/nothing-here")).toBeNull();
  });
});

describe("guardFor", () => {
  it("requires a session for every portal path, including detail pages", () => {
    expect(guardFor("/uz/dashboard")).toBe("session");
    expect(guardFor("/uz/vacancies/abc")).toBe("session");
    expect(guardFor("/uz/account/change-password")).toBe("session");
  });

  it("keeps sign-in for guests", () => {
    expect(guardFor("/uz/login")).toBe("guest");
  });

  it("has no opinion about an unknown path", () => {
    expect(guardFor("/uz/unknown")).toBeNull();
  });
});

describe("isActivePath", () => {
  it("matches a section and its children but not a longer sibling", () => {
    expect(isActivePath("/users", "/users")).toBe(true);
    expect(isActivePath("/users/abc", "/users")).toBe(true);
    expect(isActivePath("/users-archive", "/users")).toBe(false);
  });
});
