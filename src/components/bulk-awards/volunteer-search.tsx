import { Search } from "lucide-react";
import Form from "next/form";

import { Button } from "@/components/ui/button";
import { compactInputClass } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function VolunteerSearch({
  action,
  label,
  submitLabel,
  value,
}: {
  action: string;
  label: string;
  submitLabel: string;
  value: string;
}) {
  return (
    <Form
      action={action}
      role="search"
      className="flex min-w-0 flex-1 items-center gap-2"
    >
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{label}</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
        />
        <input
          type="search"
          name="q"
          defaultValue={value}
          placeholder={label}
          maxLength={120}
          autoComplete="off"
          className={cn(compactInputClass, "pl-10")}
        />
      </label>
      <Button type="submit" size="sm" variant="outline">
        {submitLabel}
      </Button>
    </Form>
  );
}
