import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const inputClass =
  "min-h-12 w-full min-w-0 rounded-lg border border-input bg-surface px-4 text-base text-foreground caret-primary-ink transition-colors placeholder:text-muted-foreground hover:border-primary-ink aria-invalid:border-danger aria-invalid:bg-danger-muted aria-invalid:ring-2 aria-invalid:ring-danger/25 aria-invalid:hover:border-danger disabled:cursor-not-allowed disabled:opacity-60";

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
