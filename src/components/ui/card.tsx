import type { ComponentProps } from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

type SlotProps = ComponentProps<"div"> & { asChild?: boolean };

function Card({ className, asChild = false, ...props }: SlotProps) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="card"
      className={cn(
        "group/card rounded-xl border border-border bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, asChild = false, ...props }: SlotProps) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="card-header"
      className={cn(
        "flex items-start justify-between gap-4 border-b border-border px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, asChild = false, ...props }: SlotProps) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="card-title"
      className={cn("font-sans text-base font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function CardDescription({ className, asChild = false, ...props }: SlotProps) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="card-description"
      className={cn("mt-0.5 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, asChild = false, ...props }: SlotProps) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp data-slot="card-action" className={cn("shrink-0", className)} {...props} />
  );
}

function CardContent({ className, asChild = false, ...props }: SlotProps) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp data-slot="card-content" className={cn("px-5 py-4", className)} {...props} />
  );
}

export { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle };
