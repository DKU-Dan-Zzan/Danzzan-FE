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

  it("The shared page keeps a festival-app tone and useful recovery actions", () => {
    const source = readSource("src/routes/not-found/NotFoundPage.tsx");

    expect(source).toContain("축제길을 잠깐 놓쳤어요");
    expect(source).toContain("DANFESTA / 404");
    expect(source).toContain('src="/DAN-ZZAN.png"');
    expect(source).toContain('to="/"');
    expect(source).toContain('to: "/map"');
    expect(source).toContain('to: "/ticket/ticketing"');
    expect(source).toContain("navigate(-1)");
  });
});
