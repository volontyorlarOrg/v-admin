import { describe, expect, it } from "vitest";

import { failedResult, idleResult, okResult } from "@/lib/api/action-result";
import {
  errorMessage,
  fieldMessage,
  fieldsOf,
  formError,
  isSuccess,
} from "@/lib/forms/messages";

const catalog = {
  invalidCredentials: "Email or password is wrong.",
  required: "Fill this in.",
  email: "Enter a valid email address.",
};

describe("errorMessage", () => {
  it("translates a backend code", () => {
    expect(errorMessage("invalidCredentials", catalog, "fallback")).toBe(
      "Email or password is wrong.",
    );
  });

  it("falls back rather than showing a raw code to a coordinator", () => {
    expect(errorMessage("someNewBackendCode", catalog, "Something went wrong.")).toBe(
      "Something went wrong.",
    );
  });
});

describe("fieldMessage", () => {
  it("translates the first code on a field", () => {
    expect(fieldMessage({ email: ["email", "required"] }, "email", catalog)).toBe(
      "Enter a valid email address.",
    );
  });

  it("is undefined for a field with no error", () => {
    expect(fieldMessage({}, "email", catalog)).toBeUndefined();
  });

  it("shows the code itself when the catalog has no entry, so nothing is silent", () => {
    expect(fieldMessage({ email: ["unmapped"] }, "email", catalog)).toBe("unmapped");
  });
});

describe("formError", () => {
  it("is null while the form is untouched or successful", () => {
    expect(formError(idleResult, catalog, "fallback")).toBeNull();
    expect(formError(okResult, catalog, "fallback")).toBeNull();
  });

  it("stays silent when the failure is already shown on the fields", () => {
    expect(
      formError(failedResult("validationFailed", { email: ["email"] }), catalog, "f"),
    ).toBeNull();
  });

  it("speaks up for a validation failure with no field to attach to", () => {
    expect(formError(failedResult("validationFailed"), catalog, "fallback")).toBe(
      "fallback",
    );
  });

  it("reports a backend failure", () => {
    expect(formError(failedResult("invalidCredentials"), catalog, "fallback")).toBe(
      "Email or password is wrong.",
    );
  });
});

describe("fieldsOf and isSuccess", () => {
  it("reads the envelope without the caller matching on shapes", () => {
    expect(fieldsOf(failedResult("x", { a: ["b"] }))).toEqual({ a: ["b"] });
    expect(fieldsOf(okResult)).toEqual({});
    expect(isSuccess(okResult)).toBe(true);
    expect(isSuccess(idleResult)).toBe(false);
  });
});
