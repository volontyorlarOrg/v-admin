import { describe, expect, it } from "vitest";

import { writeFailure } from "@/lib/api/action-result";
import { ApiError } from "@/lib/api/errors";

const published = { contract: "published" } as const;
const requested = { contract: "requested" } as const;

describe("writeFailure", () => {
  it("ends the session only when the backend says the session is over", () => {
    expect(
      writeFailure(
        new ApiError("unauthenticated", {
          status: 401,
          details: { code: "invalidAccessToken" },
        }),
        published,
      ),
    ).toMatchObject({ status: "error", code: "sessionExpired" });
  });

  it("keeps a wrong current password as the answer to the question asked", () => {
    expect(
      writeFailure(
        new ApiError("unauthenticated", {
          status: 401,
          details: { code: "invalidCredentials" },
        }),
        published,
      ),
    ).toMatchObject({ status: "error", code: "invalidCredentials" });
  });

  it("reads an uncoded 404 on an unpublished route as a missing contract", () => {
    expect(
      writeFailure(new ApiError("notFound", { status: 404 }), requested),
    ).toMatchObject({ code: "awaitingContract" });
  });

  it("reads an uncoded 501 on an unpublished route as a missing contract too", () => {
    expect(
      writeFailure(new ApiError("unavailable", { status: 501 }), requested),
    ).toMatchObject({ code: "awaitingContract" });
  });

  it("never blames the contract for a published route", () => {
    expect(
      writeFailure(new ApiError("notFound", { status: 404 }), published),
    ).toMatchObject({ code: "notFound" });
  });

  it("keeps the backend's own code and field errors", () => {
    expect(
      writeFailure(
        new ApiError("validation", {
          status: 422,
          details: { code: "approvalNoteRequired", errors: { note: ["required"] } },
        }),
        published,
      ),
    ).toEqual({
      status: "error",
      code: "approvalNoteRequired",
      fields: { note: ["required"] },
    });
  });

  it("falls back to a general failure for anything that is not an API error", () => {
    expect(writeFailure(new Error("boom"), published)).toMatchObject({
      code: "server",
    });
  });
});
