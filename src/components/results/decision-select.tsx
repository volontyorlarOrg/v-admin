"use client";

import { Check, ChevronDown, Pause, X, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { STAGED_DECISIONS, type StagedDecision } from "@/lib/domain/vocabulary";
import { cn } from "@/lib/utils";

export const DECISION_LOOK: Record<StagedDecision, { icon: LucideIcon; tone: string }> =
  {
    accept: { icon: Check, tone: "border-primary-ink/45 text-primary-ink" },
    hold: { icon: Pause, tone: "border-border-control text-ink" },
    reject: { icon: X, tone: "border-danger/50 text-danger-ink" },
  };

export function DecisionSelect({
  value,
  onChange,
  label,
  disabled,
  className,
  size = "row",
}: {
  value: StagedDecision | null;
  onChange: (decision: StagedDecision | null) => void;
  label: string;
  disabled?: boolean;
  className?: string;
  size?: "row" | "field";
}) {
  const t = useTranslations("results.decision");
  const look = value ? DECISION_LOOK[value] : null;
  const Icon = look?.icon;

  return (
    <span className={cn("relative inline-flex w-full", className)}>
      {Icon ? (
        <Icon
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2",
            look.tone,
          )}
        />
      ) : null}
      <select
        aria-label={label}
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value === "" ? null : (event.target.value as StagedDecision),
          )
        }
        className={cn(
          "w-full appearance-none rounded-full border bg-field pr-9 font-semibold transition-colors hover:border-primary-ink disabled:cursor-not-allowed disabled:opacity-60",
          size === "row" ? "min-h-9 text-sm" : "min-h-12 rounded-lg text-base",
          Icon ? "pl-9" : "pl-3.5",
          look?.tone ?? "border-border-control text-ink-muted",
        )}
      >
        <option value="">{t("choose")}</option>
        {STAGED_DECISIONS.map((decision) => (
          <option key={decision} value={decision}>
            {t(decision)}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
      />
    </span>
  );
}
