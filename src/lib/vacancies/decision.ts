import { z } from "zod";

import { VACANCY_DECISIONS } from "@/lib/domain/vocabulary";

export const MAX_DECISION_NOTE = 2000;

export const vacancyDecisionSchema = z
  .object({
    decision: z.enum(VACANCY_DECISIONS, { message: "required" }),
    note: z.string().trim().max(MAX_DECISION_NOTE, "tooLong").optional(),
  })
  .superRefine((values, context) => {
    if (values.decision === "approve") return;
    if (values.note) return;
    context.addIssue({
      code: "custom",
      path: ["note"],
      message: "decisionNoteRequired",
    });
  });

export type VacancyDecisionValues = z.infer<typeof vacancyDecisionSchema>;

export const DECISION_ENDPOINTS = {
  approve: "approveVacancy",
  request_changes: "requestVacancyChanges",
  reject: "rejectVacancy",
} as const;
