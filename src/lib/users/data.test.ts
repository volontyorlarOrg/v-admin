import { describe, expect, it } from "vitest";

import { passwordLoginState } from "@/lib/users/password-state";

describe("passwordLoginState", () => {
  it("reports an account with no password login", () => {
    expect(passwordLoginState({})).toEqual({ kind: "none" });
    expect(passwordLoginState({ passwordCredential: undefined })).toEqual({
      kind: "none",
    });
  });

  it("reports when the password was last changed and whether a change is required", () => {
    expect(
      passwordLoginState({
        passwordCredential: {
          passwordChangedAt: "2026-09-01T09:00:00.000Z",
          requiresPasswordChange: true,
        },
      }),
    ).toEqual({
      kind: "set",
      changedAt: "2026-09-01T09:00:00.000Z",
      changeRequired: true,
    });
  });

  it("never exposes anything resembling the password itself", () => {
    const state = passwordLoginState({
      passwordCredential: {
        passwordChangedAt: "2026-09-01T09:00:00.000Z",
        requiresPasswordChange: false,
      },
    });

    expect(Object.keys(state).sort()).toEqual(["changeRequired", "changedAt", "kind"]);
  });
});
