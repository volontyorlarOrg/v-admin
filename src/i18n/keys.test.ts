import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import en from "@/i18n/messages/en.json";

const SOURCE = join(process.cwd(), "src");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith(".tsx") && !path.endsWith(".test.tsx") ? [path] : [];
  });
}

function exists(path: string): boolean {
  let node: unknown = en;
  for (const part of path.split(".")) {
    if (!node || typeof node !== "object" || !(part in node)) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return true;
}

function bindings(source: string): Map<string, string> {
  const found = new Map<string, string>();

  for (const match of source.matchAll(
    /const \[([^\]]+)\]\s*=\s*await Promise\.all\(\[([\s\S]*?)\]\)/g,
  )) {
    const names = (match[1] ?? "").split(",").map((name) => name.trim());
    const calls = (match[2] ?? "")
      .split(/,\s*(?![^()]*\))/)
      .map((call) => call.trim())
      .filter(Boolean);
    names.forEach((name, index) => {
      const namespace = /^getTranslations\("([^"]+)"\)$/.exec(calls[index] ?? "")?.[1];
      if (namespace) found.set(name, namespace);
    });
  }

  for (const match of source.matchAll(
    /const (\w+) = await getTranslations\((?:\{[^}]*namespace: )?"([^"]+)"/g,
  )) {
    if (match[1] && match[2]) found.set(match[1], match[2]);
  }

  return found;
}

function staticKeys(): Array<{ file: string; key: string }> {
  return sourceFiles(SOURCE).flatMap((path) => {
    const source = readFileSync(path, "utf8");
    return [...bindings(source)].flatMap(([name, namespace]) =>
      [
        ...source.matchAll(
          new RegExp(`(?<![\\w.])${name}(?:\\.rich)?\\(\\s*"([A-Za-z0-9_.]+)"`, "g"),
        ),
      ].map((match) => ({
        file: relative(SOURCE, path),
        key: `${namespace}.${match[1]}`,
      })),
    );
  });
}

describe("server-rendered copy", () => {
  const keys = staticKeys();

  it("finds the keys it is meant to check", () => {
    expect(keys.length).toBeGreaterThan(200);
  });

  it("asks only for keys the catalog has, so no screen logs a missing message", () => {
    const missing = keys.filter(({ key }) => !exists(key));
    expect(missing).toEqual([]);
  });
});
