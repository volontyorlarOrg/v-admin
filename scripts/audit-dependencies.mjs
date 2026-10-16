import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const advisory = "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm";
const expiresAt = new Date("2026-11-07T00:00:00Z");
const tooling = new Set([
  "braces",
  "micromatch",
  "fast-glob",
  "@next/eslint-plugin-next",
  "eslint-config-next",
]);
const lock = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"),
);
const result = spawnSync("npm", ["audit", "--json"], {
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024,
});
if (result.error || ![0, 1].includes(result.status))
  throw new Error("Dependency audit could not complete");
const report = JSON.parse(result.stdout);
if (report.error || !report.vulnerabilities || !report.metadata)
  throw new Error("Dependency audit returned an invalid report");

function acceptedTooling(name, visited = new Set()) {
  if (new Date() >= expiresAt || !tooling.has(name) || visited.has(name)) return false;
  const entry = report.vulnerabilities[name];
  if (!entry || entry.severity !== "high" || !entry.nodes.length || !entry.via.length)
    return false;
  if (!entry.nodes.every((node) => lock.packages[node]?.dev === true)) return false;
  const next = new Set([...visited, name]);
  return entry.via.every((cause) =>
    typeof cause === "string"
      ? acceptedTooling(cause, next)
      : name === "braces" &&
        cause.name === "braces" &&
        cause.url === advisory &&
        cause.severity === "high",
  );
}

const findings = Object.entries(report.vulnerabilities).filter(([, entry]) =>
  ["high", "critical"].includes(entry.severity),
);
const blocked = findings.filter(([name]) => !acceptedTooling(name));
for (const [name, entry] of blocked) console.error(`${entry.severity}: ${name}`);
if (blocked.length) process.exitCode = 1;
else {
  console.log("No high or critical runtime dependency advisories.");
  if (findings.length)
    console.log(
      `Development-only exception until ${expiresAt.toISOString()}: ${advisory} (${findings.map(([name]) => name).join(", ")}).`,
    );
}
