"use client";

import { TriangleAlert } from "lucide-react";
import type { ComponentProps } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function FieldGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("group/field-group flex w-full flex-col gap-5", className)}
      {...props}
    />
  );
}

function Field({
  className,
  invalid = false,
  ...props
}: ComponentProps<"div"> & { invalid?: boolean }) {
  return (
    <div
      role="group"
      data-slot="field"
      data-invalid={invalid || undefined}
      className={cn("group/field flex w-full flex-col gap-2", className)}
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn("w-fit group-data-[disabled=true]/field:opacity-60", className)}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-xs leading-5 text-muted-foreground", className)}
      {...props}
    />
  );
}

function FieldError({ className, children, ...props }: ComponentProps<"p">) {
  if (!children) return null;

  return (
    <p
      role="alert"
      data-slot="field-error"
      className={cn(
        "flex items-start gap-2 text-sm font-medium text-foreground",
        className,
      )}
      {...props}
    >
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

export { Field, FieldDescription, FieldError, FieldGroup, FieldLabel };
