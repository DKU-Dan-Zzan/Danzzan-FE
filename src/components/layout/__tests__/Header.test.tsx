// 역할: 라우트별 Header 배경 정책(홈/부스맵/공지/타임테이블 투명, 그 외 그라디언트)을 검증합니다.
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

  it("홈에서는 포스터를 가리지 않도록 투명 헤더를 렌더링한다", () => {
    authStore.clear();
    const homeMarkup = renderHeader("/");

    expect(homeMarkup).toContain("bg-transparent shadow-none pt-[env(safe-area-inset-top)]");
    expect(homeMarkup).not.toContain(
      "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_56%,transparent)_0%",
    );
  });

  it("마이페이지 안내 화면도 배경이 어두우므로 투명 헤더를 렌더링한다", () => {
    authStore.clear();
    const guestMyPageMarkup = renderHeader("/mypage");

    expect(guestMyPageMarkup).toContain("bg-transparent shadow-none pt-[env(safe-area-inset-top)]");
    expect(guestMyPageMarkup).not.toContain(
      "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_56%,transparent)_0%",
    );
    expect(guestMyPageMarkup).not.toContain("z-[45]");
    expect(guestMyPageMarkup).not.toContain("backdrop-blur-md");
  });

  it("배경이 밝은 404 에서는 헤더 대비를 위해 반투명 막을 유지한다", () => {
    authStore.clear();
    const notFoundMarkup = renderHeader("/some-unknown-path");

    expect(notFoundMarkup).toContain(
      "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_56%,transparent)_0%,color-mix(in_srgb,var(--surface)_44%,transparent)_16%",
    );
  });

  it("로그인된 마이페이지에서는 헤더 막을 걷고 로고만 띄운다", () => {
    // 내 정보는 포스터가 헤더 뒤까지 올라온다. 막을 깔면 로고 아래에 흰 띠가 생겨
    // 포스터가 거기서부터 시작하는 것처럼 잘려 보인다.
    authStore.setSession(
      {
        tokens: { accessToken: `header.${btoa(JSON.stringify({ role: "ROLE_USER", exp: 9999999999 }))}.signature`, refreshToken: "", expiresIn: null },
        user: null,
      },
      { persist: false },
    );

    const myPageMarkup = renderHeader("/mypage");

    expect(myPageMarkup).toContain("bg-transparent shadow-none pt-[env(safe-area-inset-top)]");
    expect(myPageMarkup).not.toContain("bg-[color-mix(in_srgb,var(--surface)_78%,transparent)]");
    // 어두운 포스터 위에서도 읽히도록 로고 색을 보정한다.
    expect(myPageMarkup).toContain("app-header-logo--on-poster");
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
