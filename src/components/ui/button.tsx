import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[background-color,border-color,color] duration-200 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-action text-knockout hover:bg-action-hover",
        outline:
          "border border-border-control bg-transparent text-ink hover:border-primary-ink hover:bg-surface-soft hover:text-primary-ink",
        ghost: "text-primary-ink hover:bg-surface-soft",
        inverse:
          "bg-knockout text-action hover:bg-primary-muted hover:text-primary-deep",
      },
      size: {
        sm: "min-h-11 px-5 text-sm",
        md: "min-h-13 px-7 text-base",
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
