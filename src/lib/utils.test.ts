import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("keeps a type-scale size beside a text colour, because they set different properties", () => {
    expect(cn("text-figure-inline", "text-ink")).toBe("text-figure-inline text-ink");
    expect(cn("text-page-compact sm:text-page", "text-ink")).toBe(
      "text-page-compact sm:text-page text-ink",
    );
    expect(cn("text-label", "text-ink-muted")).toBe("text-label text-ink-muted");
  });

  it("still lets a later size replace an earlier one", () => {
    expect(cn("text-section", "text-figure-inline")).toBe("text-figure-inline");
  });
});
