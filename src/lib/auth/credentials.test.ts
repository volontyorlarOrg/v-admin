import { describe, expect, it } from "vitest";

import {
  changePasswordFromFormData,
  changePasswordSchema,
  credentialsFromFormData,
  fieldErrorsOf,
  logInSchema,
  temporaryPasswordSchema,
} from "@/lib/auth/credentials";

function formData(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

describe("logInSchema", () => {
  it("accepts an email and any non-empty password", () => {
    expect(
      logInSchema.safeParse({ email: "coordinator@example.org", password: "x" })
        .success,
    ).toBe(true);
  });

  it("names the field that failed rather than a sentence", () => {
    const result = logInSchema.safeParse({ email: "not-an-email", password: "" });

    expect(result.success).toBe(false);
    expect(fieldErrorsOf(result.error!)).toEqual({
      email: ["email"],
      password: ["required"],
    });
  });

  it("trims the email so a stray space is not a failed sign-in", () => {
    const parsed = logInSchema.parse({ email: "  a@b.org ", password: "x" });
    expect(parsed.email).toBe("a@b.org");
  });
});

describe("changePasswordSchema", () => {
  const valid = {
    currentPassword: "old-password",
    newPassword: "a-new-password",
    confirmPassword: "a-new-password",
  };

  it("accepts a confirmed new password", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a mismatched confirmation on the confirmation field", () => {
    const result = changePasswordSchema.safeParse({
      ...valid,
      confirmPassword: "something-else",
    });

    expect(fieldErrorsOf(result.error!)).toEqual({
      confirmPassword: ["passwordMismatch"],
    });
  });

  it("rejects reusing the current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "same-password",
      newPassword: "same-password",
      confirmPassword: "same-password",
    });

    expect(fieldErrorsOf(result.error!)).toEqual({
      newPassword: ["passwordUnchanged"],
    });
  });

  it("rejects a new password below the backend minimum", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old-password",
      newPassword: "short",
      confirmPassword: "short",
    });

    expect(fieldErrorsOf(result.error!).newPassword).toEqual(["passwordShort"]);
  });
});

describe("temporaryPasswordSchema", () => {
  it("asks only for the replacement, never for an existing password", () => {
    expect(Object.keys(temporaryPasswordSchema.shape)).toEqual(["temporaryPassword"]);
  });

  it("holds the replacement to the same minimum length", () => {
    expect(
      temporaryPasswordSchema.safeParse({ temporaryPassword: "abc" }).success,
    ).toBe(false);
    expect(
      temporaryPasswordSchema.safeParse({ temporaryPassword: "a-long-enough-one" })
        .success,
    ).toBe(true);
  });
});

describe("reading a submitted form", () => {
  it("reads only the credential fields it knows about", () => {
    expect(
      credentialsFromFormData(
        formData({ email: " a@b.org ", password: "secret", role: "admin" }),
      ),
    ).toEqual({ email: "a@b.org", password: "secret" });
  });

  it("never trims a password, because spaces can be part of one", () => {
    expect(
      changePasswordFromFormData(
        formData({
          currentPassword: " old ",
          newPassword: " new ",
          confirmPassword: " new ",
        }),
      ),
    ).toEqual({
      currentPassword: " old ",
      newPassword: " new ",
      confirmPassword: " new ",
    });
  });

  it("treats a missing field as empty rather than throwing", () => {
    expect(credentialsFromFormData(new FormData())).toEqual({
      email: "",
      password: "",
    });
  });
});
