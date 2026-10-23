import "server-only";

import { read } from "@/lib/api/gateway.server";
import type { Loaded } from "@/lib/api/load";
import {
  pastEventPageSchema,
  pastEventRequestPageSchema,
  pastEventSchema,
  type PastEvent,
  type PastEventPage,
  type PastEventRequestPage,
  type PastEventRequestStatus,
  type PastEventView,
} from "@/lib/past-events/schemas";

export function loadPastEvents(query: {
  view: PastEventView;
  q: string;
  page: number;
  pageSize: number;
}): Promise<Loaded<PastEventPage>> {
  return read("pastEvents", {
    schema: pastEventPageSchema,
    query: {
      view: query.view,
      ...(query.q ? { q: query.q } : {}),
      page: query.page,
      pageSize: query.pageSize,
    },
  });
}

export function loadPastEvent(id: string): Promise<Loaded<PastEvent>> {
  return read("pastEvent", { schema: pastEventSchema, params: { id } });
}

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
