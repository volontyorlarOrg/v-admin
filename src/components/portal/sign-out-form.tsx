import { LogOut } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { signOutAction } from "@/lib/auth/actions";

export function SignOutForm({
  locale,
  label,
  pendingLabel,
}: {
  locale: string;
  label: string;
  pendingLabel: string;
}) {
  return (
    <form action={signOutAction}>
      <input type="hidden" name="locale" value={locale} />
      <SubmitButton variant="outline" size="sm" pendingLabel={pendingLabel}>
        <LogOut aria-hidden="true" className="size-4" />
        {label}
      </SubmitButton>
    </form>
  );
}
