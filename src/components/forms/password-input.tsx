"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PasswordInput({
  showLabel,
  hideLabel,
  className,
  id,
  ...props
}: Omit<ComponentProps<"input">, "type"> & {
  showLabel: string;
  hideLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  const fallbackId = useId();

  return (
    <span className="relative block">
      <Input
        {...props}
        id={id ?? fallbackId}
        type={visible ? "text" : "password"}
        className={cn("pr-12", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunk hover:text-ink"
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="size-4" />
        ) : (
          <Eye aria-hidden="true" className="size-4" />
        )}
      </button>
    </span>
  );
}
