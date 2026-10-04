import "server-only";

import { getFormatter, getLocale, getTranslations } from "next-intl/server";

import { PROFILE_FIELD_KEYS } from "@/components/users/volunteer-profile";
import { read } from "@/lib/api/gateway.server";
import type { Loaded } from "@/lib/api/load";
import type { Application } from "@/lib/api/schemas";
import { volunteerNameOf } from "@/lib/applications/filters";
import { isRegion } from "@/lib/domain/vocabulary";
import type { DeskApplicant } from "@/lib/results/desk";
import {
  attendanceSheetSchema,
  instructionsSchema,
  verificationQueueSchema,
  type AttendanceSheet,
  type Instructions,
  type VerificationQueue,
} from "@/lib/results/schemas";
import { applicationHref } from "@/lib/routing/routes";

export function loadAttendanceSheet(
  vacancyId: string,
): Promise<Loaded<AttendanceSheet>> {
  return read("attendanceSheet", {
    schema: attendanceSheetSchema,
    params: { id: vacancyId },
  });
}

export function loadVerificationQueue(): Promise<Loaded<VerificationQueue>> {
  return read("attendanceSheets", {
    schema: verificationQueueSchema,
    query: { status: "submitted" },
  });
}

export function loadInstructions(vacancyId: string): Promise<Loaded<Instructions>> {
  return read("instructions", {
    schema: instructionsSchema,
    params: { id: vacancyId },
  });
}

export async function deskApplicants(
  applications: readonly Application[],
): Promise<DeskApplicant[]> {
  const [locale, format, t, common, vocabulary] = await Promise.all([
    getLocale(),
    getFormatter(),
    getTranslations("applications"),
    getTranslations("common"),
    getTranslations("vocabulary"),
  ]);
  const languages = new Intl.DisplayNames([locale], { type: "language" });
  const languageName = (code: string) => {
    try {
      return languages.of(code) ?? code;
    } catch {
      return code;
    }
  };
  const day = (value: string | undefined) =>
    value ? format.dateTime(new Date(value), "date") : "";

  return applications.map((application) => {
    const snapshot = application.profileSnapshot;
    const profile = snapshot
      ? PROFILE_FIELD_KEYS.flatMap((key) => {
          const value = snapshot[key];
          if (
            value === undefined ||
            value === "" ||
            (Array.isArray(value) && !value.length)
          ) {
            return [];
          }
          const text =
            key === "region" && typeof value === "string"
              ? isRegion(value)
                ? vocabulary(`regions.${value}`)
                : value
              : key === "languages" && Array.isArray(value)
                ? value.map(languageName).join(", ")
                : Array.isArray(value)
                  ? value.join(", ")
                  : value;
          return [{ label: t(`snapshotFields.${key}`), value: text }];
        })
      : [];
    return {
      id: application.id,
      name: volunteerNameOf(application) || common("notSet"),
      username: application.volunteer?.username ?? snapshot?.username ?? null,
      avatarUrl: application.volunteer?.avatarUrl ?? null,
      status: application.status,
      staged: application.stagedDecision ?? null,
      appliedAt: application.submittedAt ?? null,
      appliedLabel: day(application.submittedAt),
      decidedLabel: application.reviewedAt ? day(application.reviewedAt) : null,
      essay: application.essay?.trim() || null,
      answers: application.answers.map((answer) => ({
        prompt: answer.questionPrompt,
        value: Array.isArray(answer.value) ? answer.value.join(", ") : answer.value,
      })),
      profile,
      href: applicationHref(application.id),
    };
  });
}
