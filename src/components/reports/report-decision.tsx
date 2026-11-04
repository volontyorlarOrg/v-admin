import { getTranslations } from "next-intl/server";
import { InlineDecision } from "@/components/register/inline-decision";
import { decisionLabels } from "@/lib/queue/decisions.server";
import { updateReportStatusAction } from "@/lib/reports/actions";
import type { Report } from "@/lib/reports/schemas";

export async function ReportDecision({ report }: { report: Report }) {
  const [t, labels] = await Promise.all([getTranslations("reports"), decisionLabels()]);
  const next = report.status === "open" ? "resolved" : "open";
  return (
    <InlineDecision
      action={updateReportStatusAction}
      subject={report.reporter.displayName ?? report.reporter.username}
      hidden={{ id: report.id, version: String(report.version) }}
      labels={labels}
      options={[
        {
          key: next,
          label: t(next === "resolved" ? "resolve" : "reopen"),
          fields: { status: next },
          success: t(next === "resolved" ? "resolvedSuccess" : "reopenedSuccess"),
          variant: "outline",
        },
      ]}
    />
  );
}
