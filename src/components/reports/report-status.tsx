import { CircleCheck, MessageSquareWarning } from "lucide-react";
import { StatusBadge } from "@/components/portal/status-badge";
import type { Report } from "@/lib/reports/schemas";

export function ReportStatus({
  status,
  label,
}: {
  status: Report["status"];
  label: string;
}) {
  return (
    <StatusBadge
      label={label}
      tone={status === "open" ? "waiting" : "live"}
      icon={status === "open" ? MessageSquareWarning : CircleCheck}
    />
  );
}
