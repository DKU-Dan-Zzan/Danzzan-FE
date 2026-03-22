import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const INDEX_CSS_PATH = path.resolve(__dirname, "../../index.css");

describe("index.css global selectors", () => {
  it("허용된 전역 클래스 셀렉터만 유지한다", () => {
    const content = fs.readFileSync(INDEX_CSS_PATH, "utf8");
    const selectors = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("."))
      .map((line) => line.replace(/\s*\{.*$/, ""));

    expect(selectors).toEqual([
      ".font-cute",
      ".scrollbar-hide",
      ".scrollbar-hide::-webkit-scrollbar",
    ]);
  });
});
