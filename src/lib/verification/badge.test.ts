import { describe, expect, it } from "vitest";
import { badgeFileProblem, badgeFromFormData, MAX_BADGE_BYTES } from "./badge";

describe("badgeFileProblem", () => {
  it.each([
    [{ type: "image/png", size: 1000 }, null],
    [{ type: "image/jpeg", size: 1000 }, null],
    [{ type: "image/webp", size: MAX_BADGE_BYTES }, null],
    [{ type: "image/png", size: MAX_BADGE_BYTES + 1 }, "badgeImageTooLarge"],
    [{ type: "image/gif", size: 1000 }, "badgeImageFormatUnsupported"],
    [{ type: "image/svg+xml", size: 1000 }, "badgeImageFormatUnsupported"],
    [{ type: "application/pdf", size: 1000 }, "badgeImageFormatUnsupported"],
    [{ type: "image/png", size: 0 }, "badgeImageInvalid"],
  ])("checks %j", (file, expected) => {
    expect(badgeFileProblem(file)).toBe(expected);
  });
});

describe("badgeFromFormData", () => {
  it("returns a valid file", () => {
    const body = new FormData();
    body.set("badge", new File(["x"], "badge.png", { type: "image/png" }));
    expect(badgeFromFormData(body).file?.name).toBe("badge.png");
  });

  it("rejects a missing field and an unsupported file", () => {
    expect(badgeFromFormData(new FormData()).error).toBe("badgeImageInvalid");
    const body = new FormData();
    body.set("badge", new File(["x"], "badge.gif", { type: "image/gif" }));
    expect(badgeFromFormData(body).error).toBe("badgeImageFormatUnsupported");
  });
});
