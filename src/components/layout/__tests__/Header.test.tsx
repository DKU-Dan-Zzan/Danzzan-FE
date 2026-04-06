// 역할: 라우트별 Header 배경 정책(홈/부스맵 투명, 일반 페이지 그라디언트)을 검증합니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Route, Routes } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";
import Header from "@/components/layout/Header";

function renderHeader(pathname: string) {
  return renderToStaticMarkup(
    <StaticRouter location={pathname}>
      <Routes>
        <Route path="*" element={<Header />} />
      </Routes>
    </StaticRouter>,
  );
}

describe("Header", () => {
  it("홈과 부스맵에서는 safe-area 상단을 투명 헤더로 렌더링한다", () => {
    const homeMarkup = renderHeader("/");
    const mapMarkup = renderHeader("/map");

    expect(homeMarkup).toContain("bg-transparent shadow-none pt-[env(safe-area-inset-top)]");
    expect(mapMarkup).toContain("bg-transparent shadow-none pt-[env(safe-area-inset-top)]");
  });

  it("일반 페이지에서는 기존 상단 그라디언트 헤더를 유지한다", () => {
    const noticeMarkup = renderHeader("/notice");

    expect(noticeMarkup).toContain(
      "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_56%,transparent)_0%,color-mix(in_srgb,var(--surface)_44%,transparent)_16%",
    );
  });

  it("타임테이블에서는 Header를 렌더링하지 않는다", () => {
    const timetableMarkup = renderHeader("/timetable");

    expect(timetableMarkup).toBe("");
  });
});

