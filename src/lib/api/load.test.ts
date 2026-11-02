import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";
import {
  dataOr,
  failureOf,
  firstFailure,
  loadedFromError,
  mapLoaded,
  ready,
} from "@/lib/api/load";

describe("ready", () => {
  it("marks every successful load as real API data", () => {
    expect(ready([1, 2, 3])).toEqual({
      state: "ready",
      data: [1, 2, 3],
      source: "api",
    });
  });
});

describe("failureOf", () => {
  it("is null for a successful load", () => {
    expect(failureOf(ready("x"))).toBeNull();
  });

  it("hands back the failure a page needs to render", () => {
    expect(failureOf({ state: "expired" })).toEqual({ state: "expired" });
  });
});

describe("loadedFromError", () => {
  const asLoaded = (error: unknown, published = true) =>
    loadedFromError(error, "currentUser", published);

  it("turns 401 into an expired session", () => {
    expect(asLoaded(new ApiError("unauthenticated", { status: 401 }))).toEqual({
      state: "expired",
    });
  });

  it("turns 403 into a denial, never a blank page", () => {
    expect(asLoaded(new ApiError("forbidden", { status: 403 }))).toEqual({
      state: "denied",
    });
  });

  it("separates a required password change from a denial", () => {
    expect(
      asLoaded(
        new ApiError("forbidden", {
          status: 403,
          details: { code: "passwordChangeRequired" },
        }),
      ),
    ).toEqual({ state: "passwordChangeRequired" });
  });

  it("reports a missing record when the endpoint is published", () => {
    expect(asLoaded(new ApiError("notFound", { status: 404 }), true)).toEqual({
      state: "missing",
    });
  });

  it("reports an unrouted 404 on an unpublished endpoint as awaiting its contract", () => {
    expect(asLoaded(new ApiError("notFound", { status: 404 }), false)).toEqual({
      state: "awaitingContract",
      endpoint: "currentUser",
    });
  });

  it("keeps a coded 404 as a missing record, even on an unpublished endpoint", () => {
    expect(
      asLoaded(
        new ApiError("notFound", { status: 404, details: { code: "userNotFound" } }),
        false,
      ),
    ).toEqual({ state: "missing" });
  });

  it("treats an unrouted 501 the same way as an unrouted 404", () => {
    expect(asLoaded(new ApiError("unavailable", { status: 501 }), false)).toEqual({
      state: "awaitingContract",
      endpoint: "currentUser",
    });
  });

  it("keeps a coded 503 as a failure the interface can explain", () => {
    expect(
      asLoaded(
        new ApiError("unavailable", {
          status: 503,
          details: { code: "adminWorkflowsDisabled" },
        }),
        false,
      ),
    ).toMatchObject({ state: "failed", code: "adminWorkflowsDisabled" });
  });

  it("keeps the backend code so the interface never matches on a message", () => {
    expect(
      asLoaded(
        new ApiError("conflict", {
          status: 409,
          details: { code: "coordinatorHasActiveOpportunities" },
        }),
      ),
    ).toEqual({
      state: "failed",
      code: "coordinatorHasActiveOpportunities",
      retryable: false,
    });
  });

  it("marks a network failure retryable", () => {
    expect(asLoaded(new ApiError("network"))).toMatchObject({ retryable: true });
  });

  it("reports a missing API origin as unconfigured rather than as a server fault", () => {
    expect(asLoaded(new ApiError("notConfigured"))).toEqual({ state: "unconfigured" });
  });

  it("never trusts a non-ApiError to describe itself", () => {
    expect(asLoaded(new Error("boom"))).toEqual({
      state: "failed",
      code: "server",
      retryable: false,
    });
  });
});

describe("a failure keeps its request reference", () => {
  it("carries the request id so the screen can quote it", () => {
    expect(
      loadedFromError(
        new ApiError("server", { status: 500, requestId: "abc-123" }),
        "currentUser",
        true,
      ),
    ).toEqual({
      state: "failed",
      code: "server",
      retryable: true,
      requestId: "abc-123",
    });
  });
});

describe("firstFailure", () => {
  it("is null when every load is ready", () => {
    expect(firstFailure(ready(1), ready("two"))).toBeNull();
  });

  it("returns the first failure in the order given", () => {
    expect(firstFailure(ready(1), { state: "denied" }, { state: "missing" })).toEqual({
      state: "denied",
    });
  });
});

describe("dataOr", () => {
  it("returns the data of a ready load", () => {
    expect(dataOr(ready([1]), [])).toEqual([1]);
  });

  it("returns the fallback a page chose when the load failed", () => {
    expect(dataOr({ state: "expired" }, null)).toBeNull();
  });
});

describe("mapLoaded", () => {
  it("reshapes ready data", () => {
    expect(mapLoaded(ready([1, 2]), (items) => ({ items }))).toEqual(
      ready({ items: [1, 2] }),
    );
  });

  it("passes a failure through untouched", () => {
    expect(mapLoaded({ state: "denied" }, () => "never")).toEqual({ state: "denied" });
  });
});
