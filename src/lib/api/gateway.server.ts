import "server-only";

import type { z } from "zod";

import { authedApi, type QueryParams } from "@/lib/api/client.server";
import { endpoints, pathFor, type EndpointName } from "@/lib/api/endpoints";
import { isApiError, isSessionOver } from "@/lib/api/errors";
import { loadedFromError, ready, type Loaded } from "@/lib/api/load";
import {
  failedResult,
  okResult,
  resultFromError,
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

export async function read<TSchema extends z.ZodType>(
  name: EndpointName,
  { schema, params, query }: ReadOptions<TSchema>,
): Promise<Loaded<z.infer<TSchema>>> {
  const session = await getSession();
  if (!session) return { state: "expired" };

  const endpoint = endpoints[name];

  try {
    const data = await authedApi(pathFor(name, params), session.accessToken, {
      method: endpoint.method,
      query,
      schema,
    });
    return ready(data as z.infer<TSchema>);
  } catch (error) {
    return loadedFromError(error, name, endpoint.contract === "published");
  }
}

export async function write(
  name: EndpointName,
  { params, body, query }: WriteOptions = {},
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return failedResult("sessionExpired");

  const endpoint = endpoints[name];
  const path = pathFor(name, params);
  const send = (accessToken: string) =>
    authedApi(path, accessToken, { method: endpoint.method, query, body });

  try {
    await send(session.accessToken);
    return okResult;
  } catch (error) {
    if (isSessionOver(error)) {
      return failedResult("sessionExpired");
    }

    if (
      isApiError(error) &&
      error.code === "notFound" &&
      error.backendCode === null &&
      endpoint.contract !== "published"
    ) {
      return failedResult("awaitingContract");
    }

    return resultFromError(error);
  }
}
