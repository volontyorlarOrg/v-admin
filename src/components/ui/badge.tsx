import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 rounded-sm px-1.5 text-xs font-medium whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-surface-soft text-primary-ink",
        neutral: "bg-surface-sunk text-ink-muted",
        structure: "bg-surface-soft text-primary-ink",
        returned: "bg-surface-soft text-primary-ink",
        achievement: "bg-accent-muted text-accent-ink",
        status: "bg-surface-sunk text-ink-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant ?? "default"}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
