// 역할: layout 레이어의 Bottom Nav.test 동작과 회귀 조건을 검증하는 테스트입니다.
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import BottomNav from "@/components/layout/BottomNav";
import { authStore } from "@/store/common/authStore";

function renderBottomNav(location: string) {
  return renderToStaticMarkup(
    <StaticRouter location={location}>
      <BottomNav />
    </StaticRouter>,
  );
}

const createJwtLikeToken = (payload: Record<string, unknown>): string => {
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
};

describe("BottomNav", () => {
  afterEach(() => {
    authStore.clear();
    vi.restoreAllMocks();
  });

  it("SSR 렌더링에서 useLayoutEffect 경고를 출력하지 않는다", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderBottomNav("/map");

    const hasUseLayoutEffectWarning = errorSpy.mock.calls.some(([firstArg]) =>
      String(firstArg).includes("useLayoutEffect does nothing on the server"),
    );
    expect(hasUseLayoutEffectWarning).toBe(false);
  });

  it("5개 탭 구조(부스맵/타임테이블/HOME/공지사항/티켓팅)를 렌더링한다", () => {
    const markup = renderBottomNav("/notice");

    expect(markup).toContain(">부스맵<");
    expect(markup).toContain(">타임테이블<");
    expect(markup).toContain('aria-label="HOME"');
    expect(markup).toContain(">공지사항<");
    expect(markup).toContain(">티켓팅<");
    expect(markup).not.toContain(">내정보<");
  });

  it("중앙 HOME 탭은 원형 하이라이트 스타일을 사용한다", () => {
    const markup = renderBottomNav("/");

    expect(markup).toContain("bg-[var(--app-nav-home-highlight)]");
    expect(markup).toContain("text-[var(--on-primary)]");
    expect(markup).toContain("h-14 w-14");
    expect(markup).toContain("-translate-y-3");
  });

  it("하단 패널 배경은 좌우 여백 없이 전체 폭을 채운다", () => {
    const markup = renderBottomNav("/notice");

    expect(markup).toContain("inset-x-0");
    expect(markup).not.toContain("inset-x-2");
  });

  it("탭 링크에 키보드 포커스 스타일을 제공한다", () => {
    const markup = renderBottomNav("/notice");

    expect(markup).toContain("focus-visible:outline-none");
    expect(markup).toContain("focus-visible:ring-2");
    expect(markup).toContain("focus-visible:ring-[var(--ring)]");
  });

  it("모바일 셸 최대 폭을 토큰으로 사용한다", () => {
    const markup = renderBottomNav("/notice");

    expect(markup).toContain("max-w-[var(--app-mobile-shell-max-width)]");
    expect(markup).not.toContain("max-w-[430px]");
  });

  it("비로그인 상태에서는 티켓팅 탭이 로그인 redirect를 가리킨다", () => {
    authStore.clear();

    const markup = renderBottomNav("/notice");

    expect(markup).toContain('href="/ticket/login?redirect=%2Fticket%2Fticketing"');
  });

  it("student 로그인 상태에서는 티켓팅 탭이 티켓팅 홈을 가리킨다", () => {
    authStore.setSession(
      {
        tokens: {
          accessToken: createJwtLikeToken({ role: "ROLE_USER" }),
          refreshToken: "",
          expiresIn: null,
        },
        user: null,
      },
      "student",
    );

    const markup = renderBottomNav("/notice");

    expect(markup).toContain('href="/ticket/ticketing"');
  });

  it("admin 로그인 상태에서도 티켓팅 탭이 티켓팅 홈을 가리킨다", () => {
    authStore.setSession(
      {
        tokens: {
          accessToken: createJwtLikeToken({ role: "ROLE_ADMIN" }),
          refreshToken: "",
          expiresIn: null,
        },
        user: null,
      },
      "admin",
    );

    const markup = renderBottomNav("/notice");

    expect(markup).toContain('href="/ticket/ticketing"');
  });

  it("만료된 토큰 상태에서는 티켓팅 탭이 로그인 redirect를 가리킨다", () => {
    authStore.setSession(
      {
        tokens: {
          accessToken: createJwtLikeToken({
            role: "ROLE_ADMIN",
            exp: Math.floor(Date.now() / 1000) - 60,
          }),
          refreshToken: "",
          expiresIn: null,
        },
        user: null,
      },
      "admin",
    );

    const markup = renderBottomNav("/notice");

    expect(markup).toContain('href="/ticket/login?redirect=%2Fticket%2Fticketing"');
  });
});
