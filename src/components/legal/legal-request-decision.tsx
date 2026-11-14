import { getTranslations } from "next-intl/server";

import { InlineDecision } from "@/components/register/inline-decision";
import { resolveLegalRequestAction } from "@/lib/legal/actions";
import type { LegalRequest } from "@/lib/legal/schemas";
import { decisionLabels } from "@/lib/queue/decisions.server";

export async function LegalRequestDecision({ request }: { request: LegalRequest }) {
  const [t, labels] = await Promise.all([getTranslations("legal"), decisionLabels()]);
  return (
    <InlineDecision
      action={resolveLegalRequestAction}
      subject={request.requester.displayName ?? request.requester.username}
      hidden={{ id: request.id }}
      labels={labels}
      options={[
        {
          key: "resolve",
          label: t("answer"),
          fields: {},
          success: t("answered"),
          variant: "outline",
          note: {
            name: "resolution",
            label: t("answerLabel"),
            help: t("answerHelp"),
            required: true,
            submit: t("answerSubmit"),
          },
        },
      ]}
    />
  );
}
