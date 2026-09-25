import "server-only";

import { getTranslations } from "next-intl/server";

import type { DecisionOption } from "@/components/register/inline-decision";

export async function vacancyDecisions() {
  const t = await getTranslations("decisions.vacancy");

  return ({
    title,
    ready,
    describedBy,
  }: {
    title: string;
    ready: boolean;
    describedBy?: string;
  }): DecisionOption[] => [
    {
      key: "approve",
      label: t("approve.trigger"),
      variant: "primary",
      fields: { decision: "approve" },
      success: t("approve.success", { title }),
      confirm: { prompt: t("approve.prompt"), submit: t("approve.confirm") },
      disabled: !ready,
      ...(describedBy ? { describedBy } : {}),
    },
    {
      key: "request_changes",
      label: t("return.trigger"),
      fields: { decision: "request_changes" },
      success: t("return.success", { title }),
      note: {
        name: "note",
        label: t("return.note"),
        help: t("return.help"),
        required: true,
        submit: t("return.confirm"),
      },
    },
    {
      key: "reject",
      label: t("reject.trigger"),
      variant: "danger-outline",
      fields: { decision: "reject" },
      success: t("reject.success", { title }),
      note: {
        name: "note",
        label: t("reject.note"),
        help: t("reject.help"),
        required: true,
        submit: t("reject.confirm"),
        danger: true,
      },
    },
  ];
}

export async function organizationDecisions() {
  const t = await getTranslations("decisions.organization");

  return ({ name }: { name: string }): DecisionOption[] => [
    {
      key: "verify",
      label: t("verify.trigger"),
      variant: "primary",
      fields: {},
      success: t("verify.success", { name }),
      confirm: { prompt: t("verify.prompt", { name }), submit: t("verify.confirm") },
    },
  ];
}
