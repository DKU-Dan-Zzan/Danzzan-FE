#!/usr/bin/env node
// 역할: src 레이어의 순환 의존을 CI에서 차단합니다.

import madge from "madge";

const TARGET_ROOT = "src";
const MADGE_OPTIONS = {
  fileExtensions: ["ts", "tsx"],
  tsConfig: "./tsconfig.app.json",
  includeNpm: false,
};

async function run() {
  const graph = await madge(TARGET_ROOT, MADGE_OPTIONS);
  const cycles = graph.circular();

  if (cycles.length === 0) {
    process.stdout.write("[check-deps-cycles] circular dependencies: 0\n");
    return;
  }

  process.stderr.write(`[check-deps-cycles] circular dependencies: ${cycles.length}\n`);
  cycles.forEach((cycle, index) => {
    process.stderr.write(`  ${index + 1}. ${cycle.join(" -> ")}\n`);
  });
  process.exit(1);
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[check-deps-cycles] fatal: ${message}\n`);
  process.exit(2);
});
