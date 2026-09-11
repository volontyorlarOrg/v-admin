import { describe, expect, it } from "vitest";

import { fieldErrorsOf } from "@/lib/auth/credentials";
import { DECISION_ENDPOINTS, vacancyDecisionSchema } from "@/lib/vacancies/decision";

describe("vacancyDecisionSchema", () => {
  it("approves without asking for a note", () => {
    expect(vacancyDecisionSchema.safeParse({ decision: "approve" }).success).toBe(true);
  });

  it("requires a note before sending a vacancy back for changes", () => {
    const result = vacancyDecisionSchema.safeParse({ decision: "request_changes" });
    expect(fieldErrorsOf(result.error!).note).toEqual(["decisionNoteRequired"]);
  });

  it("requires a note before rejecting a vacancy for good", () => {
    const result = vacancyDecisionSchema.safeParse({ decision: "reject", note: "  " });
    expect(fieldErrorsOf(result.error!).note).toEqual(["decisionNoteRequired"]);
  });

  it("refuses a decision the workflow does not have", () => {
    expect(vacancyDecisionSchema.safeParse({ decision: "publish" }).success).toBe(false);
  });
});

describe("DECISION_ENDPOINTS", () => {
  it("sends each decision to its own operation", () => {
    expect(DECISION_ENDPOINTS).toEqual({
      approve: "approveVacancy",
      request_changes: "requestVacancyChanges",
      reject: "rejectVacancy",
    });
  });
});
