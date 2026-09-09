import "server-only";

import createClient, { type Client, type Middleware } from "openapi-fetch";
import type { z } from "zod";

import { ApiError, classifyApiError, codeForStatus } from "@/lib/api/errors";
import type { paths } from "@/lib/api/generated/schema";
import { apiBaseUrl } from "@/lib/auth/config";

const DEFAULT_TIMEOUT_MS = 30_000;
const REQUEST_ID_HEADER = "X-Request-Id";

type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | readonly string[]>;

export type ApiPath = Extract<keyof paths, string> | (string & {});

export type ApiRequest<TSchema extends z.ZodType | undefined = undefined> = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: QueryParams;
  body?: unknown;
  schema?: TSchema;
  timeoutMs?: number;
  signal?: AbortSignal;
  accessToken?: string;
};

type ApiResult<TSchema extends z.ZodType | undefined> = TSchema extends z.ZodType
  ? z.infer<TSchema>
  : unknown;

type RawRequest = (
  method: string,
  path: string,
  init: {
    params: { query: Record<string, unknown> };
    body?: unknown;
    headers?: Record<string, string>;
    signal: AbortSignal;
    parseAs: "text";
    fetch: (request: Request) => Promise<Response>;
  },
) => Promise<{ data?: unknown; error?: unknown; response: Response }>;

function requestIdOf(request: Request): string {
  return request.headers.get(REQUEST_ID_HEADER) ?? "";
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

const identifyRequest: Middleware = {
  onRequest({ request }) {
    if (!request.headers.has(REQUEST_ID_HEADER)) {
      request.headers.set(REQUEST_ID_HEADER, crypto.randomUUID());
    }
    request.headers.set("Accept", "application/json");
    return request;
  },
};

const classifyFailure: Middleware = {
  async onResponse({ request, response }) {
    if (response.ok) return undefined;

    const text = await response.clone().text();
    throw new ApiError(codeForStatus(response.status), {
      status: response.status,
      requestId: requestIdOf(request),
      details: text ? parseJson(text) : null,
    });
  },
  onError({ request, error }) {
    const classified = classifyApiError(error);
    return new ApiError(classified.code, {
      cause: error,
      requestId: requestIdOf(request),
    });
  },
};

let cachedClient: { baseUrl: string; client: Client<paths> } | null = null;

function clientFor(baseUrl: string): Client<paths> {
  if (cachedClient?.baseUrl === baseUrl) return cachedClient.client;

  const client = createClient<paths>({ baseUrl });
  client.use(identifyRequest, classifyFailure);
  cachedClient = { baseUrl, client };
  return client;
}

function cleanQuery(query: QueryParams | undefined): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    output[key] = Array.isArray(value) ? [...value] : value;
  }
  return output;
}

function requestSignal(
  signal: AbortSignal | undefined,
  timeoutMs: number,
): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

function logFailure(method: string, path: string, error: ApiError) {
  console.error(
    `[api] ${method} ${path} -> ${error.code}` +
      (error.status ? ` (${error.status})` : "") +
      ` [${error.requestId ?? ""}]`,
  );
}

export async function api<TSchema extends z.ZodType | undefined = undefined>(
  path: ApiPath,
  init: ApiRequest<TSchema> = {},
): Promise<ApiResult<TSchema>> {
  const {
    method = "GET",
    query,
    body,
    schema,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
    accessToken,
  } = init;

  const baseUrl = apiBaseUrl();

  if (!baseUrl) {
    throw new ApiError("notConfigured", {
      message: "VOLONTYORLAR_API_URL is not set.",
    });
  }

  const request = clientFor(baseUrl).request as unknown as RawRequest;
  let data: unknown;
  let response: Response;

  try {
    ({ data, response } = await request(method, path, {
      params: { query: cleanQuery(query) },
      body,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      signal: requestSignal(signal, timeoutMs),
      parseAs: "text",
      fetch: (outgoing: Request) => fetch(outgoing, { cache: "no-store" }),
    }));
  } catch (cause) {
    const error = classifyApiError(cause);
    logFailure(method, path, error);
    throw error;
  }

  const payload = typeof data === "string" && data ? parseJson(data) : null;

  if (!schema) return payload as ApiResult<TSchema>;

  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    const error = new ApiError("invalidResponse", {
      status: response.status,
      message: `Response from ${method} ${path} did not match its schema.`,
      requestId: response.headers.get(REQUEST_ID_HEADER) ?? undefined,
      cause: parsed.error,
    });
    logFailure(method, path, error);
    throw error;
  }

  return parsed.data as ApiResult<TSchema>;
}

export function authedApi<TSchema extends z.ZodType | undefined = undefined>(
  path: ApiPath,
  accessToken: string,
  init?: Omit<ApiRequest<TSchema>, "accessToken">,
): Promise<ApiResult<TSchema>> {
  return api(path, { ...init, accessToken });
}
