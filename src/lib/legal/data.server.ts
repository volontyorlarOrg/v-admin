import "server-only";

import { read } from "@/lib/api/gateway.server";
import { legalQueueSchema } from "@/lib/legal/schemas";

export function loadLegalRequests() {
  return read("legalRequests", { schema: legalQueueSchema });
}
