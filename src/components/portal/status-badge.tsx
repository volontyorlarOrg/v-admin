import { Badge } from "@/components/ui/badge";

export type StatusTone = "neutral" | "structure" | "person" | "muted";

const VARIANT = {
  neutral: "neutral",
  structure: "structure",
  person: "achievement",
  muted: "status",
} as const;

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: StatusTone;
}) {
  return <Badge variant={VARIANT[tone]}>{label}</Badge>;
}

export function vacancyStateTone(state: string): StatusTone {
  if (state === "approved") return "structure";
  if (state === "pending_review") return "person";
  if (state === "archived" || state === "rejected") return "muted";
  return "neutral";
}

export function applicationStatusTone(status: string): StatusTone {
  if (status === "accepted") return "person";
  if (status === "submitted" || status === "under_review") return "structure";
  return "neutral";
}

export function attendanceTone(outcome: string): StatusTone {
  if (outcome === "attended") return "person";
  if (outcome === "awaiting_confirmation") return "structure";
  return "neutral";
}

export function coordinatorStatusTone(status: string): StatusTone {
  if (status === "active") return "structure";
  if (status === "removed") return "muted";
  return "neutral";
}
