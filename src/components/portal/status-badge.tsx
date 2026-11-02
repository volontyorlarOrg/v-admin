import {
  Archive,
  Ban,
  BadgeCheck,
  CalendarCheck,
  CalendarMinus,
  CalendarX,
  CircleCheck,
  CircleDashed,
  CircleX,
  Clock,
  Eye,
  Hourglass,
  Inbox,
  Lock,
  PencilLine,
  ShieldCheck,
  ShieldQuestion,
  Undo2,
  UserX,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type StatusTone =
  "draft" | "waiting" | "returned" | "live" | "final" | "person" | "neutral" | "danger";

const TONES: Record<StatusTone, string> = {
  draft: "bg-surface-sunk text-ink-muted [&_svg]:text-ink-faint",
  waiting: "bg-warning-muted text-warning-ink",
  returned: "bg-surface-soft text-primary-ink",
  live: "bg-success-muted text-success-ink",
  final: "bg-surface-sunk text-ink-muted",
  person: "bg-accent-muted text-accent-ink",
  neutral: "bg-surface-sunk text-ink-muted",
  danger: "bg-danger-muted text-danger-ink",
};

export type Status = { tone: StatusTone; icon: LucideIcon };

export function StatusBadge({
  label,
  tone = "neutral",
  icon: Icon,
  className,
}: {
  label: string;
  tone?: StatusTone;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <span
      data-slot="status"
      data-tone={tone}
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-sm px-1.5 text-xs leading-none font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {Icon ? (
        <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.25} />
      ) : null}
      {label}
    </span>
  );
}

const VACANCY: Record<string, Status> = {
  draft: { tone: "draft", icon: PencilLine },
  pending_review: { tone: "waiting", icon: Hourglass },
  changes_requested: { tone: "returned", icon: Undo2 },
  approved: { tone: "live", icon: BadgeCheck },
  rejected: { tone: "danger", icon: Ban },
  archived: { tone: "final", icon: Archive },
};

const APPLICATION: Record<string, Status> = {
  draft: { tone: "draft", icon: CircleDashed },
  submitted: { tone: "waiting", icon: Inbox },
  under_review: { tone: "waiting", icon: Eye },
  accepted: { tone: "person", icon: CircleCheck },
  rejected: { tone: "danger", icon: CircleX },
  withdrawn: { tone: "neutral", icon: Undo2 },
  closed: { tone: "final", icon: Lock },
};

const ATTENDANCE: Record<string, Status> = {
  attended: { tone: "person", icon: CalendarCheck },
  awaiting_confirmation: { tone: "waiting", icon: Clock },
  excused: { tone: "neutral", icon: CalendarMinus },
  cancelled: { tone: "neutral", icon: CalendarX },
  no_show: { tone: "danger", icon: UserX },
};

const COORDINATOR: Record<string, Status> = {
  active: { tone: "live", icon: CircleCheck },
  blocked: { tone: "danger", icon: Ban },
  removed: { tone: "final", icon: UserX },
};

const NEUTRAL: Status = { tone: "neutral", icon: CircleDashed };

export function vacancyStatus(state: string): Status {
  return VACANCY[state] ?? NEUTRAL;
}

export function applicationStatus(status: string): Status {
  return APPLICATION[status] ?? NEUTRAL;
}

export function attendanceStatus(outcome: string): Status {
  return ATTENDANCE[outcome] ?? NEUTRAL;
}

export function coordinatorStatus(status: string): Status {
  return COORDINATOR[status] ?? NEUTRAL;
}

export function organizationStatus(verified: boolean): Status {
  return verified
    ? { tone: "live", icon: ShieldCheck }
    : { tone: "waiting", icon: ShieldQuestion };
}
