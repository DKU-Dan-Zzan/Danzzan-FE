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

  it("활성 탭 인디케이터가 활성 아이콘/텍스트와 같은 토큰을 사용한다", () => {
    const markup = renderBottomNav("/map");

    expect(markup).toContain("text-[var(--app-nav-text-active)]");
    expect(markup).toContain("bg-[var(--app-nav-text-active)]");
    expect(markup).not.toContain("bg-[var(--accent)]");
  });

  it("활성 상태 전환용 마이크로 애니메이션 클래스를 포함한다", () => {
    const markup = renderBottomNav("/notice");

    expect(markup).toContain("active:scale-[0.99]");
    expect(markup).toContain("motion-reduce:transform-none");
    expect(markup).toContain("scale-[1.01]");
    expect(markup).not.toContain("-translate-y-[1px] scale-[1.04]");
    expect(markup).not.toContain("-translate-y-px");
    expect(markup).toContain("opacity-100 scale-x-100");
    expect(markup).toContain("opacity-0 scale-x-50");
  });

  it("탭 전환 애니메이션 duration은 120~160ms 구간을 사용한다", () => {
    const markup = renderBottomNav("/notice");

    expect(markup).toContain("duration-140");
    expect(markup).not.toContain("duration-200");
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
