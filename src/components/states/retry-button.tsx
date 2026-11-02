"use client";

import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

export function RetryButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      aria-live="polite"
      onClick={() => startTransition(() => router.refresh())}
    >
      <RotateCw
        aria-hidden="true"
        className={pending ? "motion-safe:animate-spin" : undefined}
      />
      {pending ? pendingLabel : label}
    </Button>
  );
}
