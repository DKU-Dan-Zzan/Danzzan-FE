#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DIST_ASSETS_DIR = path.join(process.cwd(), "dist", "assets");

const BUDGETS = [
  {
    label: "mapbox chunk",
    pattern: /^mapbox-.*\.js$/,
    maxBytes: 1_750_000,
  },
];

const APP_INDEX_BUDGET_BYTES = 270_000;

const formatKB = (bytes) => `${(bytes / 1024).toFixed(2)} KiB`;

if (!fs.existsSync(DIST_ASSETS_DIR)) {
  console.error("[bundle-budget] dist/assets 디렉터리가 없습니다. 먼저 build를 실행하세요.");
  process.exit(1);
}

const files = fs.readdirSync(DIST_ASSETS_DIR);
let hasViolation = false;

for (const budget of BUDGETS) {
  const targetFiles = files.filter((file) => budget.pattern.test(file));
  if (targetFiles.length === 0) {
    console.error(`[bundle-budget] ${budget.label} 파일을 찾지 못했습니다.`);
    hasViolation = true;
    continue;
  }

  for (const targetFile of targetFiles) {
    const absolutePath = path.join(DIST_ASSETS_DIR, targetFile);
    const size = fs.statSync(absolutePath).size;
    const pass = size <= budget.maxBytes;

    console.log(
      `[bundle-budget] ${budget.label}: ${targetFile} (${formatKB(size)}) / budget ${formatKB(budget.maxBytes)} -> ${pass ? "PASS" : "FAIL"}`,
    );

    if (!pass) {
      hasViolation = true;
    }
  }
}

const indexHtmlPath = path.join(process.cwd(), "dist", "index.html");
if (!fs.existsSync(indexHtmlPath)) {
  console.error("[bundle-budget] dist/index.html 파일을 찾지 못했습니다.");
  hasViolation = true;
} else {
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");
  const match = indexHtml.match(/src="\/assets\/(index-[^"]+\.js)"/);
  if (!match) {
    console.error("[bundle-budget] index.html에서 메인 index 번들 파일을 찾지 못했습니다.");
    hasViolation = true;
  } else {
    const entryFile = match[1];
    const entryPath = path.join(DIST_ASSETS_DIR, entryFile);
    if (!fs.existsSync(entryPath)) {
      console.error(`[bundle-budget] 메인 index 번들 파일이 없습니다: ${entryFile}`);
      hasViolation = true;
    } else {
      const entrySize = fs.statSync(entryPath).size;
      const pass = entrySize <= APP_INDEX_BUDGET_BYTES;
      console.log(
        `[bundle-budget] app index chunk: ${entryFile} (${formatKB(entrySize)}) / budget ${formatKB(APP_INDEX_BUDGET_BYTES)} -> ${pass ? "PASS" : "FAIL"}`,
      );
      if (!pass) {
        hasViolation = true;
      }
    }
  }
}

if (hasViolation) {
  process.exit(1);
}
