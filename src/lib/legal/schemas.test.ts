import { describe, expect, it } from "vitest";

import { legalQueueSchema, legalResolutionSchema } from "./schemas";

const request = {
  id: "00000000-0000-4000-8000-000000000091",
  kind: "access",
  message: "",
  status: "open",
  resolution: null,
  createdAt: "2026-11-14T08:00:00.000Z",
  resolvedAt: null,
  requester: {
    id: "00000000-0000-4000-8000-000000000092",
    displayName: null,
    username: "dilnoza",
    email: null,
  },
};

describe("data request contract", () => {
  it("accepts an open request together with who sent it", () => {
    expect(
      legalQueueSchema.parse({ items: [request] }).items[0]?.requester.username,
    ).toBe("dilnoza");
  });

  it("refuses a request kind the policy does not offer", () => {
    expect(
      legalQueueSchema.safeParse({ items: [{ ...request, kind: "guardian" }] }).success,
    ).toBe(false);
  });

  it("refuses an empty answer, because the volunteer reads it as the outcome", () => {
    expect(
      legalResolutionSchema.safeParse({ id: request.id, resolution: "   " }).success,
    ).toBe(false);
  });
});
