import type { DirectoryUser } from "@/lib/api/schemas";

export type PasswordLoginState =
  { kind: "none" } | { kind: "set"; changedAt?: string; changeRequired: boolean };

export function passwordLoginState(user: {
  passwordCredential?: DirectoryUser["passwordCredential"];
}): PasswordLoginState {
  const credential = user.passwordCredential;
  if (!credential) return { kind: "none" };

  return {
    kind: "set",
    ...(credential.passwordChangedAt !== undefined
      ? { changedAt: credential.passwordChangedAt }
      : {}),
    changeRequired: credential.requiresPasswordChange,
  };
}
