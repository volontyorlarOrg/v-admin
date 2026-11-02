import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-[background-color,border-color,color] duration-150 disabled:pointer-events-none disabled:opacity-55 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-action text-knockout hover:bg-action-hover active:bg-primary-deep",
        outline:
          "border border-border-strong bg-surface text-ink hover:border-border-control hover:bg-surface-sunk active:bg-shell-raised",
        ghost: "text-primary-ink hover:bg-surface-soft active:bg-primary-muted",
        inverse:
          "bg-knockout text-action hover:bg-primary-muted hover:text-primary-deep",
        danger: "bg-danger-fill text-knockout hover:bg-danger-fill-hover",
        "danger-outline":
          "border border-danger/45 bg-surface text-danger-ink hover:border-danger hover:bg-danger-muted",
        shell:
          "justify-start font-medium text-shell-muted hover:bg-shell-raised hover:text-shell-ink",
      },
      size: {
        row: "min-h-8 px-3 text-sm [&_svg]:size-4",
        sm: "min-h-9 px-3.5 text-sm [&_svg]:size-4",
        md: "min-h-10 px-4 text-sm [&_svg]:size-4.5",
        icon: "size-9 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export function buttonClass(props: ButtonVariantProps & { className?: string } = {}) {
  const { className, ...variants } = props;
  return cn(buttonVariants(variants), className);
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<"button"> & ButtonVariantProps & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? "primary"}
      data-size={size ?? "md"}
      className={buttonClass({ variant, size, className })}
      {...props}
    />
  );
}

export { buttonVariants };
