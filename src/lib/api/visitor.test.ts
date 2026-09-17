import { describe, expect, it } from "vitest";

import { visitorAddress, visitorHeaders } from "@/lib/api/visitor";

const SECRET = "frontend-proxy-secret-value-at-least-32-characters";

describe("visitorAddress", () => {
  it("prefers the address the hosting edge reports", () => {
    const incoming = new Headers({
      "x-real-ip": "203.0.113.5",
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
    });
    expect(visitorAddress(incoming)).toBe("203.0.113.5");
  });

  it("falls back to the first forwarded address", () => {
    const incoming = new Headers({ "x-forwarded-for": " 2001:db8::1 , 10.0.0.1" });
    expect(visitorAddress(incoming)).toBe("2001:db8::1");
  });

  it("refuses anything that is not shaped like an address", () => {
    for (const value of ["", "unknown", "203.0.113.5; drop", "a".repeat(46)]) {
      expect(visitorAddress(new Headers({ "x-real-ip": value })), value).toBeNull();
    }
    expect(visitorAddress(new Headers())).toBeNull();
  });
});

describe("visitorHeaders", () => {
  it("vouches for the visitor only when the proxy secret is configured", () => {
    const incoming = new Headers({ "x-real-ip": "203.0.113.5" });

    expect(visitorHeaders(null, incoming)).toEqual({});
    expect(visitorHeaders(SECRET, incoming)).toEqual({
      "X-Volontyorlar-Proxy-Secret": SECRET,
      "X-Volontyorlar-Client-Ip": "203.0.113.5",
    });
  });

  it("sends nothing when there is no address to vouch for", () => {
    expect(visitorHeaders(SECRET, new Headers())).toEqual({});
  });
});
