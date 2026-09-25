import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[background-color,border-color,color,scale] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-action text-knockout hover:bg-action-hover",
        outline:
          "border border-border-control bg-transparent text-ink hover:border-primary-ink hover:bg-surface-soft hover:text-primary-ink",
        ghost: "text-primary-ink hover:bg-surface-soft",
        inverse:
          "bg-knockout text-action hover:bg-primary-muted hover:text-primary-deep",
        danger: "bg-danger-fill text-knockout hover:bg-danger-fill-hover",
        "danger-outline":
          "border border-danger/55 bg-transparent text-danger-ink hover:border-danger hover:bg-danger-muted",
        shell:
          "justify-start rounded-lg text-shell-muted hover:bg-shell-raised hover:text-shell-ink",
      },
      size: {
        row: "min-h-9 px-3.5 text-sm [&_svg]:size-4",
        sm: "min-h-10 px-4.5 text-sm [&_svg]:size-4",
        md: "min-h-12 px-6 text-base [&_svg]:size-5",
        icon: "size-10 [&_svg]:size-4.5",
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
