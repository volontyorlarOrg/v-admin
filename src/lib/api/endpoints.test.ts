import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  endpoints,
  pathFor,
  type Endpoint,
  type EndpointName,
} from "@/lib/api/endpoints";

const GENERATED = join(process.cwd(), "src/lib/api/generated/schema.d.ts");

function documentedOperations(): Map<string, Set<string>> {
  const source = readFileSync(GENERATED, "utf8");
  const operations = new Map<string, Set<string>>();
  let path: string | null = null;

  for (const line of source.split("\n")) {
    const pathMatch = /^ {4}"(\/[^"]*)": \{$/.exec(line);
    if (pathMatch?.[1]) {
      path = pathMatch[1];
      operations.set(path, new Set());
      continue;
    }
    if (!path) continue;
    if (/^ {4}\};$/.test(line)) {
      path = null;
      continue;
    }
    const methodMatch = /^ {8}(get|put|post|delete|patch): operations\[/.exec(line);
    if (methodMatch?.[1]) operations.get(path)?.add(methodMatch[1].toUpperCase());
  }

  return operations;
}

const documented = documentedOperations();
const entries = Object.entries(endpoints) as Array<[EndpointName, Endpoint]>;

function isDocumented({ method, path }: Endpoint): boolean {
  return documented.get(path)?.has(method) ?? false;
}

describe("the generated contract", () => {
  it("was generated from a document with paths in it", () => {
    expect(documented.size).toBeGreaterThan(20);
    expect(documented.get("/auth/refresh")?.has("POST")).toBe(true);
  });
});

describe("the endpoint registry", () => {
  it("declares at least one endpoint per portal area", () => {
    expect(entries.length).toBeGreaterThan(10);
  });

  it("uses a distinct method and path for every entry", () => {
    const seen = entries.map(([, endpoint]) => `${endpoint.method} ${endpoint.path}`);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it.each(entries.filter(([, endpoint]) => endpoint.contract === "published"))(
    "%s is published in the generated contract",
    (_name, endpoint) => {
      expect(isDocumented(endpoint)).toBe(true);
    },
  );

  it.each(entries.filter(([, endpoint]) => endpoint.contract !== "published"))(
    "%s is still absent from the generated contract, so its status is honest",
    (_name, endpoint) => {
      expect(isDocumented(endpoint)).toBe(false);
    },
  );
});

describe("pathFor", () => {
  it("returns a literal path unchanged", () => {
    expect(pathFor("refresh")).toBe("/auth/refresh");
  });

  it("substitutes and encodes a path parameter", () => {
    const [name] = entries.find(([, endpoint]) => endpoint.path.includes("{id}")) ?? [];
    if (!name) return;

    expect(pathFor(name, { id: "a b/c" })).toContain("a%20b%2Fc");
  });

  it("refuses to build a path with a missing parameter", () => {
    const [name] = entries.find(([, endpoint]) => endpoint.path.includes("{id}")) ?? [];
    if (!name) return;

    expect(() => pathFor(name, {})).toThrow(/Missing "id"/);
  });
});
