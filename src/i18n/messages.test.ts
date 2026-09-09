import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { locales } from "@/i18n/routing";

const MESSAGES_DIR = join(process.cwd(), "src/i18n/messages");

type Messages = { [key: string]: string | Messages };

function load(locale: string): Messages {
  return JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), "utf8"));
}

function flatten(messages: Messages, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === "string"
      ? [`${prefix}${key}`]
      : flatten(value, `${prefix}${key}.`),
  );
}

function values(messages: Messages, prefix = ""): Array<[string, string]> {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === "string"
      ? [[`${prefix}${key}`, value] as [string, string]]
      : values(value, `${prefix}${key}.`),
  );
}

function icuArguments(message: string): string[] {
  const names = new Set<string>();
  let depth = 0;

  for (let index = 0; index < message.length; index += 1) {
    const char = message[index];

    if (char === "}") {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (char !== "{") continue;

    if (depth === 0) {
      const identifier = /^\{\s*(\w+)\s*[,}]/.exec(message.slice(index));
      if (identifier?.[1]) names.add(identifier[1]);
    }

    depth += 1;
  }

  return [...names].sort();
}

describe("message catalogs", () => {
  it("has exactly one catalog per supported locale", () => {
    const files = readdirSync(MESSAGES_DIR).filter((name) => name.endsWith(".json"));
    expect(files.sort()).toEqual(locales.map((locale) => `${locale}.json`).sort());
  });

  it("defines the same keys in every locale, so no locale falls back", () => {
    const reference = flatten(load("en")).sort();
    expect(reference.length).toBeGreaterThan(200);

    for (const locale of locales) {
      expect(flatten(load(locale)).sort(), `locale: ${locale}`).toEqual(reference);
    }
  });

  it("has no empty or placeholder string", () => {
    for (const locale of locales) {
      for (const [key, value] of values(load(locale))) {
        expect(value.trim(), `${locale}: ${key}`).not.toBe("");
        expect(value, `${locale}: ${key}`).not.toMatch(/TODO|FIXME|\{\{|lorem/i);
      }
    }
  });

  it("uses the same ICU arguments in every locale", () => {
    const reference = new Map(
      values(load("en")).map(([key, value]) => [key, icuArguments(value)]),
    );

    for (const locale of locales) {
      for (const [key, value] of values(load(locale))) {
        expect({ key, names: icuArguments(value) }, `${locale}: ${key}`).toEqual({
          key,
          names: reference.get(key),
        });
      }
    }
  });

  it("writes Uzbek with the turned comma, not a straight apostrophe", () => {
    for (const [key, value] of values(load("uz"))) {
      expect(value, `uz: ${key} uses ' instead of ʻ`).not.toMatch(/[a-z]'[a-z]/i);
    }
  });

  it("writes Russian in Cyrillic rather than leaving English copy behind", () => {
    const ru = values(load("ru"));
    const cyrillic = ru.filter(([, value]) => /[Ѐ-ӿ]/.test(value));
    expect(cyrillic.length / ru.length).toBeGreaterThan(0.8);
  });

  it("names every navigation section the route registry declares", async () => {
    const { navRoutes, PASSWORD_ROUTE } = await import("@/lib/routing/routes");
    const keys = new Set(flatten(load("en")));

    for (const route of [...navRoutes, { key: PASSWORD_ROUTE }]) {
      expect(keys.has(`nav.${route.key}`), `nav.${route.key}`).toBe(true);
    }
  });

  it("has no sign-up or account-creation label anywhere in the catalog", () => {
    for (const locale of locales) {
      const forbidden = flatten(load(locale)).filter((key) =>
        /signUp|signup|createAccount|register|forgotPassword|resetPassword/i.test(key),
      );

      expect(forbidden, locale).toEqual([]);
    }
  });
});
