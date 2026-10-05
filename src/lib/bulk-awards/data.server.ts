import "server-only";
import { read } from "@/lib/api/gateway.server";
import {
  awardRecipientsSchema,
  awardVolunteersSchema,
  bulkAwardPageSchema,
  bulkAwardSchema,
} from "./schema";

export const AWARD_VOLUNTEER_PAGE_SIZE = 25;
export const AWARD_HISTORY_PAGE_SIZE = 10;

export function loadAwardVolunteers(q: string, page: number) {
  return read("bulkAwardVolunteers", {
    schema: awardVolunteersSchema,
    query: { ...(q ? { q } : {}), page, pageSize: AWARD_VOLUNTEER_PAGE_SIZE },
  });
}

export function loadBulkAwards(page: number) {
  return read("bulkAwards", {
    schema: bulkAwardPageSchema,
    query: { page, pageSize: AWARD_HISTORY_PAGE_SIZE },
  });
}

export function loadBulkAward(id: string) {
  return read("bulkAward", { schema: bulkAwardSchema, params: { id } });
}

export function loadAwardRecipients(id: string, q: string, page: number) {
  return read("bulkAwardRecipients", {
    schema: awardRecipientsSchema,
    params: { id },
    query: { ...(q ? { q } : {}), page, pageSize: AWARD_VOLUNTEER_PAGE_SIZE },
  });
}
