import { describe, expect, it } from "vitest";

import { fieldErrorsOf } from "@/lib/auth/credentials";
import { createCoordinatorSchema } from "@/lib/coordinators/schema";

const valid = {
  displayName: "Nodira Alimova",
  email: "nodira@example.org",
  temporaryPassword: "a-temporary-password",
};

describe("createCoordinatorSchema", () => {
  it("asks for a name, an email and a temporary password, and nothing else", () => {
    expect(Object.keys(createCoordinatorSchema.shape).sort()).toEqual([
      "displayName",
      "email",
      "temporaryPassword",
    ]);
  });

  it("accepts a complete coordinator", () => {
    expect(createCoordinatorSchema.safeParse(valid).success).toBe(true);
  });

  it("refuses a temporary password below the backend minimum", () => {
    const result = createCoordinatorSchema.safeParse({
      ...valid,
      temporaryPassword: "short",
    });
    expect(fieldErrorsOf(result.error!).temporaryPassword).toEqual(["passwordShort"]);
  });

  it("refuses a malformed email", () => {
    const result = createCoordinatorSchema.safeParse({ ...valid, email: "nodira" });
    expect(fieldErrorsOf(result.error!).email).toEqual(["email"]);
  });

  it("refuses an empty name", () => {
    const result = createCoordinatorSchema.safeParse({ ...valid, displayName: " " });
    expect(fieldErrorsOf(result.error!).displayName).toEqual(["required"]);
  });
});
