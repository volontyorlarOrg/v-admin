import "server-only";

import { read } from "@/lib/api/gateway.server";
import {
  coordinatorDetailSchema,
  coordinatorSchema,
  pageSchema,
  type CoordinatorDetail,
} from "@/lib/api/schemas";
import type { Loaded } from "@/lib/api/load";
import type { z } from "zod";

export const coordinatorPageSchema = pageSchema(coordinatorSchema);

export type CoordinatorPage = z.infer<typeof coordinatorPageSchema>;

export function loadCoordinators(query: {
  q?: string;
  page: number;
  pageSize: number;
}): Promise<Loaded<CoordinatorPage>> {
  return read("coordinators", {
    schema: coordinatorPageSchema,
    query,
  });
}

export function loadCoordinator(id: string): Promise<Loaded<CoordinatorDetail>> {
  return read("coordinator", { schema: coordinatorDetailSchema, params: { id } });
}
