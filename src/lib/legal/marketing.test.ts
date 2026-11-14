import { describe, expect, it } from "vitest";

import { policyHref } from "./marketing";

describe("policyHref", () => {
  it("points at the marketing site's policy in the reader's language", () => {
    expect(policyHref("ru", "privacy", "https://volontyorlar.uz/")).toBe(
      "https://volontyorlar.uz/ru/privacy",
    );
  });

  it("hides the link instead of guessing an origin", () => {
    expect(policyHref("en", "terms", "")).toBeNull();
    expect(policyHref("en", "terms", undefined)).toBeNull();
    expect(policyHref("en", "terms", "javascript:alert(1)")).toBeNull();
  });
});
