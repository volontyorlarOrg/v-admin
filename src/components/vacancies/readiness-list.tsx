import { Check, X } from "lucide-react";

import { APPROVAL_REQUIREMENTS } from "@/lib/vacancies/approval";
import type { ApprovalRequirement } from "@/lib/vacancies/approval";
import { cn } from "@/lib/utils";

export type ReadinessLabels = {
  requirements: Record<string, string>;
  met: string;
  unmet: string;
};

export function ReadinessList({
  missing,
  labels,
  className,
  onlyMissing = false,
}: {
  missing: readonly ApprovalRequirement[];
  labels: ReadinessLabels;
  className?: string;
  onlyMissing?: boolean;
}) {
  const shown = onlyMissing
    ? APPROVAL_REQUIREMENTS.filter((requirement) => missing.includes(requirement))
    : APPROVAL_REQUIREMENTS;

  return (
    <ul data-slot="readiness-list" className={cn("flex flex-col gap-1.5", className)}>
      {shown.map((requirement) => {
        const unmet = missing.includes(requirement);

        return (
          <li
            key={requirement}
            data-met={unmet ? undefined : "true"}
            className={cn(
              "flex items-start gap-2 text-sm",
              unmet ? "font-medium text-danger-ink" : "text-ink-muted",
            )}
          >
            {unmet ? (
              <X aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            ) : (
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            )}
            <span className="min-w-0">
              <span className="sr-only">{unmet ? labels.unmet : labels.met}: </span>
              {labels.requirements[requirement] ?? requirement}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
