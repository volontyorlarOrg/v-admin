import { describe, expect, it } from "vitest";

import {
  articleState,
  bodyFacts,
  cleanBody,
  groupRevisions,
  isValidSlug,
  lastEdited,
  normalizeHref,
  publishChecklist,
  slugFromTitle,
  translationState,
} from "@/lib/blog/content";

const MEDIA = "0b3f4a52-4c1e-4d7a-9f10-2b6c8e1d5a90";
const paragraph = (...content: object[]) => ({ type: "paragraph", content });
const text = (value: string, marks?: object[]) => ({
  type: "text",
  text: value,
  ...(marks ? { marks } : {}),
});

describe("normalizeHref", () => {
  it("keeps full web and mail addresses the backend accepts", () => {
    expect(normalizeHref("https://volontyorlar.uz/en")).toBe(
      "https://volontyorlar.uz/en",
    );
    expect(normalizeHref("mailto:hello@volontyorlar.uz")).toBe(
      "mailto:hello@volontyorlar.uz",
    );
  });

  it("adds https to a bare address so the save is not rejected", () => {
    expect(normalizeHref("volontyorlar.uz/en/volunteering")).toBe(
      "https://volontyorlar.uz/en/volunteering",
    );
    expect(normalizeHref("www.example.org")).toBe("https://www.example.org");
  });

  it("turns an email address into a mail link", () => {
    expect(normalizeHref("hello@volontyorlar.uz")).toBe("mailto:hello@volontyorlar.uz");
  });

  it("resolves a site path against the public site only when it is known", () => {
    expect(normalizeHref("/en/volunteering", "https://volontyorlar.uz")).toBe(
      "https://volontyorlar.uz/en/volunteering",
    );
    expect(normalizeHref("/en/volunteering")).toBeNull();
  });

  it("refuses schemes and text the backend would reject", () => {
    expect(normalizeHref("tel:+998901234567")).toBeNull();
    expect(normalizeHref("javascript:alert(1)")).toBeNull();
    expect(normalizeHref("just words")).toBeNull();
    expect(normalizeHref("")).toBeNull();
  });
});

describe("cleanBody", () => {
  it("drops formatting the backend refuses instead of failing every save", () => {
    const body = cleanBody({
      type: "doc",
      content: [
        paragraph(
          text("code", [{ type: "code" }]),
          text(" struck", [{ type: "strike" }, { type: "bold" }]),
        ),
        { type: "horizontalRule" },
        { type: "codeBlock", content: [text("npm run dev")] },
      ],
    });
    expect(body).toEqual({
      type: "doc",
      content: [
        paragraph(text("code"), text(" struck", [{ type: "bold" }])),
        paragraph(text("npm run dev")),
      ],
    });
  });

  it("repairs or removes links the backend would reject", () => {
    const body = cleanBody({
      type: "doc",
      content: [
        paragraph(
          text("site", [{ type: "link", attrs: { href: "volontyorlar.uz" } }]),
          text(" call", [{ type: "link", attrs: { href: "tel:+998" } }]),
        ),
      ],
    });
    expect(body.content?.[0]?.content).toEqual([
      text("site", [{ type: "link", attrs: { href: "https://volontyorlar.uz" } }]),
      text(" call"),
    ]);
  });

  it("removes pictures that were pasted from elsewhere and fills missing picture text", () => {
    const body = cleanBody({
      type: "doc",
      content: [
        { type: "image", attrs: { src: "https://example.com/a.jpg", mediaId: null } },
        { type: "image", attrs: { mediaId: MEDIA, alt: null } },
      ],
    });
    expect(body.content).toEqual([
      { type: "image", attrs: { mediaId: MEDIA, alt: "", caption: "", credit: "" } },
    ]);
  });

  it("keeps an empty document valid", () => {
    expect(cleanBody({ type: "doc", content: [] })).toEqual({
      type: "doc",
      content: [{ type: "paragraph", content: [] }],
    });
  });
});

describe("publishChecklist", () => {
  it("names each missing essential instead of one general message", () => {
    const items = publishChecklist({
      title: "Title",
      summary: " ",
      facts: bodyFacts({
        type: "doc",
        content: [
          paragraph(text("Body")),
          { type: "image", attrs: { mediaId: MEDIA, alt: "" } },
          { type: "image", attrs: { mediaId: MEDIA, alt: "A volunteer" } },
        ],
      }),
      coverMediaId: MEDIA,
      coverAlt: "",
    });
    expect(items).toEqual([
      { key: "title", done: true },
      { key: "summary", done: false },
      { key: "body", done: true },
      { key: "imageAlt", done: false, missing: 1 },
      { key: "coverAlt", done: false },
    ]);
  });
});

describe("bodyFacts", () => {
  it("counts words across blocks without gluing them together", () => {
    expect(
      bodyFacts({
        type: "doc",
        content: [paragraph(text("One two")), paragraph(text("three"))],
      }).words,
    ).toBe(3);
  });
});

describe("translationState", () => {
  const revisions = [
    { id: "a", version: 3 },
    { id: "b", version: 5 },
  ];

  it("tells a published language with newer saves from one without", () => {
    expect(translationState({ version: 5, publishedRevisionId: "b" }, revisions)).toBe(
      "published",
    );
    expect(translationState({ version: 5, publishedRevisionId: "a" }, revisions)).toBe(
      "changes",
    );
    expect(translationState({ version: 2, publishedRevisionId: null }, revisions)).toBe(
      "draft",
    );
    expect(translationState(undefined, revisions)).toBe("missing");
  });
});

describe("article list facts", () => {
  it("dates an article by its latest language save, which the post itself does not record", () => {
    expect(
      lastEdited({
        updatedAt: "2026-09-28T10:00:00.000Z",
        translations: [
          { updatedAt: "2026-09-28T12:30:00.000Z" },
          { updatedAt: "2026-09-28T11:00:00.000Z" },
        ],
      }),
    ).toBe("2026-09-28T12:30:00.000Z");
  });

  it("calls an article published while any language is live", () => {
    expect(
      articleState({
        archivedAt: null,
        translations: [{ publishedRevisionId: null }, { publishedRevisionId: "x" }],
      }),
    ).toBe("published");
    expect(
      articleState({
        archivedAt: "2026-09-28",
        translations: [{ publishedRevisionId: "x" }],
      }),
    ).toBe("archived");
  });
});

describe("groupRevisions", () => {
  it("folds a burst of autosaves into one entry but keeps publications separate", () => {
    const at = (minutes: number, published = false) => ({
      id: String(minutes),
      createdAt: new Date(Date.UTC(2026, 8, 28, 10, minutes)).toISOString(),
      publishedAt: published ? "2026-09-28T11:00:00.000Z" : null,
    });
    const entries = groupRevisions([at(0), at(2), at(5), at(6, true), at(40), at(42)]);
    expect(entries.map((entry) => [entry.revision.id, entry.saves])).toEqual([
      ["42", 2],
      ["6", 1],
      ["5", 3],
    ]);
  });
});

describe("slugs", () => {
  it("suggests an address from a title in any of the three languages", () => {
    expect(slugFromTitle("Volontyorlik: birinchi qadam!")).toBe(
      "volontyorlik-birinchi-qadam",
    );
    expect(slugFromTitle("Как выбрать первую возможность")).toBe(
      "kak-vybrat-pervuyu-vozmozhnost",
    );
    expect(slugFromTitle("Oʻzbekiston yoshlari")).toBe("ozbekiston-yoshlari");
  });

  it("accepts only lowercase words joined by single hyphens", () => {
    expect(isValidSlug("first-steps-2026")).toBe(true);
    expect(isValidSlug("First steps")).toBe(false);
    expect(isValidSlug("double--hyphen")).toBe(false);
  });
});
