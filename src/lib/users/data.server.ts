import "server-only";

import { read } from "@/lib/api/gateway.server";
import {
  directoryUserSchema,
  pageSchema,
  userDetailSchema,
  type DirectoryUser,
  type UserDetail,
} from "@/lib/api/schemas";
import { isReady, ready, type Loaded } from "@/lib/api/load";
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

const SCAN_PAGE_SIZE = 100;
const SCAN_PAGE_LIMIT = 20;

export type UserScan = {
  users: DirectoryUser[];
  total: number;
  complete: boolean;
};

export async function loadEveryUser(): Promise<Loaded<UserScan>> {
  const first = await loadUsers({ page: 1, pageSize: SCAN_PAGE_SIZE });
  if (!isReady(first)) return first;

  const pageSize = first.data.pageSize > 0 ? first.data.pageSize : SCAN_PAGE_SIZE;
  const pages = Math.min(SCAN_PAGE_LIMIT, Math.ceil(first.data.total / pageSize));
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
      loadUsers({ page: index + 2, pageSize }),
    ),
  );

  const users = [...first.data.items];

  for (const loaded of rest) {
    if (!isReady(loaded)) return loaded;
    users.push(...loaded.data.items);
  }

  return ready({
    users,
    total: first.data.total,
    complete: users.length >= first.data.total,
  });
}
