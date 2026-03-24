// 역할: 라우트 레이어에서 Tailwind 규칙 위반 패턴이 재유입되지 않는지 소스 스캔으로 검증합니다.
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

  it("Map 2D/3D 토글은 가독성을 위한 대비/크기/포커스 스타일을 포함한다", () => {
    const source = readSource("src/components/app/boothmap/MapFloatingToggle.tsx");

    expect(source).toContain("relative inline-flex");
    expect(source).toContain("absolute left-0.5 top-0.5 h-8 w-12");
    expect(source).toContain("translate-x-12");
    expect(source).toContain("duration-300");
    expect(source).toContain("bg-[var(--boothmap-surface)]");
    expect(source).toContain("border-[var(--boothmap-border)]");
    expect(source).toContain("bg-[var(--boothmap-accent-soft)]");
    expect(source).toContain("text-[var(--boothmap-accent-text)]");
    expect(source).toContain("bg-[var(--boothmap-surface-muted)] text-[var(--boothmap-text)]");
    expect(source).toContain("h-8 w-12");
    expect(source).toContain("text-xs font-semibold");
    expect(source).toContain("focus-visible:ring-2");
    expect(source).toContain("focus-visible:ring-[var(--ring)]");
    expect(source).not.toContain("bg-[var(--boothmap-toggle-active-bg)]");
  });

  it("BoothMap 모드 전환은 지도 레이어 크로스페이드 애니메이션을 사용한다", () => {
    const source = readSource("src/routes/boothmap/BoothMap.tsx");

    expect(source).toContain("const MAP_MODE_TRANSITION_MS = 280;");
    expect(source).toContain("const MAPBOX_WARMUP_FALLBACK_DELAY_MS = 900;");
    expect(source).toContain("const MAPBOX_WARMUP_IDLE_TIMEOUT_MS = 1800;");
    expect(source).toContain("const warmupMapbox3DAssets = async () => {");
    expect(source).toContain("if (typeof window.requestIdleCallback === \"function\")");
    expect(source).toContain("window.requestIdleCallback(");
    expect(source).toContain("window.setTimeout(() => {");
    expect(source).toContain("transition-all duration-300 ease-out");
    expect(source).toContain("opacity-100 translate-x-0 scale-100");
    expect(source).toContain("opacity-0 -translate-x-1 scale-[0.985]");
    expect(source).toContain("opacity-0 translate-x-1 scale-[0.985]");
    expect(source).toContain("px-3 py-2");
  });
});
