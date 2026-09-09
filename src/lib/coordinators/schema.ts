import { z } from "zod";

import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  emailField,
  newPasswordField,
} from "@/lib/auth/credentials";

export const createCoordinatorSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(DISPLAY_NAME_MIN_LENGTH, "required")
    .max(DISPLAY_NAME_MAX_LENGTH, "nameLong"),
  email: emailField,
  temporaryPassword: newPasswordField,
});
