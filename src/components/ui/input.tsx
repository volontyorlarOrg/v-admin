import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const compactInputClass =
  "min-h-9 w-full min-w-0 rounded-md border border-border-strong bg-field px-3 text-base text-foreground caret-primary-ink transition-colors duration-150 placeholder:text-muted-foreground hover:border-border-control sm:text-sm";

export const inputClass =
  "min-h-10 w-full min-w-0 rounded-md border border-border-control bg-field px-3 text-base text-foreground caret-primary-ink transition-colors duration-150 placeholder:text-muted-foreground hover:border-ink-muted aria-invalid:border-danger aria-invalid:bg-danger-muted aria-invalid:ring-2 aria-invalid:ring-danger/20 aria-invalid:hover:border-danger disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm";

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputClass, className)}
      {...props}
    />
  );
}

export { Input };
