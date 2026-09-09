import "server-only";

import { read } from "@/lib/api/gateway.server";
import { statisticsSchema, type Statistics } from "@/lib/api/schemas";
import type { Loaded } from "@/lib/api/load";

export function loadStatistics(): Promise<Loaded<Statistics>> {
  return read("statistics", { schema: statisticsSchema });
}
