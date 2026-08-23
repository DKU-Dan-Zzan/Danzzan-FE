// 역할: 앱 공통 404 화면의 라우트 연결과 축제 앱 톤이 유지되는지 소스 회귀를 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

function readSource(relativePath: string) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  return fs.readFileSync(absolutePath, "utf8");
}

describe("Common not-found route", () => {
  it("App router exposes the shared not-found page as an app-wide catch-all", () => {
    const source = readSource("src/App.tsx");

    expect(source).toContain('const NotFoundPage = lazy(() => import("./routes/not-found/NotFoundPage"));');
    expect(source).toContain('<Route path="*" element={withRouteSuspense(<NotFoundPage />)} />');
  });

  it("Ticketing unknown routes reuse the same common not-found page", () => {
    const source = readSource("src/routes/ticketing/not-found/NotFoundPage.tsx");

    expect(source).toContain('export { default } from "@/routes/not-found/NotFoundPage";');
  });

  it("The shared page keeps a concise branded 404 tone and only the home recovery action", () => {
    const source = readSource("src/routes/not-found/NotFoundPage.tsx");
    const koDictionarySource = readSource("src/i18n/locales/ko.ts");

    // 문구 자체는 사전으로 옮겨졌다. 화면은 키를 통해 조회한다.
    expect(source).toContain('t("notFound.title")');
    expect(source).toContain('t("notFound.description")');
    expect(source).toContain('t("common.home")');
    expect(koDictionarySource).toContain("페이지를 찾을 수 없어요");
    expect(koDictionarySource).toContain("주소가 바뀌었거나 접근할 수 없는 페이지예요.");
    expect(source).toContain('aria-labelledby="not-found-title"');
    expect(source).toContain('id="not-found-title"');
    expect(source).toContain('to="/"');
    expect(source).toContain('src="/DAN-ZZAN.png"');

    expect(source).toContain("var(--brand-main)");
    expect(source).toContain("var(--text-emphasis-vivid-strong)");

    // 복구 액션은 홈 이동 1개만 유지한다.
    expect(source).not.toContain('to: "/map"');
    expect(source).not.toContain('to: "/ticket/ticketing"');
    expect(source).not.toContain("navigate(-1)");
  });
});
