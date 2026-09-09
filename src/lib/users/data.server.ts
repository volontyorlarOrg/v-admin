import "server-only";

import { read } from "@/lib/api/gateway.server";
import {
  directoryUserSchema,
  pageSchema,
  userDetailSchema,
  type UserDetail,
} from "@/lib/api/schemas";
import type { Loaded } from "@/lib/api/load";
import type { z } from "zod";

export const userPageSchema = pageSchema(directoryUserSchema);

export type UserPage = z.infer<typeof userPageSchema>;

export function loadUsers(query: {
  q?: string;
  page: number;
  pageSize: number;
}): Promise<Loaded<UserPage>> {
  return read("users", {
    schema: userPageSchema,
    query: {
      ...(query.q ? { q: query.q } : {}),
      page: query.page,
      pageSize: query.pageSize,
    },
  });
}

export function loadUser(id: string): Promise<Loaded<UserDetail>> {
  return read("user", { schema: userDetailSchema, params: { id } });
}
