#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DEFAULT_CONFIG_PATH = path.join(ROOT, "scripts", "color-lint.config.json");

const defaultConfig = {
  includeDirs: ["src"],
  extensions: [".ts", ".tsx"],
  excludeDirs: [
    "node_modules",
    "dist",
    ".next",
    "build",
    "coverage",
    ".turbo",
    "storybook-static",
  ],
  inlineAllowDirective: "color-allow:",
  tailwindColorPrefixes: ["bg", "text", "border", "ring", "from", "to", "via"],
  bannedTailwindColorScales: ["blue"],
  allowFiles: [],
};

const cliArgs = new Set(process.argv.slice(2));
const checkStagedOnly = cliArgs.has("--staged");

const config = loadConfig(DEFAULT_CONFIG_PATH);

const normalizedIncludeDirs = config.includeDirs.map(normalizePath);
const normalizedExcludeDirs = config.excludeDirs.map(normalizePath);
const allowedFileRules = normalizeAllowFileRules(config.allowFiles);
const allowedExtensions = new Set(config.extensions);

const tailwindPrefixPattern = config.tailwindColorPrefixes.map(escapeRegex).join("|");
const tailwindScalePattern = config.bannedTailwindColorScales.map(escapeRegex).join("|");

const patterns = [
  {
    code: "RAW_HEX",
    regex: /#[0-9a-fA-F]{3,8}\b/g,
    message: "raw hex color literal",
  },
  {
    code: "RAW_COLOR_FN",
    regex: /(?<![a-zA-Z])(?:rgba?|hsla?|color)\s*\(/gi,
    message: "raw color function literal",
  },
  {
    code: "TAILWIND_SCALE_COLOR",
    regex: new RegExp(
      `\\b(?:${tailwindPrefixPattern})-(?:${tailwindScalePattern})-(?:50|[1-9]00|950)(?:\\/[0-9]{1,3})?\\b`,
      "g",
    ),
    message: "tailwind fixed color-scale utility",
  },
];

const targetFiles = checkStagedOnly
  ? getStagedTargetFiles()
  : collectTargetFiles();

const violations = [];

for (const relFilePath of targetFiles) {
  if (isAllowedFile(relFilePath, allowedFileRules)) {
    continue;
  }

  const absolutePath = path.join(ROOT, relFilePath);
  if (!existsSync(absolutePath)) {
    continue;
  }

  const content = readFileSync(absolutePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.includes(config.inlineAllowDirective)) {
      continue;
    }

    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0;
      let match = pattern.regex.exec(line);
      while (match) {
        violations.push({
          file: relFilePath,
          line: index + 1,
          column: (match.index ?? 0) + 1,
          rule: pattern.code,
          message: pattern.message,
          token: match[0],
        });
        match = pattern.regex.exec(line);
      }
    }
  }
}

if (violations.length === 0) {
  console.log(
    `[color-lint] PASS (${targetFiles.length} files scanned${checkStagedOnly ? ", staged only" : ""})`,
  );
  process.exit(0);
}

const byFile = new Map();
for (const violation of violations) {
  byFile.set(violation.file, (byFile.get(violation.file) ?? 0) + 1);
}

const topFiles = [...byFile.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

console.error(`[color-lint] FAIL: ${violations.length} violations found in ${byFile.size} files`);
console.error("");

const maxPrintedViolations = 120;
for (const violation of violations.slice(0, maxPrintedViolations)) {
  console.error(
    `${violation.file}:${violation.line}:${violation.column} ` +
      `[${violation.rule}] ${violation.message} -> ${violation.token}`,
  );
}

if (violations.length > maxPrintedViolations) {
  console.error(`... (${violations.length - maxPrintedViolations} more not shown)`);
}

console.error("");
console.error("Top violating files:");
for (const [file, count] of topFiles) {
  console.error(`- ${file}: ${count}`);
}

console.error("");
console.error(
  `Bypass a specific line with inline directive: // ${config.inlineAllowDirective} reason`,
);
console.error(
  "Example: className=\"text-[#9f1239]\" // color-allow: 3rd-party chart palette requirement",
);
console.error(
  "For file-level exceptions, add an explicit entry in scripts/color-lint.config.json allowFiles.",
);

process.exit(1);

function loadConfig(configPath) {
  if (!existsSync(configPath)) {
    return structuredClone(defaultConfig);
  }

  const parsed = JSON.parse(readFileSync(configPath, "utf8"));
  return {
    ...defaultConfig,
    ...parsed,
    includeDirs: parsed.includeDirs ?? defaultConfig.includeDirs,
    extensions: parsed.extensions ?? defaultConfig.extensions,
    excludeDirs: parsed.excludeDirs ?? defaultConfig.excludeDirs,
    inlineAllowDirective:
      parsed.inlineAllowDirective ?? defaultConfig.inlineAllowDirective,
    tailwindColorPrefixes:
      parsed.tailwindColorPrefixes ?? defaultConfig.tailwindColorPrefixes,
    bannedTailwindColorScales:
      parsed.bannedTailwindColorScales ?? defaultConfig.bannedTailwindColorScales,
    allowFiles: parsed.allowFiles ?? defaultConfig.allowFiles,
  };
}

function normalizeAllowFileRules(allowFiles) {
  return allowFiles.map((entry) => {
    if (typeof entry === "string") {
      return { pattern: normalizePath(entry), reason: "" };
    }

    return {
      pattern: normalizePath(entry.path),
      reason: entry.reason ?? "",
    };
  });
}

function getStagedTargetFiles() {
  let output = "";
  try {
    output = execSync("git diff --cached --name-only --diff-filter=ACMR", {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    });
  } catch {
    return [];
  }

  return output
    .split(/\r?\n/)
    .map((item) => normalizePath(item.trim()))
    .filter(Boolean)
    .filter(isTargetFile);
}

function collectTargetFiles() {
  const files = [];
  for (const includeDir of normalizedIncludeDirs) {
    const absoluteIncludeDir = path.join(ROOT, includeDir);
    walk(absoluteIncludeDir, includeDir, files);
  }
  return files.sort();
}

function walk(absoluteDir, relativeDir, outputFiles) {
  if (!existsSync(absoluteDir)) {
    return;
  }

  const entries = readdirSync(absoluteDir, { withFileTypes: true });
  for (const entry of entries) {
    const absPath = path.join(absoluteDir, entry.name);
    const relPath = normalizePath(path.join(relativeDir, entry.name));

    if (entry.isDirectory()) {
      if (isExcluded(relPath)) {
        continue;
      }
      walk(absPath, relPath, outputFiles);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (isTargetFile(relPath)) {
      outputFiles.push(relPath);
    }
  }
}

function isTargetFile(relPath) {
  const normalized = normalizePath(relPath);

  if (isExcluded(normalized)) {
    return false;
  }

  const extension = path.extname(normalized);
  if (!allowedExtensions.has(extension)) {
    return false;
  }

  return normalizedIncludeDirs.some(
    (dir) => normalized === dir || normalized.startsWith(`${dir}/`),
  );
}

function isExcluded(relPath) {
  const normalized = normalizePath(relPath);
  return normalizedExcludeDirs.some(
    (dir) => normalized === dir || normalized.startsWith(`${dir}/`),
  );
}

function isAllowedFile(relPath, rules) {
  const normalized = normalizePath(relPath);
  return rules.some(({ pattern }) => matchesPattern(normalized, pattern));
}

function matchesPattern(filePath, pattern) {
  if (!pattern.includes("*")) {
    return filePath === pattern;
  }

  const expression = `^${escapeRegex(pattern)
    .replace(/\\\*\\\*/g, ".*")
    .replace(/\\\*/g, "[^/]*")}$`;
  return new RegExp(expression).test(filePath);
}

function normalizePath(value) {
  return value.split(path.sep).join("/").replace(/^\.\/+/, "");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
