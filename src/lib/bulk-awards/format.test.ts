import { describe, expect, it } from "vitest";
import { fill, formatAmount } from "./format";

describe("award amounts in client components", () => {
  it("groups thousands the same way on the server and in every browser", () => {
    expect(formatAmount(28000, "en")).toBe("28,000");
    expect(formatAmount(28000, "uz")).toBe("28 000");
    expect(formatAmount(28000, "ru")).toBe("28 000");
  });

  it("keeps up to two decimals for hours and drops trailing zeros", () => {
    expect(formatAmount(1.25, "en")).toBe("1.25");
    expect(formatAmount(12.5, "ru")).toBe("12,5");
    expect(formatAmount(1234.1, "uz")).toBe("1 234,1");
    expect(formatAmount(12, "en")).toBe("12");
  });

  it("fills named placeholders and leaves unknown ones visible", () => {
    expect(fill("Select all {count} results", { count: "40" })).toBe(
      "Select all 40 results",
    );
    expect(fill("{name} and {other}", { name: "Aziza" })).toBe("Aziza and {other}");
  });
});
