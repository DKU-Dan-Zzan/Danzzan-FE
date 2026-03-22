import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

function readSource(relativePath: string) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  return fs.readFileSync(absolutePath, "utf8");
}

function extractInputTagByPlaceholder(source: string, placeholder: string) {
  const placeholderToken = `placeholder="${placeholder}"`;
  const placeholderIndex = source.indexOf(placeholderToken);
  if (placeholderIndex < 0) {
    throw new Error(`placeholder not found: ${placeholder}`);
  }

  const inputStartIndex = source.lastIndexOf("<input", placeholderIndex);
  const inputEndIndex = source.indexOf("/>", placeholderIndex);
  if (inputStartIndex < 0 || inputEndIndex < 0) {
    throw new Error(`input tag range not found for placeholder: ${placeholder}`);
  }

  return source.slice(inputStartIndex, inputEndIndex);
}

describe("Tailwind source conventions", () => {
  it("Notice 검색 입력은 focus-visible 포커스 링을 포함한다", () => {
    const source = readSource("src/routes/notice/Notice.tsx");
    const inputTagSource = extractInputTagByPlaceholder(source, "공지 제목 또는 내용을 검색해 보세요");

    expect(inputTagSource).toContain("focus-visible:outline-none");
    expect(inputTagSource).toContain("focus-visible:ring-2");
    expect(inputTagSource).toContain("focus-visible:ring-[var(--ring)]");
  });

  it("Admin 공지 검색 입력은 focus-visible 포커스 링을 포함한다", () => {
    const adminSource = readSource("src/routes/admin/Admin.tsx");
    const adminStyleSource = readSource("src/routes/admin/adminStyleClasses.ts");
    const inputTagSource = extractInputTagByPlaceholder(adminSource, "제목으로 검색");

    expect(inputTagSource).toContain("ADMIN_FOCUS_VISIBLE_RING_CLASS");
    expect(adminStyleSource).toContain("focus-visible:outline-none");
    expect(adminStyleSource).toContain("focus-visible:ring-2");
    expect(adminStyleSource).toContain("focus-visible:ring-[var(--ring)]");
  });

  it("Mapbox3DView는 min-height/min-width 인라인 스타일을 사용하지 않는다", () => {
    const source = readSource("src/components/app/boothmap/Mapbox3DView.tsx");

    expect(source).not.toContain("style={{ minHeight: 0, minWidth: 0 }}");
    expect(source).toContain("min-h-0");
    expect(source).toContain("min-w-0");
  });

  it("PrimaryFilterChips는 배열 join 대신 cn 유틸리티로 클래스를 합성한다", () => {
    const source = readSource("src/components/app/boothmap/PrimaryFilterChips.tsx");

    expect(source).toContain("cn(");
    expect(source).not.toContain(".join(\" \")");
  });

  it("TicketingApp 루트 클래스는 join 대신 cn 합성을 사용한다", () => {
    const source = readSource("src/routes/ticketing/TicketingApp.tsx");

    expect(source).toContain("const TICKETING_ROOT_CLASS_NAME = cn(");
    expect(source).not.toContain("].join(\" \")");
  });
});
