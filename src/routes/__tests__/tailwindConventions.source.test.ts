// 역할: 라우트와 페이지의 Tailwind 규칙 위반 패턴이 유입되지 않는지 테스트합니다.
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
  it("Notice 검색 입력은 focus-visible 스타일을 포함한다", () => {
    const source = readSource("src/routes/notice/Notice.tsx");
    const inputTagSource = extractInputTagByPlaceholder(source, "공지 제목 또는 내용을 검색해 보세요");

    expect(inputTagSource).toContain("focus-visible:outline-none");
    expect(inputTagSource).toContain("focus-visible:ring-2");
    expect(inputTagSource).toContain("focus-visible:ring-[var(--ring)]");
  });

  it("Admin 공지 검색 입력은 focus-visible 스타일을 포함한다", () => {
    const adminSource = readSource("src/routes/admin/Admin.tsx");
    const adminStyleSource = readSource("src/routes/admin/adminStyleClasses.ts");
    const inputTagSource = extractInputTagByPlaceholder(adminSource, "제목으로 검색");

    expect(inputTagSource).toContain("ADMIN_FOCUS_VISIBLE_RING_CLASS");
    expect(adminStyleSource).toContain("focus-visible:outline-none");
    expect(adminStyleSource).toContain("focus-visible:ring-2");
    expect(adminStyleSource).toContain("focus-visible:ring-[var(--ring)]");
  });

  it("PrimaryFilterChips는 배열 join 대신 cn 유틸리티로 클래스를 합성한다", () => {
    const source = readSource("src/components/app/boothmap/PrimaryFilterChips.tsx");

    expect(source).toContain("cn(");
    expect(source).not.toContain(".join(\" \")");
    expect(source).toContain("px-3 py-2 text-sm");
    expect(source).toContain("gap-1.5");
  });

  it("SecondaryCollegeChips는 축소된 칩 간격/패딩을 유지한다", () => {
    const source = readSource("src/components/app/boothmap/SecondaryCollegeChips.tsx");

    expect(source).toContain("px-3 py-2 text-sm");
    expect(source).toContain("flex gap-1.5");
  });

  it("TicketingApp 루트 클래스는 join 대신 cn 합성을 사용한다", () => {
    const source = readSource("src/routes/ticketing/TicketingApp.tsx");

    expect(source).toContain("const TICKETING_ROOT_CLASS_NAME = cn(");
    expect(source).not.toContain("].join(\" \")");
  });

  it("BoothMap은 3D 참조 없이 KakaoMapView를 렌더링한다", () => {
    const source = readSource("src/routes/boothmap/BoothMap.tsx");

    expect(source).toContain("<KakaoMapView");
    expect(source).not.toContain("MapFloatingToggle");
    expect(source).not.toContain("Mapbox3DView");
    expect(source).not.toContain("requestIdleCallback");
    expect(source).toContain("px-3 py-2");
  });
});
