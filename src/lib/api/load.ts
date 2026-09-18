import type { EndpointName } from "@/lib/api/endpoints";
import { isApiError, type ApiError } from "@/lib/api/errors";

export type Loaded<T> =
  | { state: "ready"; data: T; source: "api" }
  | { state: "awaitingContract"; endpoint: EndpointName }
  | { state: "denied" }
  | { state: "expired" }
  | { state: "passwordChangeRequired" }
  | { state: "missing" }
  | { state: "unconfigured" }
  | { state: "failed"; code: string; retryable: boolean };

export function ready<T>(data: T): Loaded<T> {
  return { state: "ready", data, source: "api" };
}

export function isReady<T>(
  loaded: Loaded<T>,
): loaded is { state: "ready"; data: T; source: "api" } {
  return loaded.state === "ready";
}

export function failureOf<T>(
  loaded: Loaded<T>,
): Exclude<Loaded<T>, { state: "ready" }> | null {
  return isReady(loaded) ? null : loaded;
}

export function loadedFromError<T>(
  error: unknown,
  endpoint: EndpointName,
  published: boolean,
): Loaded<T> {
  if (!isApiError(error)) return { state: "failed", code: "server", retryable: false };

  const apiError: ApiError = error;

  if (apiError.code === "notConfigured") return { state: "unconfigured" };
  if (apiError.code === "unauthenticated") return { state: "expired" };

  if (apiError.code === "forbidden") {
    return apiError.requiresPasswordChange
      ? { state: "passwordChangeRequired" }
      : { state: "denied" };
  }

  const unimplemented = !published && apiError.backendCode === null;

  if (apiError.code === "notFound") {
    return unimplemented
      ? { state: "awaitingContract", endpoint }
      : { state: "missing" };
  }

  if (apiError.code === "unavailable" && unimplemented) {
    return { state: "awaitingContract", endpoint };
  }

  return {
    state: "failed",
    code: apiError.backendCode ?? apiError.code,
    retryable: apiError.isRetryable,
  };
}
