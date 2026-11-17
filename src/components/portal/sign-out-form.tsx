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
  tone?: "default" | "menu";
}) {
  const menu = tone === "menu";
  return (
    <form action={signOutAction} className={menu ? "w-full" : undefined}>
      <input type="hidden" name="locale" value={locale} />
      <SubmitButton
        variant={menu ? "danger-outline" : "outline"}
        size="sm"
        pendingLabel={pendingLabel}
        className={menu ? "w-full" : undefined}
      >
        <LogOut aria-hidden="true" className="size-4" />
        {label}
      </SubmitButton>
    </form>
  );
}
