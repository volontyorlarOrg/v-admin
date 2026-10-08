import "server-only";
import { read } from "@/lib/api/gateway.server";
import { analyticsSchema } from "@/lib/statistics/analytics";

export function loadAnalytics(days: 30 | 90) {
  return read("analytics", { schema: analyticsSchema, query: { days } });
}
