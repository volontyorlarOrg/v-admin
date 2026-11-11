import { z } from "zod";

export const signupTrendSchema = z.object({
  trend: z
    .object({
      from: z.iso.datetime(),
      to: z.iso.datetime(),
      total: z.number().int().nonnegative(),
      peak: z.number().int().nonnegative(),
      buckets: z
        .array(
          z.object({
            start: z.iso.datetime(),
            value: z.number().int().nonnegative(),
            share: z.number().min(0).max(1),
          }),
        )
        .max(30),
    })
    .nullable(),
});
