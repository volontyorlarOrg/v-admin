import { z } from "zod";

import { failedResult, type ActionResult } from "@/lib/api/action-result";
import { fieldErrorsOf, stringField } from "@/lib/auth/credentials";

export const PROGRESS_DIRECTIONS = ["add", "remove"] as const;

export type ProgressDirection = (typeof PROGRESS_DIRECTIONS)[number];

export const MAX_XP_CHANGE = 100_000;
export const MAX_HOURS_CHANGE = 999;
export const ADJUSTMENT_REASON_MAX_LENGTH = 500;

export const PROGRESS_FIELDS = ["direction", "xp", "hours", "reason"] as const;

export type ProgressAdjustmentBody = {
  xpDelta: number;
  hoursDelta: number;
  reason: string;
};

function amountOf(value: string): number {
  return value === "" ? 0 : Number(value);
}

function hasAtMostHundredths(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-9;
}

export const progressAdjustmentSchema = z
  .object({
    direction: z.enum(PROGRESS_DIRECTIONS, { error: "required" }),
    xp: z.string().trim(),
    hours: z.string().trim(),
    reason: z
      .string()
      .trim()
      .min(1, "required")
      .max(ADJUSTMENT_REASON_MAX_LENGTH, "tooLong"),
  })
  .superRefine((values, context) => {
    const xp = amountOf(values.xp);
    if (!Number.isInteger(xp) || xp < 0 || xp > MAX_XP_CHANGE) {
      context.addIssue({ code: "custom", path: ["xp"], message: "xpAmount" });
    }

    const hours = amountOf(values.hours);
    if (
      !Number.isFinite(hours) ||
      hours < 0 ||
      hours > MAX_HOURS_CHANGE ||
      !hasAtMostHundredths(hours)
    ) {
      context.addIssue({ code: "custom", path: ["hours"], message: "hoursAmount" });
    }
  });

export function progressValuesOf(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    PROGRESS_FIELDS.map((name) => [name, stringField(formData, name)]),
  );
}

export function progressAdjustmentOf(
  values: Record<string, string>,
): { body: ProgressAdjustmentBody } | { result: ActionResult } {
  const parsed = progressAdjustmentSchema.safeParse(values);
  if (!parsed.success) {
    return { result: failedResult("validationFailed", fieldErrorsOf(parsed.error)) };
  }

  const xp = amountOf(parsed.data.xp);
  const hours = amountOf(parsed.data.hours);
  if (xp === 0 && hours === 0) return { result: failedResult("adjustmentEmpty") };

  const sign = parsed.data.direction === "remove" ? -1 : 1;
  return {
    body: {
      xpDelta: xp === 0 ? 0 : sign * xp,
      hoursDelta: hours === 0 ? 0 : sign * hours,
      reason: parsed.data.reason,
    },
  };
}

export function signedChange(value: number, format: (value: number) => string): string {
  if (value === 0) return "—";
  return `${value > 0 ? "+" : "−"}${format(Math.abs(value))}`;
}
