import { z } from "zod";

import { REVIEW_DECISIONS } from "@/lib/domain/vocabulary";

export const reviewSchema = z.object({
  status: z.enum(REVIEW_DECISIONS, { message: "required" }),
  reviewerNote: z.string().trim().max(2000, "tooLong").optional(),
});
