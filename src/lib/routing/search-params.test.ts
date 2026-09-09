import { describe, expect, it } from "vitest";

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  hrefWith,
  paginate,
  queryString,
  readOption,
  readPage,
  readPageSize,
  readParam,
} from "@/lib/routing/search-params";

describe("readParam", () => {
  it("trims a single value", () => {
    expect(readParam({ q: "  nodira " }, "q")).toBe("nodira");
  });

  it("takes the first of a repeated parameter rather than joining them", () => {
    expect(readParam({ q: ["one", "two"] }, "q")).toBe("one");
  });

  it("is an empty string when absent", () => {
    expect(readParam({}, "q")).toBe("");
  });
});

describe("readOption", () => {
  it("accepts only a listed value, so a crafted URL cannot widen a query", () => {
    const allowed = ["submitted", "accepted"] as const;

    expect(readOption({ status: "accepted" }, "status", allowed)).toBe("accepted");
    expect(readOption({ status: "deleted" }, "status", allowed)).toBeUndefined();
    expect(readOption({}, "status", allowed)).toBeUndefined();
  });
});

describe("readPage", () => {
  it("starts at one and refuses anything that is not a positive integer", () => {
    expect(readPage({})).toBe(1);
    expect(readPage({ page: "3" })).toBe(3);
    expect(readPage({ page: "0" })).toBe(1);
    expect(readPage({ page: "-2" })).toBe(1);
    expect(readPage({ page: "many" })).toBe(1);
  });
});

describe("readPageSize", () => {
  it("uses the default and caps the maximum", () => {
    expect(readPageSize({})).toBe(DEFAULT_PAGE_SIZE);
    expect(readPageSize({ pageSize: "10" })).toBe(10);
    expect(readPageSize({ pageSize: "5000" })).toBe(MAX_PAGE_SIZE);
  });
});

describe("queryString", () => {
  it("drops empty values so a cleared filter leaves the URL", () => {
    expect(queryString({ q: "", page: 2, status: undefined })).toBe("?page=2");
  });

  it("is empty when nothing is set", () => {
    expect(queryString({ q: "" })).toBe("");
  });

  it("encodes a value rather than pasting it in raw", () => {
    expect(queryString({ q: "a b&c" })).toBe("?q=a+b%26c");
  });
});

describe("hrefWith", () => {
  it("keeps the filters in the URL so a list can be shared and reloaded", () => {
    expect(hrefWith("/users", { q: "nodira", page: 2 })).toBe("/users?q=nodira&page=2");
  });
});

describe("paginate", () => {
  it("slices a page and reports the true total", () => {
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual({
      items: [3, 4],
      page: 2,
      pageSize: 2,
      total: 5,
    });
  });

  it("returns an empty page past the end rather than wrapping", () => {
    expect(paginate([1, 2], 9, 2).items).toEqual([]);
  });
});
