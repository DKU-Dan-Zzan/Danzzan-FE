// 역할: 탭 라우트 전환 시 스크롤 시작 위치 정책이 유지되는지 소스 레벨에서 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

function readSource(relativePath: string) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  return fs.readFileSync(absolutePath, "utf8");
}

describe("Scroll behavior policy", () => {
  it("App router는 경로 전환 시 스크롤을 상단으로 리셋하고 브라우저 자동 복원을 비활성화한다", () => {
    const source = readSource("src/App.tsx");

    expect(source).toContain('if ("scrollRestoration" in window.history) {');
    expect(source).toContain('window.history.scrollRestoration = "manual";');
    expect(source).toContain("window.scrollTo({ top: 0, left: 0, behavior: \"auto\" });");
  });

  it("Timetable은 진입 시 현재/다음 공연으로 자동 스크롤한다", () => {
    const source = readSource("src/routes/timetable/Timetable.tsx");

    expect(source).toContain("const [scrollTargetId, setScrollTargetId] = useState<number | null>(null)");
    expect(source).toContain("const didAutoScrollRef = useRef(false)");
    expect(source).toContain("const { scrollId } = findNowOrNextTarget(items, nowMinutes)");
    expect(source).toContain("requestAnimationFrame(() => setScrollTargetId(scrollId))");
    expect(source).toContain("scrollTargetId={scrollTargetId}");
  });
});
