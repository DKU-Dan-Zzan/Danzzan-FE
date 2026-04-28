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

    expect(source).toContain("페이지를 찾을 수 없어요");
    expect(source).toContain("주소가 바뀌었거나 접근할 수 없는 페이지예요.");
    expect(source).toContain('to="/"');
    expect(source).toContain('src="/DAN-ZZAN.png"');
    expect(source).toContain("top-[30%]");
    expect(source).toContain("max-w-[320px]");
    expect(source).toContain("flex-col");
    expect(source).not.toContain("translate-y-16");
    expect(source).not.toContain("translate-y-8");
    expect(source).not.toContain("top-[45%]");
    expect(source).toContain("#0a559c");
    expect(source).toContain("#2f63f6");
    expect(source).not.toContain("#ff715b");
    expect(source).not.toContain("#ffb45f");
    expect(source).not.toContain("LOST GATE");
    expect(source).not.toContain("NO ROUTE");
    expect(source).not.toContain("FESTIVAL PASS");
    expect(source).not.toContain('to: "/map"');
    expect(source).not.toContain('to: "/ticket/ticketing"');
    expect(source).not.toContain("navigate(-1)");
  });
});
