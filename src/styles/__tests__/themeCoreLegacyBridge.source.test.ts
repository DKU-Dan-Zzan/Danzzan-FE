import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync(path.resolve(__dirname, "../../index.css"), "utf8");

describe("Theme Core legacy bridge", () => {
  it("Theme Core 브랜드 값은 root에서 한 번만 정의한다", () => {
    for (const token of ["primary", "secondary", "accent", "text-emphasis"]) {
      expect(css.match(new RegExp(`--theme-brand-${token}:`, "g"))).toHaveLength(1);
    }
  });

  it("numeric brand 팔레트는 고정 원색이 아닌 semantic/DS compatibility alias다", () => {
    const aliases = [...css.matchAll(/^\s*--brand-\d+[a-z]?:\s*([^;]+);/gm)];
    expect(aliases.length).toBeGreaterThan(0);
    for (const [, value] of aliases) {
      expect(value).toMatch(/var\(--(?:semantic-|ds-)/);
      expect(value).not.toMatch(/#[\da-f]{3,8}\b/i);
    }
    expect(css).not.toMatch(/var\(--brand-[\w-]+\)/);
  });
});
