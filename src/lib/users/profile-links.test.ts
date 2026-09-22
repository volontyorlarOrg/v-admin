import { describe, expect, it } from "vitest";

import {
  handleText,
  instagramHref,
  linkedinHref,
  safeHttpUrl,
  telegramHref,
} from "@/lib/users/profile-links";

describe("profile links", () => {
  it("opens only web addresses", () => {
    expect(safeHttpUrl("https://portfolio.example/dilnoza")).toBe(
      "https://portfolio.example/dilnoza",
    );
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("not a link")).toBeNull();
    expect(safeHttpUrl(undefined)).toBeNull();
  });

  it("turns a Telegram or Instagram username into its profile address", () => {
    expect(telegramHref("@dilnoza_k")).toBe("https://t.me/dilnoza_k");
    expect(instagramHref("dilnoza.codes")).toBe(
      "https://www.instagram.com/dilnoza.codes/",
    );
    expect(telegramHref("not a name")).toBeNull();
    expect(instagramHref("")).toBeNull();
  });

  it("accepts a LinkedIn address or username and nothing on another site", () => {
    expect(linkedinHref("https://www.linkedin.com/in/dilnoza-k")).toBe(
      "https://www.linkedin.com/in/dilnoza-k",
    );
    expect(linkedinHref("dilnoza-k")).toBe("https://www.linkedin.com/in/dilnoza-k");
    expect(linkedinHref("not a slug")).toBeNull();
    expect(linkedinHref("https://evil.example/in/dilnoza")).toBeNull();
  });

  it("shows a username once, with a single @", () => {
    expect(handleText("@@dilnoza_k")).toBe("@dilnoza_k");
    expect(handleText(" ")).toBeNull();
  });
});
