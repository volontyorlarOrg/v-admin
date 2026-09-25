import "server-only";

import { getTranslations } from "next-intl/server";

import type {
  DecisionLabels,
  DecisionOption,
} from "@/components/register/inline-decision";
import { errorCatalog } from "@/lib/vacancies/labels.server";

export const DECISION_ERROR_CODES = [
  "server",
  "network",
  "timeout",
  "rateLimited",
  "unavailable",
  "forbidden",
  "notFound",
  "conflict",
  "validationFailed",
  "awaitingContract",
  "sessionExpired",
  "required",
  "tooLong",
  "decisionNoteRequired",
  "approvalNoteRequired",
  "opportunityNotFound",
  "opportunityNotPendingApproval",
  "opportunityCannotBeSubmitted",
  "opportunityNotEditable",
  "opportunityAlreadyArchived",
  "opportunityCannotBePublished",
  "opportunityIncomplete",
  "organizationNotVerified",
  "organizationNotFound",
  "deadlinePassed",
  "invalidOpportunityDates",
  "applicationNotFound",
  "applicationCannotBeReviewed",
  "attendanceAlreadyResolved",
  "opportunityArchived",
  "opportunityAtCapacity",
] as const;

export async function decisionLabels(): Promise<DecisionLabels> {
  const [t, errors] = await Promise.all([
    getTranslations("decisions"),
    getTranslations("errors"),
  ]);

  return {
    group: t("group"),
    cancel: t("cancel"),
    pending: t("pending"),
    fallbackError: errors("server"),
    errors: await errorCatalog(DECISION_ERROR_CODES),
  };
}

export async function applicationDecisions() {
  const t = await getTranslations("decisions.application");

  return ({
    name,
    status,
    withNote = false,
  }: {
    name: string;
    status: string;
    withNote?: boolean;
  }): DecisionOption[] => [
    {
      key: "accept",
      label: t("accept.trigger"),
      variant: "primary",
      fields: { status: "accepted" },
      success: t("accept.success", { name }),
      ...(withNote
        ? {
            note: {
              name: "reviewerNote",
              label: t("note"),
              help: t("noteHelp"),
              required: false,
              submit: t("accept.confirm"),
            },
          }
        : {
            confirm: {
              prompt: t("accept.prompt", { name }),
              submit: t("accept.confirm"),
            },
          }),
    },
    {
      key: "reject",
      label: t("reject.trigger"),
      variant: "danger-outline",
      fields: { status: "rejected" },
      success: t("reject.success", { name }),
      note: {
        name: "reviewerNote",
        label: t("note"),
        help: t("noteHelp"),
        required: false,
        submit: t("reject.confirm"),
        danger: true,
      },
    },
    ...(status === "submitted"
      ? [
          {
            key: "under_review",
            label: t("look.trigger"),
            fields: { status: "under_review" },
            success: t("look.success", { name }),
          } satisfies DecisionOption,
        ]
      : []),
  ];
}
