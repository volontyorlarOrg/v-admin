import { User } from "lucide-react";

import { initialsOf } from "@/lib/users/initials";
import { cn } from "@/lib/utils";

export function Avatar({ name, className }: { name?: string; className?: string }) {
  const initials = initialsOf(name);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-surface-soft text-xs font-semibold text-primary-ink",
        className,
      )}
    >
      {initials === "" ? <User className="size-4 text-ink-muted" /> : initials}
    </span>
  );
}
