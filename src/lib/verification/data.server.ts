import "server-only";

import { z } from "zod";
import { read } from "@/lib/api/gateway.server";

export const verificationSchema = z.object({
  verified: z.boolean(),
  organization: z
    .object({ id: z.string().uuid(), name: z.string(), logoUrl: z.string().nullable() })
    .nullable(),
});

export function loadVerification(id: string) {
  return read("verification", { schema: verificationSchema, params: { id } });
}
