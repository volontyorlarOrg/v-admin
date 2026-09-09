import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-full text-xs font-semibold [&_svg]:pointer-events-none [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-action px-2.5 py-1 text-knockout",
        neutral: "border border-input px-2.5 py-1 text-muted-foreground",
        structure: "bg-surface-soft px-2.5 py-1 text-primary-ink",
        achievement: "border border-accent/50 bg-surface px-2.5 py-1 text-accent-ink",
        status:
          "border border-dashed border-input px-3 py-1.5 tracking-[0.1em] text-muted-foreground uppercase",
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
