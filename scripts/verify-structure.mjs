#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

const RULE_IDS = [
  "DIR_KEBAB_CASE",
  "FILE_COMPONENT_PASCAL_CASE",
  "LAYER_API_NO_HOOKS_IMPORT",
  "LAYER_NON_TICKETING_NO_TICKETING_IMPORT",
  "LAYER_COMPONENTS_NO_ROUTES_IMPORT",
  "LAYER_HOOKS_NO_ROUTES_IMPORT",
  "LAYER_LIB_NO_ROUTES_IMPORT",
  "LAYER_TYPES_NO_RUNTIME_IMPORT",
  "STYLE_NO_NEW_GLOBAL_SELECTOR",
  "STYLE_NO_NEW_RAW_HEX",
  "LEGACY_IMPORT_FORBIDDEN",
]

const DEFAULT_ALLOWLIST_PATH = "config/structure-allowlist.json"
const CODE_FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"])
const STYLE_SCAN_EXTENSIONS = new Set([".css", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"])

function parseArgs(argv) {
  const options = {
    mode: "report",
    json: false,
    changedFiles: [],
    allowlistPath: DEFAULT_ALLOWLIST_PATH,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--json") {
      options.json = true
      continue
    }

    if (!arg.startsWith("--")) {
      continue
    }

    const [key, inlineValue] = arg.includes("=") ? arg.split(/=(.*)/s) : [arg, null]
    const nextValue = inlineValue ?? argv[i + 1]
    const consumesNext = inlineValue == null

    if (key === "--mode") {
      options.mode = nextValue
      if (consumesNext) i += 1
      continue
    }

    if (key === "--changed-files") {
      const raw = nextValue ?? ""
      options.changedFiles = raw
        .split(",")
        .map((file) => normalizePath(file.trim()))
        .filter(Boolean)
      if (consumesNext) i += 1
      continue
    }

    if (key === "--allowlist") {
      options.allowlistPath = nextValue || DEFAULT_ALLOWLIST_PATH
      if (consumesNext) i += 1
      continue
    }
  }

  if (!["report", "changed", "strict"].includes(options.mode)) {
    throw new Error(`Invalid --mode: ${options.mode}`)
  }

  return options
}

function normalizePath(inputPath) {
  return inputPath.replaceAll("\\", "/")
}

function toProjectRelative(inputPath) {
  const absolute = path.isAbsolute(inputPath) ? inputPath : path.join(process.cwd(), inputPath)
  return normalizePath(path.relative(process.cwd(), absolute))
}

function pathExists(relativePath) {
  return fs.existsSync(path.join(process.cwd(), relativePath))
}

function isInsideDir(relativePath, dirPrefix) {
  return relativePath === dirPrefix || relativePath.startsWith(`${dirPrefix}/`)
}

function runCommand(command) {
  return execSync(command, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim()
}

function safeRunCommand(command) {
  try {
    return runCommand(command)
  } catch {
    return ""
  }
}

function quoteForShell(text) {
  return `'${text.replaceAll("'", "'\\''")}'`
}

function resolveGitRange() {
  const explicitRange = process.env.STRUCTURE_GIT_RANGE
  if (explicitRange) return explicitRange

  const explicitBase = process.env.STRUCTURE_BASE_REF
  if (explicitBase) return `${explicitBase}...HEAD`

  const githubBaseRef = process.env.GITHUB_BASE_REF
  if (githubBaseRef) return `origin/${githubBaseRef}...HEAD`

  return "HEAD~1...HEAD"
}

function deriveChangedFilesFromGit() {
  // Prefer local working tree delta first (developer workflow).
  let output = safeRunCommand("git diff --name-only --diff-filter=ACMR HEAD")
  if (!output) {
    output = safeRunCommand("git diff --name-only --diff-filter=ACMR")
  }

  // Fallback to branch-range delta (CI / PR workflow).
  if (!output) {
    const range = resolveGitRange()
    output = safeRunCommand(`git diff --name-only --diff-filter=ACMR ${quoteForShell(range)}`)
  }

  const trackedChanged = output
    .split("\n")
    .map((line) => normalizePath(line.trim()))
    .filter(Boolean)
    .filter((file) => pathExists(file))

  const untracked = safeRunCommand("git ls-files --others --exclude-standard")
    .split("\n")
    .map((line) => normalizePath(line.trim()))
    .filter(Boolean)
    .filter((file) => pathExists(file))

  return [...new Set([...trackedChanged, ...untracked])].sort()
}

function collectFilesRecursive(relativeDir) {
  const absoluteDir = path.join(process.cwd(), relativeDir)
  if (!fs.existsSync(absoluteDir)) return []

  const files = []
  const stack = [absoluteDir]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue

    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(absolutePath)
        continue
      }
      if (!entry.isFile()) continue
      files.push(toProjectRelative(absolutePath))
    }
  }

  return files.sort()
}

function collectDirsRecursive(relativeDir) {
  const absoluteDir = path.join(process.cwd(), relativeDir)
  if (!fs.existsSync(absoluteDir)) return []

  const dirs = []
  const stack = [absoluteDir]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue

    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const absolutePath = path.join(current, entry.name)
      const relativePath = toProjectRelative(absolutePath)
      dirs.push(relativePath)
      stack.push(absolutePath)
    }
  }

  return dirs.sort()
}

function parseAllowlist(allowlistPath) {
  const absolute = path.join(process.cwd(), allowlistPath)
  if (!fs.existsSync(absolute)) {
    return { entries: [], expiredEntries: [] }
  }

  const raw = fs.readFileSync(absolute, "utf8")
  const parsed = JSON.parse(raw)
  const entries = Array.isArray(parsed) ? parsed : Array.isArray(parsed.entries) ? parsed.entries : []

  const today = new Date().toISOString().slice(0, 10)
  const validEntries = []
  const expiredEntries = []

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue

    const candidate = {
      ruleId: String(entry.ruleId || "").trim(),
      target: String(entry.target || "").trim(),
      reason: String(entry.reason || "").trim(),
      owner: String(entry.owner || "").trim(),
      expiresAt: String(entry.expiresAt || "").trim(),
    }

    if (!candidate.ruleId || !candidate.target || !candidate.expiresAt) continue

    if (candidate.expiresAt < today) {
      expiredEntries.push(candidate)
      continue
    }

    validEntries.push(candidate)
  }

  return { entries: validEntries, expiredEntries }
}

function wildcardToRegex(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "::DOUBLE_STAR::")
    .replace(/\*/g, "::SINGLE_STAR::")

  return new RegExp(
    `^${escaped
      .replace(/::DOUBLE_STAR::/g, ".*")
      .replace(/::SINGLE_STAR::/g, ".*")}$`
  )
}

function createAllowlistMatcher(allowlistEntries) {
  const compiled = allowlistEntries.map((entry) => ({
    ...entry,
    regex: wildcardToRegex(entry.target),
  }))

  return function isAllowed(ruleId, context = {}) {
    const candidates = compiled.filter((entry) => entry.ruleId === ruleId)
    if (candidates.length === 0) return false

    for (const candidate of candidates) {
      if (context.selector && candidate.target.startsWith(".")) {
        if (candidate.regex.test(context.selector)) return true
        continue
      }

      if (context.value && candidate.target.startsWith("#")) {
        if (candidate.regex.test(context.value)) return true
        continue
      }

      if (context.file) {
        if (candidate.regex.test(context.file)) return true
      }
    }

    return false
  }
}

function readFileLines(relativeFile) {
  const absolute = path.join(process.cwd(), relativeFile)
  const content = fs.readFileSync(absolute, "utf8")
  return content.split(/\r?\n/)
}

function getChangedAddedLines(changedFiles) {
  const map = new Map()
  if (changedFiles.length === 0) return map

  const existing = changedFiles.filter((file) => pathExists(file))
  if (existing.length === 0) return map

  const filesArg = existing.map((file) => quoteForShell(file)).join(" ")
  // Prefer local working tree delta first (developer workflow).
  const worktreeDiffCommand = `git diff --unified=0 --no-color HEAD -- ${filesArg}`

  let diffOutput = safeRunCommand(worktreeDiffCommand)
  if (!diffOutput) {
    const plainWorktreeDiffCommand = `git diff --unified=0 --no-color -- ${filesArg}`
    diffOutput = safeRunCommand(plainWorktreeDiffCommand)
  }

  // Fallback to branch-range delta (CI / PR workflow).
  if (!diffOutput) {
    const range = resolveGitRange()
    const rangeDiffCommand = `git diff --unified=0 --no-color ${quoteForShell(range)} -- ${filesArg}`
    diffOutput = safeRunCommand(rangeDiffCommand)
  }

  if (!diffOutput) return map

  let currentFile = null
  let currentNewLine = 0

  const lines = diffOutput.split(/\r?\n/)
  for (const rawLine of lines) {
    if (rawLine.startsWith("+++ b/")) {
      currentFile = normalizePath(rawLine.slice("+++ b/".length).trim())
      continue
    }

    if (rawLine.startsWith("@@")) {
      const match = rawLine.match(/\+([0-9]+)(?:,([0-9]+))?/)
      currentNewLine = match ? Number(match[1]) : 0
      continue
    }

    if (!currentFile) continue

    if (rawLine.startsWith("+") && !rawLine.startsWith("+++")) {
      const text = rawLine.slice(1)
      const list = map.get(currentFile) ?? []
      list.push({ line: currentNewLine, text })
      map.set(currentFile, list)
      currentNewLine += 1
      continue
    }

    if (rawLine.startsWith(" ")) {
      currentNewLine += 1
      continue
    }

    if (rawLine.startsWith("-")) {
      continue
    }
  }

  return map
}

function createCollector(isAllowed) {
  const violations = []

  function add(ruleId, file, line, message, context = {}) {
    const normalizedFile = file ? normalizePath(file) : ""
    const normalizedLine = Number.isFinite(line) ? Number(line) : 0

    if (isAllowed(ruleId, { ...context, file: normalizedFile })) return

    violations.push({
      ruleId,
      file: normalizedFile,
      line: normalizedLine,
      message,
    })
  }

  return { add, violations }
}

function selectFiles(allFiles, changedFiles, mode, predicate) {
  if (mode === "changed") {
    return changedFiles.filter((file) => predicate(file) && pathExists(file)).sort()
  }
  return allFiles.filter(predicate).sort()
}

function run() {
  const options = parseArgs(process.argv.slice(2))
  const allowlist = parseAllowlist(options.allowlistPath)
  const isAllowed = createAllowlistMatcher(allowlist.entries)
  const collector = createCollector(isAllowed)

  const allFiles = collectFilesRecursive("src")
  const changedFiles = options.mode === "changed"
    ? (options.changedFiles.length > 0 ? options.changedFiles.filter(pathExists) : deriveChangedFilesFromGit())
    : []
  const changedAddedLines = options.mode === "changed" ? getChangedAddedLines(changedFiles) : new Map()

  const allDirs = collectDirsRecursive("src")

  // DIR_KEBAB_CASE
  {
    let dirsToCheck = allDirs
    if (options.mode === "changed") {
      const set = new Set()
      for (const file of changedFiles) {
        if (!isInsideDir(file, "src")) continue
        const segments = normalizePath(path.dirname(file)).split("/")
        let accum = ""
        for (const segment of segments) {
          if (!segment || segment === ".") continue
          accum = accum ? `${accum}/${segment}` : segment
          if (accum !== "src") set.add(accum)
        }
      }
      dirsToCheck = [...set]
    }

    for (const dir of dirsToCheck) {
      const name = path.posix.basename(dir)
      if (/^__.*__$/.test(name)) continue
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
        collector.add("DIR_KEBAB_CASE", dir, 1, `Directory name must be kebab-case: ${name}`)
      }
    }
  }

  // FILE_COMPONENT_PASCAL_CASE
  {
    const componentFiles = selectFiles(
      allFiles,
      changedFiles,
      options.mode,
      (file) => isInsideDir(file, "src/components") && [".ts", ".tsx"].includes(path.extname(file))
    )

    const fileNameAllowlist = new Set(["index", "types", "utils", "constants"])

    for (const file of componentFiles) {
      const parsed = path.parse(file)
      const baseName = parsed.name
      const isPascal = /^[A-Z][A-Za-z0-9]*$/.test(baseName)
      const isUtilityName = fileNameAllowlist.has(baseName)
      const isTestFile =
        file.includes("/__tests__/") ||
        /\.(test|spec)$/.test(baseName)

      if (!isPascal && !isUtilityName && !isTestFile) {
        collector.add(
          "FILE_COMPONENT_PASCAL_CASE",
          file,
          1,
          `Component file name should be PascalCase: ${path.basename(file)}`,
          { file }
        )
      }
    }
  }

  // LAYER_COMPONENTS_NO_ROUTES_IMPORT
  {
    const files = selectFiles(
      allFiles,
      changedFiles,
      options.mode,
      (file) => isInsideDir(file, "src/components") && CODE_FILE_EXTENSIONS.has(path.extname(file))
    )

    const patterns = [
      /from\s+["']@\/routes\//,
      /from\s+["'][^"']*\/routes\/[^"']*["']/, 
      /import\(\s*["']@\/routes\//,
      /import\(\s*["'][^"']*\/routes\/[^"']*["']/,
    ]

    for (const file of files) {
      const lines = readFileLines(file)
      lines.forEach((lineText, index) => {
        if (patterns.some((pattern) => pattern.test(lineText))) {
          collector.add(
            "LAYER_COMPONENTS_NO_ROUTES_IMPORT",
            file,
            index + 1,
            "components layer must not import routes layer",
            { file }
          )
        }
      })
    }
  }

  // LAYER_NON_TICKETING_NO_TICKETING_IMPORT
  {
    const files = selectFiles(
      allFiles,
      changedFiles,
      options.mode,
      (file) =>
        isInsideDir(file, "src") &&
        CODE_FILE_EXTENSIONS.has(path.extname(file)) &&
        !file.includes("/ticketing/")
    )

    const patterns = [
      /from\s+["']@\/(api|store|types|lib|utils)\/ticketing\//,
      /import\(\s*["']@\/(api|store|types|lib|utils)\/ticketing\//,
    ]

    for (const file of files) {
      const lines = readFileLines(file)
      lines.forEach((lineText, index) => {
        if (patterns.some((pattern) => pattern.test(lineText))) {
          collector.add(
            "LAYER_NON_TICKETING_NO_TICKETING_IMPORT",
            file,
            index + 1,
            "non-ticketing layer must not import ticketing namespace directly",
            { file }
          )
        }
      })
    }
  }

  // LAYER_API_NO_HOOKS_IMPORT
  {
    const files = selectFiles(
      allFiles,
      changedFiles,
      options.mode,
      (file) => isInsideDir(file, "src/api") && CODE_FILE_EXTENSIONS.has(path.extname(file))
    )

    const patterns = [
      /from\s+["']@\/hooks\//,
      /from\s+["'][^"']*\/hooks\/[^"']*["']/,
      /import\(\s*["']@\/hooks\//,
      /import\(\s*["'][^"']*\/hooks\/[^"']*["']/,
    ]

    for (const file of files) {
      const lines = readFileLines(file)
      lines.forEach((lineText, index) => {
        if (patterns.some((pattern) => pattern.test(lineText))) {
          collector.add(
            "LAYER_API_NO_HOOKS_IMPORT",
            file,
            index + 1,
            "api layer must not import hooks layer",
            { file }
          )
        }
      })
    }
  }

  // LAYER_HOOKS_NO_ROUTES_IMPORT
  {
    const files = selectFiles(
      allFiles,
      changedFiles,
      options.mode,
      (file) => isInsideDir(file, "src/hooks") && CODE_FILE_EXTENSIONS.has(path.extname(file))
    )

    const patterns = [
      /from\s+["']@\/routes\//,
      /from\s+["'][^"']*\/routes\/[^"']*["']/, 
      /import\(\s*["']@\/routes\//,
      /import\(\s*["'][^"']*\/routes\/[^"']*["']/,
    ]

    for (const file of files) {
      const lines = readFileLines(file)
      lines.forEach((lineText, index) => {
        if (patterns.some((pattern) => pattern.test(lineText))) {
          collector.add(
            "LAYER_HOOKS_NO_ROUTES_IMPORT",
            file,
            index + 1,
            "hooks layer must not import routes layer",
            { file }
          )
        }
      })
    }
  }

  // LAYER_LIB_NO_ROUTES_IMPORT
  {
    const files = selectFiles(
      allFiles,
      changedFiles,
      options.mode,
      (file) => isInsideDir(file, "src/lib") && CODE_FILE_EXTENSIONS.has(path.extname(file))
    )

    const patterns = [
      /from\s+["']@\/routes\//,
      /from\s+["'][^"']*\/routes\/[^"']*["']/,
      /import\(\s*["']@\/routes\//,
      /import\(\s*["'][^"']*\/routes\/[^"']*["']/,
    ]

    for (const file of files) {
      const lines = readFileLines(file)
      lines.forEach((lineText, index) => {
        if (patterns.some((pattern) => pattern.test(lineText))) {
          collector.add(
            "LAYER_LIB_NO_ROUTES_IMPORT",
            file,
            index + 1,
            "lib layer must not import routes layer",
            { file }
          )
        }
      })
    }
  }

  // LAYER_TYPES_NO_RUNTIME_IMPORT
  {
    const files = selectFiles(
      allFiles,
      changedFiles,
      options.mode,
      (file) => isInsideDir(file, "src/types") && CODE_FILE_EXTENSIONS.has(path.extname(file))
    )

    const patterns = [
      /from\s+["']@\/(api|hooks|routes|components)(?:\/|["'])/,
      /import\(\s*["']@\/(api|hooks|routes|components)(?:\/|["'])/,
      /from\s+["'][^"']*\/(api|hooks|routes|components)\/[^"']*["']/, 
      /import\(\s*["'][^"']*\/(api|hooks|routes|components)\/[^"']*["']/,
    ]

    for (const file of files) {
      const lines = readFileLines(file)
      lines.forEach((lineText, index) => {
        if (patterns.some((pattern) => pattern.test(lineText))) {
          collector.add(
            "LAYER_TYPES_NO_RUNTIME_IMPORT",
            file,
            index + 1,
            "types layer must not import runtime layers(api/hooks/routes/components)",
            { file }
          )
        }
      })
    }
  }

  // LEGACY_IMPORT_FORBIDDEN
  {
    const files = selectFiles(
      allFiles,
      changedFiles,
      options.mode,
      (file) => isInsideDir(file, "src") && CODE_FILE_EXTENSIONS.has(path.extname(file))
    )

    const patterns = [
      "@/components/ticketing/common/ui/",
      "@/components/ticketing/ticketing/",
      "@/components/ticketing/common/figma/",
    ]

    for (const file of files) {
      const lines = readFileLines(file)
      lines.forEach((lineText, index) => {
        const matched = patterns.find((pattern) => lineText.includes(pattern))
        if (matched) {
          collector.add(
            "LEGACY_IMPORT_FORBIDDEN",
            file,
            index + 1,
            `legacy import path is forbidden: ${matched}`,
            { file }
          )
        }
      })
    }
  }

  // STYLE_NO_NEW_GLOBAL_SELECTOR
  {
    const targetFile = "src/index.css"
    const classPattern = /^\s*\.([a-zA-Z0-9_-]+)/

    const collectFromLineObjects = (lineObjects) => {
      for (const item of lineObjects) {
        const match = item.text.match(classPattern)
        if (!match) continue

        const selector = `.${match[1]}`
        collector.add(
          "STYLE_NO_NEW_GLOBAL_SELECTOR",
          targetFile,
          item.line,
          `global selector must be allowlisted: ${selector}`,
          { selector, file: targetFile }
        )
      }
    }

    if (options.mode === "changed") {
      if (changedFiles.includes(targetFile)) {
        const added = changedAddedLines.get(targetFile) ?? []
        collectFromLineObjects(added)
      }
    } else if (pathExists(targetFile)) {
      const lines = readFileLines(targetFile)
      const lineObjects = lines.map((text, idx) => ({ line: idx + 1, text }))
      collectFromLineObjects(lineObjects)
    }
  }

  // STYLE_NO_NEW_RAW_HEX
  {
    const scopedFiles = selectFiles(
      allFiles,
      changedFiles,
      options.mode,
      (file) => {
        if (!STYLE_SCAN_EXTENSIONS.has(path.extname(file))) return false
        return (
          file === "src/index.css" ||
          isInsideDir(file, "src/routes") ||
          isInsideDir(file, "src/components")
        )
      }
    )

    const hexPattern = /#[0-9a-fA-F]{3,8}\b/g

    for (const file of scopedFiles) {
      const lineObjects = options.mode === "changed"
        ? (changedAddedLines.get(file) ?? [])
        : readFileLines(file).map((text, idx) => ({ line: idx + 1, text }))

      for (const item of lineObjects) {
        const matches = item.text.match(hexPattern)
        if (!matches) continue

        for (const value of matches) {
          collector.add(
            "STYLE_NO_NEW_RAW_HEX",
            file,
            item.line,
            `raw hex color is forbidden: ${value}`,
            { value, file }
          )
        }
      }
    }
  }

  const summary = Object.fromEntries(RULE_IDS.map((ruleId) => [ruleId, 0]))
  for (const violation of collector.violations) {
    summary[violation.ruleId] = (summary[violation.ruleId] ?? 0) + 1
  }

  const result = {
    mode: options.mode,
    allowlistPath: options.allowlistPath,
    changedFiles,
    expiredAllowlistEntries: allowlist.expiredEntries,
    summary,
    totalViolations: collector.violations.length,
    violations: collector.violations,
  }

  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  } else {
    process.stdout.write(`[verify-structure] mode=${options.mode}\n`)
    process.stdout.write(`[verify-structure] allowlist=${options.allowlistPath}\n`)

    if (options.mode === "changed") {
      process.stdout.write(`[verify-structure] changed-files=${changedFiles.length}\n`)
      if (changedFiles.length > 0) {
        for (const file of changedFiles) {
          process.stdout.write(`  - ${file}\n`)
        }
      }
    }

    if (allowlist.expiredEntries.length > 0) {
      process.stdout.write("[verify-structure] expired allowlist entries\n")
      for (const entry of allowlist.expiredEntries) {
        process.stdout.write(`  - ${entry.ruleId} :: ${entry.target} (expired: ${entry.expiresAt})\n`)
      }
    }

    process.stdout.write("\n[verify-structure] rule summary\n")
    for (const ruleId of RULE_IDS) {
      process.stdout.write(`- ${ruleId}: ${summary[ruleId] ?? 0}\n`)
    }

    if (collector.violations.length > 0) {
      process.stdout.write("\n[verify-structure] violations\n")
      for (const violation of collector.violations) {
        const location = violation.line > 0 ? `${violation.file}:${violation.line}` : violation.file
        process.stdout.write(`- [${violation.ruleId}] ${location} :: ${violation.message}\n`)
      }
    }
  }

  const hasViolations = collector.violations.length > 0
  if (hasViolations) {
    process.exit(1)
  }
}

try {
  run()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`[verify-structure] fatal: ${message}\n`)
  process.exit(2)
}
