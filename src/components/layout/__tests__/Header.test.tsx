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
  it("부스맵에서는 safe-area 상단을 투명 헤더로 렌더링한다", () => {
    const mapMarkup = renderHeader("/map");

    expect(mapMarkup).toContain("bg-transparent shadow-none pt-[env(safe-area-inset-top)]");
  });

  it("공지 페이지에서는 투명 헤더 + 상단 오버레이를 렌더링한다", () => {
    const noticeMarkup = renderHeader("/notice");

    expect(noticeMarkup).toContain("bg-transparent shadow-none pt-[env(safe-area-inset-top)]");
    expect(noticeMarkup).toContain("z-[45]");
    expect(noticeMarkup).toContain("backdrop-blur-md");
  });

  it("홈에서는 상단 그라디언트 헤더를 렌더링하고, 마이페이지에서는 투명 헤더 + 오버레이를 렌더링한다", () => {
    const homeMarkup = renderHeader("/");
    const myPageMarkup = renderHeader("/mypage");

    expect(homeMarkup).toContain(
      "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_56%,transparent)_0%,color-mix(in_srgb,var(--surface)_44%,transparent)_16%",
    );
    expect(myPageMarkup).toContain("bg-transparent shadow-none pt-[env(safe-area-inset-top)]");
    expect(myPageMarkup).toContain("z-[45]");
    expect(myPageMarkup).toContain("backdrop-blur-md");
  });

  it("타임테이블에서는 frosted glass 헤더 오버레이를 렌더링한다", () => {
    const timetableMarkup = renderHeader("/timetable");

    expect(timetableMarkup).toContain("bg-transparent shadow-none pt-[env(safe-area-inset-top)]");
    expect(timetableMarkup).toContain("z-[45]");
    expect(timetableMarkup).toContain("backdrop-blur-md");
    expect(timetableMarkup).toContain("bg-white/85");
  });
});
