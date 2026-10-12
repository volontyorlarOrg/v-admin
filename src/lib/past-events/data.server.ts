import "server-only";

import { read } from "@/lib/api/gateway.server";
import type { Loaded } from "@/lib/api/load";
import {
  pastEventRequestPageSchema,
  type PastEventRequestPage,
  type PastEventRequestStatus,
} from "@/lib/past-events/schemas";

export function loadPastEventRequests(query: {
  status: PastEventRequestStatus;
  page: number;
  pageSize: number;
}): Promise<Loaded<PastEventRequestPage>> {
  return read("pastEventRequests", {
    schema: pastEventRequestPageSchema,
    query: { status: query.status, page: query.page, pageSize: query.pageSize },
  });
}
