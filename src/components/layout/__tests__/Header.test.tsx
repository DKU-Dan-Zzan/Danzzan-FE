// 역할: 라우트별 Header 배경 정책(홈/부스맵 투명, 일반 페이지 그라디언트)을 검증합니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Route, Routes } from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";
import Header from "@/components/layout/Header";
import { authStore } from "@/store/common/authStore";

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
    authStore.clear();
    const mapMarkup = renderHeader("/map");

    expect(mapMarkup).toContain("bg-transparent shadow-none pt-[env(safe-area-inset-top)]");
  });

  it("공지 페이지에서는 투명 헤더 + 상단 오버레이를 렌더링한다", () => {
    authStore.clear();
    const noticeMarkup = renderHeader("/notice");

    expect(noticeMarkup).toContain("bg-transparent shadow-none pt-[env(safe-area-inset-top)]");
    expect(noticeMarkup).toContain("z-[45]");
    expect(noticeMarkup).toContain("backdrop-blur-md");
  });

  it("홈에서는 상단 그라디언트 헤더를 렌더링하고, 로그인 전 마이페이지에서는 홈 스타일 반투명 헤더를 렌더링한다", () => {
    authStore.clear();
    const homeMarkup = renderHeader("/");
    const guestMyPageMarkup = renderHeader("/mypage");

    expect(homeMarkup).toContain(
      "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_56%,transparent)_0%,color-mix(in_srgb,var(--surface)_44%,transparent)_16%",
    );
    expect(guestMyPageMarkup).toContain(
      "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_56%,transparent)_0%,color-mix(in_srgb,var(--surface)_44%,transparent)_16%",
    );
    expect(guestMyPageMarkup).not.toContain("z-[45]");
    expect(guestMyPageMarkup).not.toContain("backdrop-blur-md");
  });

  it("로그인된 마이페이지에서는 기존 불투명 오버레이 헤더를 유지한다", () => {
    authStore.setSession(
      {
        tokens: { accessToken: "student-token", refreshToken: "", expiresIn: null },
        user: null,
      },
      "student",
      { persist: false },
    );

    const myPageMarkup = renderHeader("/mypage");

    expect(myPageMarkup).toContain("bg-transparent shadow-none pt-[env(safe-area-inset-top)]");
    expect(myPageMarkup).toContain("bg-[color-mix(in_srgb,var(--surface)_78%,transparent)]");
    expect(myPageMarkup).toContain("shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--border-base)_35%,transparent)]");
  });

  it("타임테이블에서는 frosted glass 헤더 오버레이를 렌더링한다", () => {
    authStore.clear();
    const timetableMarkup = renderHeader("/timetable");

    expect(timetableMarkup).toContain("bg-transparent shadow-none pt-[env(safe-area-inset-top)]");
    expect(timetableMarkup).toContain("z-[45]");
    expect(timetableMarkup).toContain("backdrop-blur-md");
    expect(timetableMarkup).toContain("bg-white/85");
  });
});
