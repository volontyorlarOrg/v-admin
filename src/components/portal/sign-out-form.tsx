import { LogOut } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { signOutAction } from "@/lib/auth/actions";

export function SignOutForm({
  locale,
  label,
  pendingLabel,
  tone = "default",
}: {
  locale: string;
  label: string;
  pendingLabel: string;
  tone?: "default" | "shell";
}) {
  return (
    <form action={signOutAction} className={tone === "shell" ? "w-full" : undefined}>
      <input type="hidden" name="locale" value={locale} />
      <SubmitButton
        variant={tone === "shell" ? "shell" : "outline"}
        size="sm"
        pendingLabel={pendingLabel}
        className={tone === "shell" ? "min-h-9 w-full gap-2.5 px-2.5" : undefined}
      >
        <LogOut
          aria-hidden="true"
          className={tone === "shell" ? "size-[1.125rem]" : "size-4"}
        />
        {label}
      </SubmitButton>
    </form>
  );
}
