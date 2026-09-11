import { describe, expect, it } from "vitest";

import { initialsOf } from "@/lib/users/initials";

describe("initialsOf", () => {
  it("takes the first letter of the first two words", () => {
    expect(initialsOf("Nodira Alimova")).toBe("NA");
  });

  it("ignores anything past the second word", () => {
    expect(initialsOf("Shahnoza Rasulova Akbarovna")).toBe("SR");
  });

  it("handles a single name", () => {
    expect(initialsOf("Dilnoza")).toBe("D");
  });

  it("uppercases in the writing system it was given", () => {
    expect(initialsOf("нодира алимова")).toBe("НА");
  });

  it("survives extra whitespace", () => {
    expect(initialsOf("  Nodira   Alimova  ")).toBe("NA");
  });

  it("is empty when there is no name to take a letter from", () => {
    expect(initialsOf(undefined)).toBe("");
    expect(initialsOf("   ")).toBe("");
  });
});
