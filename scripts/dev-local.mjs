import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const [environmentFile, port] = process.argv.slice(2);

if (!environmentFile || !port) {
  throw new Error("Expected an environment file and development port");
}

const environmentPath = resolve(process.cwd(), environmentFile);
const variablePattern = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/gm;

for (const match of readFileSync(environmentPath, "utf8").matchAll(variablePattern)) {
  delete process.env[match[1]];
}

process.loadEnvFile(environmentPath);

const next = resolve(process.cwd(), "node_modules/next/dist/bin/next");
const child = spawn(process.execPath, [next, "dev", "--turbopack", "-p", port], {
  env: process.env,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
