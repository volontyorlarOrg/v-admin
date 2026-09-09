import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 120;
export const EMAIL_MAX_LENGTH = 254;

export const emailField = z
  .string()
  .trim()
  .min(1, "required")
  .max(EMAIL_MAX_LENGTH, "emailLong")
  .pipe(z.email("email"));

export const newPasswordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, "passwordShort")
  .max(PASSWORD_MAX_LENGTH, "passwordLong");

export const logInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "required").max(PASSWORD_MAX_LENGTH, "passwordLong"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "required")
      .max(PASSWORD_MAX_LENGTH, "passwordLong"),
    newPassword: newPasswordField,
    confirmPassword: z.string().min(1, "required"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordMismatch",
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ["newPassword"],
    message: "passwordUnchanged",
  });

export const temporaryPasswordSchema = z.object({
  temporaryPassword: newPasswordField,
});

export type LogInValues = z.input<typeof logInSchema>;
export type ChangePasswordValues = z.input<typeof changePasswordSchema>;
export type TemporaryPasswordValues = z.input<typeof temporaryPasswordSchema>;

export function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function credentialsFromFormData(formData: FormData) {
  return {
    email: stringField(formData, "email").trim(),
    password: stringField(formData, "password"),
  };
}

export function changePasswordFromFormData(formData: FormData) {
  return {
    currentPassword: stringField(formData, "currentPassword"),
    newPassword: stringField(formData, "newPassword"),
    confirmPassword: stringField(formData, "confirmPassword"),
  };
}

export function fieldErrorsOf(error: z.ZodError): Record<string, string[]> {
  const output: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string") continue;
    output[field] = [...(output[field] ?? []), issue.message];
  }

  return output;
}
