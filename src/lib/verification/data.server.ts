import "server-only";

import { z } from "zod";
import { read } from "@/lib/api/gateway.server";

export const verificationSchema = z.object({
  verified: z.boolean(),
  badgeUrl: z.string().nullable().default(null),
});

export function loadVerification(id: string) {
  return read("verification", { schema: verificationSchema, params: { id } });
}
