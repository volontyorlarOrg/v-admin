import "server-only";

import { cache } from "react";
import type { z } from "zod";

import { authedApi, authedMultipart, type QueryParams } from "@/lib/api/client.server";
import {
  endpoints,
  pathFor,
  type Endpoint,
  type EndpointName,
} from "@/lib/api/endpoints";
import { loadedFromError, ready, type Loaded } from "@/lib/api/load";
import {
  failedResult,
  okResult,
  writeFailure,
  type ActionResult,
} from "@/lib/api/action-result";
import { getSession } from "@/lib/auth/session.server";

type Params = Record<string, string>;

export type ReadOptions<TSchema extends z.ZodType> = {
  schema: TSchema;
  params?: Params;
  query?: QueryParams;
};

export type WriteOptions = {
  params?: Params;
  body?: unknown;
  query?: QueryParams;
};

export type Written<T> = { result: ActionResult; data?: T };

function stableKey(value: Record<string, unknown> | undefined): string {
  const entries = Object.entries(value ?? {})
    .filter(([, item]) => item !== undefined && item !== null && item !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

function fromKey<T>(key: string): T {
  return Object.fromEntries(JSON.parse(key) as Array<[string, unknown]>) as T;
}

const readOnce = cache(
  async (
    name: EndpointName,
    schema: z.ZodType,
    paramsKey: string,
    queryKey: string,
  ): Promise<Loaded<unknown>> => {
    const session = await getSession();
    if (!session) return { state: "expired" };

    const endpoint: Endpoint = endpoints[name];

    try {
      const data = await authedApi(
        pathFor(name, fromKey<Params>(paramsKey)),
        session.accessToken,
        { method: endpoint.method, query: fromKey<QueryParams>(queryKey), schema },
      );
      return ready(data);
    } catch (error) {
      return loadedFromError(error, name, endpoint.contract === "published");
    }
  },
);

export function read<TSchema extends z.ZodType>(
  name: EndpointName,
  { schema, params, query }: ReadOptions<TSchema>,
): Promise<Loaded<z.infer<TSchema>>> {
  return readOnce(name, schema, stableKey(params), stableKey(query)) as Promise<
    Loaded<z.infer<TSchema>>
  >;
}

async function send<T>(
  name: EndpointName,
  request: (accessToken: string, endpoint: Endpoint) => Promise<T>,
): Promise<Written<T>> {
  const session = await getSession();
  if (!session) return { result: failedResult("sessionExpired") };

  const endpoint: Endpoint = endpoints[name];

  try {
    const data = await request(session.accessToken, endpoint);
    return { result: okResult, data };
  } catch (error) {
    return { result: writeFailure(error, endpoint) };
  }
}

export async function write(
  name: EndpointName,
  { params, body, query }: WriteOptions = {},
): Promise<ActionResult> {
  const { result } = await send(name, (accessToken, endpoint) =>
    authedApi(pathFor(name, params), accessToken, {
      method: endpoint.method,
      query,
      body,
    }),
  );
  return result;
}

export function writeReturning<TSchema extends z.ZodType>(
  name: EndpointName,
  { schema, params, body, query }: WriteOptions & { schema: TSchema },
): Promise<Written<z.infer<TSchema>>> {
  return send(
    name,
    (accessToken, endpoint) =>
      authedApi(pathFor(name, params), accessToken, {
        method: endpoint.method,
        query,
        body,
        schema,
      }) as Promise<z.infer<TSchema>>,
  );
}

function multipartMethod(endpoint: Endpoint): "POST" | "PUT" {
  return endpoint.method === "POST" ? "POST" : "PUT";
}

export async function writeMultipart(
  name: EndpointName,
  params: Params,
  body: FormData,
  schema?: z.ZodType,
): Promise<ActionResult> {
  const { result } = await send(name, (accessToken, endpoint) =>
    authedMultipart(pathFor(name, params), accessToken, body, {
      method: multipartMethod(endpoint),
      schema,
    }),
  );
  return result;
}

export function writeMultipartReturning<TSchema extends z.ZodType>(
  name: EndpointName,
  params: Params,
  body: FormData,
  schema: TSchema,
): Promise<Written<z.infer<TSchema>>> {
  return send(
    name,
    (accessToken, endpoint) =>
      authedMultipart(pathFor(name, params), accessToken, body, {
        method: multipartMethod(endpoint),
        schema,
      }) as Promise<z.infer<TSchema>>,
  );
}
